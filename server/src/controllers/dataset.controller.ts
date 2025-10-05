import { Request, Response } from "express";
import { In } from "typeorm";
import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  Dataset,
  DatasetStatus,
  DatasetVisibility,
} from "../domain/entities/Dataset";
import {
  DatasetFile,
  DatasetFileStatus,
} from "../domain/entities/DatasetFile";
import { AppDataSource } from "../db/dataSource";
import {
  DatasetCreateInput,
  DatasetListQuery,
  DatasetUpdateInput,
} from "../domain/dtos/dataset.dto";
import {
  composeDetail,
  createShareToken,
  DatasetDetailDto,
  listDatasetsForOwner,
  listPublicDatasets,
  getDatasetDetailForOwner,
  getDatasetForShareToken,
  getPublicDataset,
} from "../services/dataset.service";
import {
  putObject,
  presignedGetUrl,
  getObjectStream,
} from "../services/minio.service";
import { publishDomainEvent } from "../services/eventBus.service";
import {
  DatasetAttachmentUploadedEvent,
  DatasetFileUploadedEvent,
} from "../@types/event.type";
import { embedDataset } from "../services/embeddingGateway.service";
import { BadRequest, NotFound } from "../utils/error";
import { logger } from "../utils/logger";
import {
  createDatasetAttachment,
  findDatasetAttachmentById,
} from "../repositories/datasetAttachment.repository";

const datasetRepo = () => AppDataSource.getRepository(Dataset);
const datasetFileRepo = () => AppDataSource.getRepository(DatasetFile);

function toDatasetDetailResponse(payload: DatasetDetailDto) {
  return payload;
}

export async function listMine(req: Request, res: Response) {
  const user = req.user as any;
  const query = req.query as DatasetListQuery;
  const datasets = await listDatasetsForOwner(user.id, query);
  return res.json({ items: datasets });
}

export async function create(req: Request, res: Response) {
  const user = req.user as any;
  const body = req.body as DatasetCreateInput;

  const dataset = datasetRepo().create({
    ownerId: user.id,
    name: body.name,
    description: body.description ?? null,
    visibility: body.visibility ?? DatasetVisibility.PRIVATE,
    status: DatasetStatus.EMPTY,
  });


  const savedDataset = await datasetRepo().save(dataset);

  await embedDataset(savedDataset);

  const detail = await composeDetail(savedDataset, {
    includeDownloads: false,
    includeObjectKeys: true,
  });
  return res.status(201).json(toDatasetDetailResponse(detail));
}

export async function getOne(req: Request, res: Response) {
  const user = req.user as any;
  const datasetId = req.params.datasetId;
  const detail = await getDatasetDetailForOwner(datasetId, user.id, {
    includeDownloads: true,
    includeObjectKeys: true,
  });
  return res.json(toDatasetDetailResponse(detail));
}

export async function update(req: Request, res: Response) {
  const user = req.user as any;
  const datasetId = req.params.datasetId;
  const body = req.body as DatasetUpdateInput;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  const nextName = body.name !== undefined ? body.name : dataset.name;
  const currentDescription = dataset.description ?? null;
  const nextDescription =
    body.description !== undefined ? body.description ?? null : currentDescription;

  const nameChanged = nextName !== dataset.name;
  const descriptionChanged = nextDescription !== currentDescription;
  const shouldReembed = nameChanged || descriptionChanged;

  dataset.name = nextName;
  dataset.description = nextDescription;
  if (body.visibility !== undefined) {
    dataset.visibility = body.visibility;
  }

  const savedDataset = await datasetRepo().save(dataset);

  if (shouldReembed) {
    await embedDataset(savedDataset);
  }

  const detail = await getDatasetDetailForOwner(datasetId, user.id, {
    includeDownloads: true,
    includeObjectKeys: true,
  });
  return res.json(toDatasetDetailResponse(detail));
}

function ensureTifExtension(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".tif" || ext === ".tiff";
}

