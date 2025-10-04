import { randomUUID } from "node:crypto";
import { FindOptionsWhere, ILike } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import {
  Dataset,
  DatasetStatus,
  DatasetVisibility,
} from "../domain/entities/Dataset";
import {
  DatasetFile,
  DatasetFileStatus,
} from "../domain/entities/DatasetFile";
import { DatasetAttachment } from "../domain/entities/DatasetAttachment";
import { presignedGetUrl } from "./minio.service";
import { Forbidden, NotFound } from "../utils/error";
import { logger } from "../utils/logger";

const datasetRepository = () => AppDataSource.getRepository(Dataset);
const datasetFileRepository = () => AppDataSource.getRepository(DatasetFile);
const datasetAttachmentRepository = () =>
  AppDataSource.getRepository(DatasetAttachment);

function uniqueById<T extends { id: string }>(items?: T[]): T[] {
  if (!items) return [];
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export interface DatasetSummaryDto {
  id: string;
  name: string;
  description: string | null;
  visibility: DatasetVisibility;
  status: DatasetStatus;
  shareToken: string | null;
  readyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fileCount: number;
  attachmentCount: number;
}

export interface DatasetFileDto {
  id: string;
  originalFilename: string;
  mimeType: string;
  size: number | null;
  width: number | null;
  height: number | null;
  status: DatasetFileStatus;
  errorMessage: string | null;
  objectKey?: string;
  downloadUrl?: string;
  mbtilesKey?: string | null;
  mbtilesDownloadUrl?: string | null;
  mbtilesSize?: number | null;
  tilesetKey?: string | null;
  previewImageKey?: string | null;
  previewImageMimeType?: string | null;
  previewImageSize?: number | null;
  previewImageWidth?: number | null;
  previewImageHeight?: number | null;
  previewImageUrl?: string | null;
  centerLat?: number | null;
  centerLng?: number | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
}

export interface DatasetAttachmentDto {
  id: string;
  originalFilename: string;
  mimeType: string;
  size: number | null;
  objectKey?: string;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatasetDetailDto extends DatasetSummaryDto {
  files: DatasetFileDto[];
  attachments: DatasetAttachmentDto[];
}

type DetailOptions = {
  includeDownloads?: boolean;
  includeObjectKeys?: boolean;
};

function toSummary(dataset: Dataset): DatasetSummaryDto {
  const files = uniqueById(dataset.files);
  const attachments = uniqueById(dataset.attachments);
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description ?? null,
    visibility: dataset.visibility,
    status: dataset.status,
    shareToken: dataset.shareToken ?? null,
    readyAt: dataset.readyAt ?? null,
    createdAt: dataset.createdAt,
    updatedAt: dataset.updatedAt,
    fileCount: files.length,
    attachmentCount: attachments.length,
  };
}

async function toFileDto(
  file: DatasetFile,
  opts: DetailOptions
): Promise<DatasetFileDto> {
  const result: DatasetFileDto = {
    id: file.id,
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    size: file.size ? Number(file.size) : null,
    width: file.width ?? null,
    height: file.height ?? null,
    status: file.status,
    errorMessage: file.errorMessage ?? null,
    mbtilesKey: file.mbtilesKey ?? null,
    mbtilesSize: file.mbtilesSize ? Number(file.mbtilesSize) : null,
    previewImageKey: opts.includeObjectKeys ? file.previewImageKey ?? null : null,
    previewImageMimeType: file.previewImageMimeType ?? null,
    previewImageSize: file.previewImageSize ? Number(file.previewImageSize) : null,
    previewImageWidth: file.previewImageWidth ?? null,
    previewImageHeight: file.previewImageHeight ?? null,
    previewImageUrl: null,
    tilesetKey: file.tilesetKey ?? null,
    centerLat: file.centerLat ?? null,
    centerLng: file.centerLng ?? null,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    processedAt: file.processedAt ?? null,
  };

  if (opts.includeObjectKeys) {
    result.objectKey = file.objectKey;
  }

  if (opts.includeDownloads) {
    try {
      result.downloadUrl = await presignedGetUrl(file.objectKey);
    } catch (err) {
      logger.error("Failed to create presigned URL for dataset file", {
        err,
        datasetFileId: file.id,
      });
    }

    if (file.mbtilesKey) {
      try {
        result.mbtilesDownloadUrl = await presignedGetUrl(file.mbtilesKey);
      } catch (err) {
        logger.error("Failed to create presigned URL for MBTiles", {
          err,
          datasetFileId: file.id,
        });
      }
    }

    if (file.previewImageKey) {
      try {
        result.previewImageUrl = await presignedGetUrl(file.previewImageKey);
      } catch (err) {
        logger.error("Failed to create presigned URL for preview image", {
          err,
          datasetFileId: file.id,
        });
      }
    }
  }

  return result;
}

async function toAttachmentDto(
  attachment: DatasetAttachment,
  opts: DetailOptions
): Promise<DatasetAttachmentDto> {
  const result: DatasetAttachmentDto = {
    id: attachment.id,
    originalFilename: attachment.originalFilename,
    mimeType: attachment.mimeType,
    size: attachment.size ? Number(attachment.size) : null,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
  };

  if (opts.includeObjectKeys) {
    result.objectKey = attachment.objectKey;
  }

  if (opts.includeDownloads) {
    try {
      result.downloadUrl = await presignedGetUrl(attachment.objectKey);
    } catch (err) {
      logger.error("Failed to create presigned URL for attachment", {
        err,
        attachmentId: attachment.id,
      });
    }
  }

  return result;
}

export async function listDatasetsForOwner(
  ownerId: string,
  filters: { visibility?: DatasetVisibility; search?: string } = {}
): Promise<DatasetSummaryDto[]> {
  const conditions: FindOptionsWhere<Dataset>[] = [];

  if (filters.search) {
    const like = ILike(`%${filters.search}%`);
    conditions.push({ ownerId, name: like });
    conditions.push({ ownerId, description: like });
  } else {
    conditions.push({ ownerId });
  }

  if (filters.visibility) {
    conditions.forEach((cond) => (cond.visibility = filters.visibility!));
  }

  const items = await datasetRepository().find({
    where: conditions,
    relations: { files: true, attachments: true },
    order: { createdAt: "DESC" },
  });

  const uniqueDatasets = Array.from(
    new Map(items.map((item) => [item.id, item])).values()
  );

  return uniqueDatasets.map(toSummary);
}

async function ensureOwnership(dataset: Dataset | null, ownerId: string): Promise<Dataset> {
  if (!dataset) throw new NotFound("A keresett kutatás nem található");
  if (dataset.ownerId !== ownerId) {
    throw new Forbidden("Ehhez a kutatáshoz nincs jogosultságod");
  }
  return dataset;
}

export async function getDatasetDetailForOwner(
  datasetId: string,
  ownerId: string,
  opts: DetailOptions = {}
): Promise<DatasetDetailDto> {
  const dataset = await datasetRepository().findOne({
    where: { id: datasetId },
    relations: { files: true, attachments: true },
  });

  await ensureOwnership(dataset, ownerId);

  return composeDetail(dataset!, opts);
}

export async function composeDetail(
  dataset: Dataset,
  opts: DetailOptions = {}
): Promise<DatasetDetailDto> {
  const files = dataset.files
    ? uniqueById(dataset.files)
    : await datasetFileRepository().find({ where: { datasetId: dataset.id } });
  const attachments = dataset.attachments
    ? uniqueById(dataset.attachments)
    : await datasetAttachmentRepository().find({ where: { datasetId: dataset.id } });

  const [fileDtos, attachmentDtos] = await Promise.all([
    Promise.all(files.map((f) => toFileDto(f, opts))),
    Promise.all(attachments.map((a) => toAttachmentDto(a, opts))),
  ]);

  const summary = toSummary({ ...dataset, files, attachments });
  return {
    ...summary,
    files: fileDtos,
    attachments: attachmentDtos,
  };
}

export async function getDatasetForShareToken(
  token: string,
  opts: DetailOptions = {}
): Promise<DatasetDetailDto> {
  const dataset = await datasetRepository().findOne({
    where: { shareToken: token },
    relations: { files: true, attachments: true },
  });
  if (!dataset) throw new NotFound("A megadott link érvénytelen");
  if (dataset.visibility !== DatasetVisibility.LINK && dataset.visibility !== DatasetVisibility.PUBLIC) {
    throw new Forbidden("Ez a kutatás nem érhető el megosztott linken");
  }
  return composeDetail(dataset, opts);
}

export async function listPublicDatasets(
  search?: string
): Promise<DatasetSummaryDto[]> {
  const qb = datasetRepository()
    .createQueryBuilder("dataset")
    .leftJoinAndSelect("dataset.files", "file")
    .leftJoinAndSelect("dataset.attachments", "attachment")
    .where("dataset.visibility = :visibility", { visibility: DatasetVisibility.PUBLIC })
    .andWhere("dataset.status = :status", { status: DatasetStatus.READY })
    .orderBy("dataset.createdAt", "DESC");

  if (search) {
    qb.andWhere(
      "(LOWER(dataset.name) LIKE :search OR LOWER(dataset.description) LIKE :search)",
      { search: `%${search.toLowerCase()}%` }
    );
  }

  const items = await qb.getMany();
  return items.map(toSummary);
}

export async function getPublicDataset(
  datasetId: string,
  opts: DetailOptions = {}
): Promise<DatasetDetailDto> {
  const dataset = await datasetRepository().findOne({
    where: { id: datasetId },
    relations: { files: true, attachments: true },
  });

  if (!dataset) throw new NotFound("A kutatás nem található");
  if (dataset.visibility !== DatasetVisibility.PUBLIC) {
    throw new Forbidden("Ez a kutatás nem nyilvános");
  }
  if (dataset.status !== DatasetStatus.READY) {
    throw new Forbidden("A kutatás feldolgozása még nem fejeződött be");
  }

  return composeDetail(dataset, opts);
}

export async function recalculateDatasetStatus(datasetId: string): Promise<Dataset> {
  const dataset = await datasetRepository().findOne({
    where: { id: datasetId },
    relations: { files: true },
  });
  if (!dataset) throw new NotFound("A kutatás nem található");

  const files = uniqueById(dataset.files);

  if (!files.length) {
    dataset.status = DatasetStatus.EMPTY;
    dataset.readyAt = null;
  } else if (files.some((f) => f.status === DatasetFileStatus.FAILED)) {
    dataset.status = DatasetStatus.FAILED;
    dataset.readyAt = null;
  } else if (files.every((f) => f.status === DatasetFileStatus.READY)) {
    dataset.status = DatasetStatus.READY;
    dataset.readyAt = dataset.readyAt ?? new Date();
  } else if (files.some((f) => f.status === DatasetFileStatus.PROCESSING)) {
    dataset.status = DatasetStatus.PROCESSING;
    dataset.readyAt = null;
  } else {
    dataset.status = DatasetStatus.UPLOADING;
    dataset.readyAt = null;
  }

  await datasetRepository().save(dataset);
  return dataset;
}

export async function updateDatasetStatus(
  datasetId: string,
  status: DatasetStatus
): Promise<Dataset> {
  await datasetRepository().update({ id: datasetId }, { status });
  const dataset = await datasetRepository().findOne({ where: { id: datasetId } });
  if (!dataset) throw new NotFound("A kutatás nem található");
  return dataset;
}

export function createShareToken() {
  return randomUUID().replace(/-/g, "");
}

