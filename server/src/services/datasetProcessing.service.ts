import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AppDataSource } from "../db/dataSource";
import {
  Dataset,
  DatasetStatus,
} from "../domain/entities/Dataset";
import {
  DatasetFile,
  DatasetFileStatus,
} from "../domain/entities/DatasetFile";
import { DatasetFileUploadedEvent } from "../@types/event.type";
import { downloadObject, putObjectFromFile } from "./minio.service";
import { logger } from "../utils/logger";
import { recalculateDatasetStatus } from "./dataset.service";
import { sendDatasetStatusUpdate } from "./websocket.service";
import { publishDomainEvent } from "./eventBus.service";
import { DatasetProcessingCompletedEvent } from "../@types/event.type";
import { env } from "../config/env";

const exec = promisify(execFile);

const datasetRepo = () => AppDataSource.getRepository(Dataset);
const datasetFileRepo = () => AppDataSource.getRepository(DatasetFile);

async function runCommand(command: string, args: string[], cwd: string) {
  logger.debug("Running command", { command, args });
  await exec(command, args, { cwd });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function buildConfigKey(dataset: Dataset, file: DatasetFile) {
  const base = slugify(dataset.name ?? file.originalFilename ?? "");
  if (base) {
    return `${base}-${file.id.slice(0, 8)}`;
  }
  const fallback = slugify(file.id);
  return fallback || file.id;
}

async function updateTileserverConfigEntry(entryKey: string, mbtilesFilename: string, center?: { lat: number; lng: number }) {
  try {
    const configPath = path.resolve(env.TILESERVER_CONFIG_PATH);

    let configRaw = "";
    try {
      configRaw = await fs.readFile(configPath, "utf8");
    } catch (readErr: any) {
      if (readErr.code !== "ENOENT") {
        throw readErr;
      }
    }

    let config: any = {};
    if (configRaw) {
      try {
        config = JSON.parse(configRaw);
      } catch (parseErr) {
        logger.warn("Tileserver config parse failed, creating new config", { parseErr, configPath });
        config = {};
      }
    }

    if (!config || typeof config !== "object") config = {};
    const dataSectionKey = "data";
    if (!config[dataSectionKey] || typeof config[dataSectionKey] !== "object") {
      config[dataSectionKey] = {};
    }
    const dataSection = config[dataSectionKey] as Record<string, any>;

    const existing = dataSection[entryKey];
    const nextEntry = typeof existing === "object" && existing !== null ? { ...existing } : {};
    const currentCenter = nextEntry?.center;
    const needsCenterUpdate = !!center && (!currentCenter || currentCenter.lat !== center.lat || currentCenter.lng !== center.lng);
    const needsTileUpdate = nextEntry.mbtiles !== mbtilesFilename;

    if (!needsTileUpdate && !needsCenterUpdate) {
      return true;
    }

    nextEntry.mbtiles = mbtilesFilename;
    if (center) {
      nextEntry.center = center;
    }
    dataSection[entryKey] = nextEntry;

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    logger.info("Tileserver config updated", { configPath, entryKey, mbtilesFilename, center });
    return true;
  } catch (err) {
    logger.error("Failed to update tileserver config", {
      err,
      configPath: env.TILESERVER_CONFIG_PATH,
      entryKey,
    });
    return false;
  }
}

async function restartTileserverService() {
  const serviceName = env.TILESERVER_COMPOSE_SERVICE?.trim();
  if (!serviceName) {
    return;
  }
  try {
    const composeFilePath = path.resolve(env.TILESERVER_COMPOSE_FILE);
    await exec("docker", [
      "compose",
      "-f",
      composeFilePath,
      "restart",
      serviceName,
    ]);
    logger.info("Tileserver service restarted", { serviceName, composeFilePath });
  } catch (err) {
    logger.error("Failed to restart tileserver service", {
      err,
      serviceName: env.TILESERVER_COMPOSE_SERVICE,
    });
  }
}

async function parseDimensions(filePath: string) {
  const { stdout } = await exec("gdalinfo", [filePath]);
  const match = stdout.match(/Size is\s+(\d+),\s*(\d+)/);
  if (!match) {
    throw new Error("Nem sikerült kiolvasni a kép méretét (gdalinfo)");
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  return { width, height };
}

async function extractCenterFromMbtiles(mbtilesPath: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const { stdout } = await exec("sqlite3", [
      mbtilesPath,
      "SELECT value FROM metadata WHERE name='center' LIMIT 1;",
    ]);
    const trimmed = stdout?.toString().trim();
    if (trimmed) {
      const parts = trimmed.split(/[,\s]+/).filter(Boolean);
      if (parts.length >= 2) {
        const lng = Number(parts[0]);
        const lat = Number(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      }
    }

    const boundsResult = await exec("sqlite3", [
      mbtilesPath,
      "SELECT value FROM metadata WHERE name='bounds' LIMIT 1;",
    ]).catch(() => ({ stdout: "" }));
    const boundsRaw = boundsResult.stdout?.toString().trim();
    if (boundsRaw) {
      const parts = boundsRaw.split(/[,\s]+/).filter(Boolean);
      if (parts.length >= 4) {
        const minLng = Number(parts[0]);
        const minLat = Number(parts[1]);
        const maxLng = Number(parts[2]);
        const maxLat = Number(parts[3]);
        if ([minLat, minLng, maxLat, maxLng].every(Number.isFinite)) {
          return {
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2,
          };
        }
      }
    }
  } catch (err) {
    logger.warn("Unable to extract center from MBTiles", { err, mbtilesPath });
  }
  return null;
}

export async function processDatasetFile(event: DatasetFileUploadedEvent) {
  const { datasetFileId } = event.payload;

  const file = await datasetFileRepo().findOne({
    where: { id: datasetFileId },
    relations: { dataset: true },
  });

  if (!file) {
    logger.warn("Dataset file not found for processing", { datasetFileId });
    return;
  }

  const dataset = file.dataset;

  file.status = DatasetFileStatus.PROCESSING;
  file.errorMessage = null;
  await datasetFileRepo().save(file);

  await datasetRepo().update(dataset.id, {
    status: DatasetStatus.PROCESSING,
    readyAt: null,
  });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `dataset-${file.id}-`));
  const sourcePath = path.join(tmpDir, "source.tif");
  const mercPath = path.join(tmpDir, "merc.tif");
  const mbtilesPath = path.join(tmpDir, `${file.id}.mbtiles`);

  try {
    await downloadObject(file.objectKey, sourcePath);

    const { width, height } = await parseDimensions(sourcePath);
    file.width = width;
    file.height = height;
    await datasetFileRepo().save(file);

    await runCommand("gdal_translate", [
      "-a_srs",
      "EPSG:3857",
      "-a_ullr",
      "0",
      String(height),
      String(width),
      "0",
      sourcePath,
      mercPath,
    ], tmpDir);

    await runCommand("gdal_translate", [
      "-of",
      "MBTILES",
      mercPath,
      mbtilesPath,
    ], tmpDir);

    await runCommand("gdaladdo", [
      "-r",
      "bilinear",
      mbtilesPath,
      "2",
      "4",
      "8",
      "16",
      "32",
      "64",
    ], tmpDir);

    const mbtilesKey = `datasets/${dataset.id}/tiles/${file.id}.mbtiles`;
    await putObjectFromFile(mbtilesKey, mbtilesPath, "application/x-sqlite3");


    //Compress
    try {
      const previewFilename = `${file.id}-preview.jpg`;
      const previewPath = path.join(tmpDir, previewFilename);

      await runCommand(
        "gdal_translate",
        [
          "-of",
          "JPEG",
          "-outsize",
          "512",
          "0",
          "-co",
          "QUALITY=75",
          sourcePath,
          previewPath,
        ],
        tmpDir
      );

      const previewKey = `datasets/${dataset.id}/previews/${file.id}.jpg`;
      await putObjectFromFile(previewKey, previewPath, "image/jpeg");

      const previewStats = await fs.stat(previewPath);
      file.previewImageKey = previewKey;
      file.previewImageMimeType = "image/jpeg";
      file.previewImageSize = previewStats.size.toString();

      try {
        const { stdout }:any = await exec("gdalinfo", ["-json", previewPath], { cwd: tmpDir });
        let infoRaw: string | null = null;
        if (typeof stdout === "string") {
          infoRaw = stdout;
        } else if (Buffer.isBuffer(stdout)) {
          infoRaw = stdout.toString("utf8");
        }
        const info = infoRaw ? JSON.parse(infoRaw) : {};
        const size = Array.isArray(info?.size) ? info.size : null;
        if (size && size.length >= 2) {
          const [width, height] = size;
          if (Number.isFinite(Number(width))) {
            file.previewImageWidth = Number(width);
          }
          if (Number.isFinite(Number(height))) {
            file.previewImageHeight = Number(height);
          }
        }
      } catch (metaErr) {
        logger.warn("Failed to extract preview metadata", {
          err: metaErr,
          datasetFileId: file.id,
        });
      }

      await fs.unlink(previewPath).catch(() => undefined);
    } catch (previewErr) {
      logger.warn("Preview image generation failed", {
        err: previewErr,
        datasetFileId: file.id,
      });
    }


    let localTilePath = mbtilesPath;
    let configUpdated = false;
    let center: { lat: number; lng: number } | null = null;
    try {
      const localTilesDir = path.resolve(env.DATASET_LOCAL_TILE_DIR);
      await fs.mkdir(localTilesDir, { recursive: true });
      const configEntryKey = buildConfigKey(dataset, file);
      const localTileFilename = `${configEntryKey}.mbtiles`;
      localTilePath = path.join(localTilesDir, localTileFilename);
      await fs.copyFile(mbtilesPath, localTilePath);
      center = await extractCenterFromMbtiles(localTilePath).catch(() => null);
      configUpdated = await updateTileserverConfigEntry(configEntryKey, localTileFilename, center ?? undefined);
      file.tilesetKey = configEntryKey;
      if (center) {
        file.centerLat = center.lat;
        file.centerLng = center.lng;
      }
    } catch (copyErr) {
      logger.error("Failed to copy MBTiles to local directory", {
        err: copyErr,
        datasetFileId: file.id,
        targetDir: env.DATASET_LOCAL_TILE_DIR,
      });
    }

    const stats = await fs.stat(mbtilesPath);
    file.mbtilesKey = mbtilesKey;
    file.mbtilesSize = stats.size.toString();
    file.status = DatasetFileStatus.READY;
    file.processedAt = new Date();
    await datasetFileRepo().save(file);

    const updatedDataset = await recalculateDatasetStatus(dataset.id);

    if (updatedDataset.status === DatasetStatus.READY) {
      sendDatasetStatusUpdate(updatedDataset.ownerId, {
        type: "dataset:status",
        datasetId: updatedDataset.id,
        status: updatedDataset.status,
        fileId: file.id,
      });

      await publishDomainEvent<DatasetProcessingCompletedEvent>({
        name: "dataset.processing.completed",
        payload: {
          datasetId: updatedDataset.id,
          ownerId: updatedDataset.ownerId,
          status: updatedDataset.status,
        },
      });
    }

    if (configUpdated) {
      await restartTileserverService();
    }
  } catch (err) {
    logger.error("Dataset file processing failed", {
      err,
      datasetId: dataset.id,
      datasetFileId,
    });
    file.status = DatasetFileStatus.FAILED;
    file.errorMessage = err instanceof Error ? err.message : "Ismeretlen hiba";
    await datasetFileRepo().save(file);
    await datasetRepo().update(dataset.id, {
      status: DatasetStatus.FAILED,
      readyAt: null,
    });

    await publishDomainEvent<DatasetProcessingCompletedEvent>({
      name: "dataset.processing.completed",
      payload: {
        datasetId: dataset.id,
        ownerId: dataset.ownerId,
        status: DatasetStatus.FAILED,
      },
    });

    sendDatasetStatusUpdate(dataset.ownerId, {
      type: "dataset:status",
      datasetId: dataset.id,
      status: DatasetStatus.FAILED,
      fileId: file.id,
      message: file.errorMessage ?? undefined,
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}