export async function uploadTifs(req: Request, res: Response) {
  const user = req.user as any;
  const datasetId = req.params.datasetId;
  const files = (req.files as Express.Multer.File[]) ?? [];

  if (!files.length) {
    throw new BadRequest("LegalĂˇbb egy TIF fĂˇjlt fel kell tĂ¶lteni");
  }

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  try {
    for (const file of files) {
      if (!ensureTifExtension(file.originalname)) {
        throw new BadRequest(
          `${file.originalname} nem TIF formĂˇtumĂş. Csak .tif vagy .tiff engedĂ©lyezett.`
        );
      }

      const extension = path.extname(file.originalname) || ".tif";
      const objectKey = `datasets/${dataset.id}/sources/${randomUUID()}${extension}`;
      await putObject(objectKey, createReadStream(file.path), file.mimetype);

      const record = datasetFileRepo().create({
        datasetId: dataset.id,
        originalFilename: file.originalname,
        mimeType: file.mimetype || "image/tiff",
        objectKey,
        size: file.size ? file.size.toString() : null,
        status: DatasetFileStatus.UPLOADED,
      });
      await datasetFileRepo().save(record);
      await publishDomainEvent<DatasetFileUploadedEvent>({
        name: "dataset.file.uploaded",
        payload: {
          datasetId: dataset.id,
          datasetFileId: record.id,
          ownerId: dataset.ownerId,
          objectKey: record.objectKey,
          originalFilename: record.originalFilename,
        },
      });
    }

    dataset.status = DatasetStatus.UPLOADING;
    await datasetRepo().save(dataset);
  } finally {
    await Promise.all(
      files.map((file) => fs.unlink(file.path).catch(() => undefined))
    );
  }

  const detail = await getDatasetDetailForOwner(datasetId, user.id, {
    includeDownloads: true,
    includeObjectKeys: true,
  });
  return res.status(201).json(toDatasetDetailResponse(detail));
}

export async function uploadAttachments(req: Request, res: Response) {
  const user = req.user as any;
  const datasetId = req.params.datasetId;
  const files = (req.files as Express.Multer.File[]) ?? [];

  if (!files.length) {
    throw new BadRequest("LegalĂˇbb egy mellĂ©kletet fel kell tĂ¶lteni");
  }

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  try {
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".pdf") {
        throw new BadRequest(`${file.originalname} nem PDF formĂˇtumĂş.`);
      }

      const objectKey = `datasets/${dataset.id}/attachments/${randomUUID()}${ext}`;
      await putObject(objectKey, createReadStream(file.path), file.mimetype);

      const attachment = await createDatasetAttachment({
        datasetId: dataset.id,
        originalFilename: file.originalname,
        mimeType: file.mimetype || "application/pdf",
        objectKey,
        size: file.size ? file.size.toString() : null,
      });

      await publishDomainEvent<DatasetAttachmentUploadedEvent>({
        name: "dataset.attachment.uploaded",
        payload: {
          datasetId: dataset.id,
          attachmentId: attachment.id,
          ownerId: dataset.ownerId,
          objectKey: attachment.objectKey,
          originalFilename: attachment.originalFilename,
        },
      });
    }
  } finally {
    await Promise.all(
      files.map((file) => fs.unlink(file.path).catch(() => undefined))
    );
  }

  const detail = await getDatasetDetailForOwner(datasetId, user.id, {
    includeDownloads: true,
    includeObjectKeys: true,
  });
  return res.status(201).json(toDatasetDetailResponse(detail));
}

export async function generateShareLink(req: Request, res: Response) {
  const user = req.user as any;
  const datasetId = req.params.datasetId;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  dataset.shareToken = dataset.shareToken ?? createShareToken();
  dataset.visibility = DatasetVisibility.LINK;
  await datasetRepo().save(dataset);

  return res.json({ shareToken: dataset.shareToken });
}

export async function revokeShareLink(req: Request, res: Response) {
  const user = req.user as any;
  const datasetId = req.params.datasetId;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  dataset.shareToken = null;
  if (dataset.visibility === DatasetVisibility.LINK) {
    dataset.visibility = DatasetVisibility.PRIVATE;
  }
  await datasetRepo().save(dataset);

  return res.status(204).send();
}

export async function getFileDownloadUrl(req: Request, res: Response) {
  const user = req.user as any;
  const { datasetId, fileId } = req.params;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  const file = await datasetFileRepo().findOne({
    where: { id: fileId, datasetId },
  });
  if (!file) throw new NotFound("A fĂˇjl nem talĂˇlhatĂł");

  const url = await presignedGetUrl(file.objectKey);
  return res.json({ url });
}

async function streamObjectToResponse(
  res: Response,
  objectKey: string,
  filename: string | null,
  contentType?: string | null,
  size?: string | null,
) {
  const stream = await getObjectStream(objectKey);
  if (contentType) {
    res.setHeader("Content-Type", contentType);
  }
  if (size) {
    const parsed = Number(size);
    if (!Number.isNaN(parsed)) {
      res.setHeader("Content-Length", String(parsed));
    }
  }
  if (filename) {
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
  }

  return new Promise<void>((resolve, reject) => {
    stream.on("error", (err) => {
      res.destroy(err as Error);
      reject(err);
    });
    res.on("error", (err) => {
      stream.destroy(err as Error);
      reject(err);
    });
    res.on("close", () => {
      stream.destroy();
    });
    stream.pipe(res);
    stream.on("end", () => resolve());
  });
}

export async function streamFileContent(req: Request, res: Response) {
  const user = req.user as any;
  const { datasetId, fileId } = req.params;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatás nem található");
  }

  const file = await datasetFileRepo().findOne({
    where: { id: fileId, datasetId },
  });
  if (!file) throw new NotFound("A fájl nem található");

  if (!file.objectKey) {
    throw new NotFound("A fájlnak nincs tárolt objektum kulcsa");
  }

  await streamObjectToResponse(
    res,
    file.objectKey,
    file.originalFilename ?? null,
    file.mimeType ?? null,
    file.size ?? null,
  );
}

export async function streamFileMbtiles(req: Request, res: Response) {

  console.log(req.headers)
  const user = req.user as any;
  const { datasetId, fileId } = req.params;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatás nem található");
  }

  const file = await datasetFileRepo().findOne({
    where: { id: fileId, datasetId },
  });
  if (!file || !file.mbtilesKey) {
    throw new NotFound("A feldolgozott MBTiles nem érhető el");
  }

  await streamObjectToResponse(
    res,
    file.mbtilesKey,
    `${file.id}.mbtiles`,
    "application/octet-stream",
    file.mbtilesSize ?? null,
  );
}

export async function getFileMbtilesDownloadUrl(req: Request, res: Response) {
  const user = req.user as any;
  const { datasetId, fileId } = req.params;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  const file = await datasetFileRepo().findOne({
    where: { id: fileId, datasetId },
  });
  if (!file || !file.mbtilesKey) {
    throw new NotFound("A feldolgozott MBTiles nem Ă©rhetĹ‘ el");
  }

  const url = await presignedGetUrl(file.mbtilesKey);
  return res.json({ url });
}

export async function getAttachmentDownloadUrl(req: Request, res: Response) {
  const user = req.user as any;
  const { datasetId, attachmentId } = req.params;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatĂˇs nem talĂˇlhatĂł");
  }

  const attachment = await findDatasetAttachmentById(attachmentId);
  if (!attachment || attachment.datasetId !== datasetId) {
    throw new NotFound("A melléklet nem található");
  }

  if (!attachment) throw new NotFound("A mellĂ©klet nem talĂˇlhatĂł");

  const url = await presignedGetUrl(attachment.objectKey);
  return res.json({ url });
}

export async function listPublic(req: Request, res: Response) {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const datasets = await listPublicDatasets(search);
  return res.json({ items: datasets });
}

export async function getShared(req: Request, res: Response) {
  const token = req.params.token;
  const detail = await getDatasetForShareToken(token, {
    includeDownloads: true,
    includeObjectKeys: false,
  });
  return res.json(toDatasetDetailResponse(detail));
}

export async function getSharedFileDownloadUrl(req: Request, res: Response) {
  const token = req.params.token;
  const fileId = req.params.fileId;

  const detail = await getDatasetForShareToken(token, {
    includeDownloads: false,
    includeObjectKeys: true,
  });

  const file = detail.files.find((f) => f.id === fileId);
  if (!file || !file.objectKey) {
    throw new NotFound("A fĂˇjl nem talĂˇlhatĂł a megosztott kutatĂˇsban");
  }

  const url = await presignedGetUrl(file.objectKey);
  return res.json({ url });
}

export async function getSharedMbtilesUrl(req: Request, res: Response) {
  const token = req.params.token;
  const fileId = req.params.fileId;

  const detail = await getDatasetForShareToken(token, {
    includeDownloads: false,
    includeObjectKeys: true,
  });

  const file = detail.files.find((f) => f.id === fileId);
  if (!file || !file.mbtilesKey) {
    throw new NotFound("Ez a fĂˇjl mĂ©g nem kĂ©szĂĽlt el MBTiles formĂˇtumban");
  }

  const url = await presignedGetUrl(file.mbtilesKey);
  return res.json({ url });
}

export async function getSharedAttachmentDownloadUrl(req: Request, res: Response) {
  const token = req.params.token;
  const attachmentId = req.params.attachmentId;

  const detail = await getDatasetForShareToken(token, {
    includeDownloads: false,
    includeObjectKeys: true,
  });

  const attachment = detail.attachments.find((a) => a.id === attachmentId);
  if (!attachment || !attachment.objectKey) {
    throw new NotFound("A mellĂ©klet nem Ă©rhetĹ‘ el");
  }

  const url = await presignedGetUrl(attachment.objectKey);
  return res.json({ url });
}

export async function getPublic(req: Request, res: Response) {
  const datasetId = req.params.datasetId;
  const detail = await getPublicDataset(datasetId, {
    includeDownloads: true,
    includeObjectKeys: false,
  });
  return res.json(toDatasetDetailResponse(detail));
}

export async function getPublicFileDownloadUrl(req: Request, res: Response) {
  const { datasetId, fileId } = req.params;
  const detail = await getPublicDataset(datasetId, {
    includeDownloads: false,
    includeObjectKeys: true,
  });
  const file = detail.files.find((f) => f.id === fileId);
  if (!file || !file.objectKey) {
    throw new NotFound("A fĂˇjl nem talĂˇlhatĂł a nyilvĂˇnos kutatĂˇsban");
  }
  const url = await presignedGetUrl(file.objectKey);
  return res.json({ url });
}

export async function getPublicMbtilesUrl(req: Request, res: Response) {
  const { datasetId, fileId } = req.params;
  const detail = await getPublicDataset(datasetId, {
    includeDownloads: false,
    includeObjectKeys: true,
  });
  const file = detail.files.find((f) => f.id === fileId);
  if (!file || !file.mbtilesKey) {
    throw new NotFound("Ez a fĂˇjl mĂ©g nem kĂ©szĂĽlt el MBTiles formĂˇtumban");
  }
  const url = await presignedGetUrl(file.mbtilesKey);
  return res.json({ url });
}

export async function streamPublicFileContent(req: Request, res: Response) {
  const { datasetId, fileId } = req.params;
  const detail = await getPublicDataset(datasetId, {
    includeDownloads: false,
    includeObjectKeys: true,
  });
  const file = detail.files.find((f) => f.id === fileId);
  if (!file || !file.objectKey) {
    throw new NotFound("A fájl nem található a nyilvános kutatásban");
  }

  await streamObjectToResponse(
    res,
    file.objectKey,
    file.originalFilename ?? null,
    file.mimeType ?? null,
    file.size ?? null as any,
  );
}

export async function streamPublicMbtiles(req: Request, res: Response) {
  const { datasetId, fileId } = req.params;
  const detail = await getPublicDataset(datasetId, {
    includeDownloads: false,
    includeObjectKeys: true,
  });

  const file = detail.files.find((f) => f.id === fileId);
  if (!file || !file.mbtilesKey) {
    throw new NotFound("Ez a fájl még nem készült el MBTiles formátumban");
  }

  await streamObjectToResponse(
    res,
    file.mbtilesKey,
    `${file.id}.mbtiles`,
    "application/octet-stream",
    file.mbtilesSize ?? null as any,
  );
}

export async function getPublicAttachmentDownloadUrl(req: Request, res: Response) {
  const { datasetId, attachmentId } = req.params;
  const detail = await getPublicDataset(datasetId, {
    includeDownloads: false,
    includeObjectKeys: true,
  });
  const attachment = detail.attachments.find((a) => a.id === attachmentId);
  if (!attachment || !attachment.objectKey) {
    throw new NotFound("A mellĂ©klet nem Ă©rhetĹ‘ el");
  }
  const url = await presignedGetUrl(attachment.objectKey);
  return res.json({ url });
}


export async function getDefault(req:Request, res:Response) {
  
  const defaultDataSet = await datasetFileRepo().findOne({
    where:{},
    order: {
        createdAt: "DESC",
    },
});

  return res.json(defaultDataSet);
}


export async function search(req: Request, res: Response) {
  try {
    const q = req.query.q as string;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const repo = datasetRepo();

    // Query builder: Case-insensitive startswith keresďż˝s a name field-en
    const matchingDatasets = await repo
      .createQueryBuilder('dataset')
      .where('LOWER(dataset.name) LIKE LOWER(:q) || \'%\'', { q: q.trim() })
      .orderBy('dataset.createdAt', 'DESC')
      .getMany();

    const datasetIds = matchingDatasets.map((dataset) => dataset.id);
    const previewMap = new Map<string, { key: string | null; url: string | null }>();

    if (datasetIds.length > 0) {
      const files = await datasetFileRepo().find({
        where: { datasetId: In(datasetIds) },
        order: { createdAt: 'DESC' },
      });

      for (const file of files) {
        if (previewMap.has(file.datasetId)) {
          continue;
        }

        if (file.previewImageKey) {
          try {
            const url = await presignedGetUrl(file.previewImageKey);
            previewMap.set(file.datasetId, { key: file.previewImageKey, url });
          } catch (err) {
            logger.error('Failed to create preview presigned URL', {
              err,
              datasetFileId: file.id,
            });
            previewMap.set(file.datasetId, { key: file.previewImageKey, url: null });
          }
        } else {
          previewMap.set(file.datasetId, { key: null, url: null });
        }
      }
    }

    const payload = matchingDatasets.map((dataset) => {
      const preview = previewMap.get(dataset.id);
      return {
        ...dataset,
        previewImageKey: preview?.key ?? null,
        previewImageUrl: preview?.url ?? null,
        thumbnailUrl: preview?.url ?? null,
      };
    });

    return res.json(payload);
  } catch (error) {
    console.error('Hiba a keresďż˝skor:', error);
    return res.status(500).json({ error: 'Keresďż˝si hiba tďż˝rtďż˝nt' });
  }
}

export async function getDatasetFile(req: Request, res: Response) {
  const { datasetId } = req.params;

  const files = await datasetFileRepo().find({
    where: { datasetId },
    order: { createdAt: 'DESC' },
  });

  const file =
    files.find((candidate) => candidate.tilesetKey || candidate.mbtilesKey) ??
    files[0];

  if (!file) {
    return res
      .status(404)
      .json({ error: 'No dataset file found for the requested dataset.' });
  }

  let previewImageUrl: string | null = null;
  if (file.previewImageKey) {
    try {
      previewImageUrl = await presignedGetUrl(file.previewImageKey);
    } catch (err) {
      logger.error('Failed to create preview presigned URL', {
        err,
        datasetFileId: file.id,
      });
    }
  }

  const serialized = { ...file, previewImageUrl };

  return res.json({ file: serialized });
}








