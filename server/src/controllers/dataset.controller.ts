import { Request, Response } from "express";
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
import { DatasetAttachment } from "../domain/entities/DatasetAttachment";
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
import { putObject, presignedGetUrl } from "../services/minio.service";
import { publishDomainEvent } from "../services/eventBus.service";
import { DatasetFileUploadedEvent } from "../@types/event.type";
import { BadRequest, NotFound } from "../utils/error";
import { logger } from "../utils/logger";

const datasetRepo = () => AppDataSource.getRepository(Dataset);
const datasetFileRepo = () => AppDataSource.getRepository(DatasetFile);
const datasetAttachmentRepo = () =>
  AppDataSource.getRepository(DatasetAttachment);

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

  await datasetRepo().save(dataset);
  const detail = await composeDetail(dataset, {
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
    throw new NotFound("A kutatás nem található");
  }

  if (body.name !== undefined) dataset.name = body.name;
  if (body.description !== undefined) dataset.description = body.description ?? null;
  if (body.visibility !== undefined) dataset.visibility = body.visibility;

  await datasetRepo().save(dataset);
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
    throw new BadRequest("Legalább egy TIF fájlt fel kell tölteni");
  }

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatás nem található");
  }

  try {
    for (const file of files) {
      if (!ensureTifExtension(file.originalname)) {
        throw new BadRequest(
          `${file.originalname} nem TIF formátumú. Csak .tif vagy .tiff engedélyezett.`
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
    throw new BadRequest("Legalább egy mellékletet fel kell tölteni");
  }

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatás nem található");
  }

  try {
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".pdf") {
        throw new BadRequest(`${file.originalname} nem PDF formátumú.`);
      }

      const objectKey = `datasets/${dataset.id}/attachments/${randomUUID()}${ext}`;
      await putObject(objectKey, createReadStream(file.path), file.mimetype);

      const attachment = datasetAttachmentRepo().create({
        datasetId: dataset.id,
        originalFilename: file.originalname,
        mimeType: file.mimetype || "application/pdf",
        objectKey,
        size: file.size ? file.size.toString() : null,
      });
      await datasetAttachmentRepo().save(attachment);
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
    throw new NotFound("A kutatás nem található");
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
    throw new NotFound("A kutatás nem található");
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
    throw new NotFound("A kutatás nem található");
  }

  const file = await datasetFileRepo().findOne({
    where: { id: fileId, datasetId },
  });
  if (!file) throw new NotFound("A fájl nem található");

  const url = await presignedGetUrl(file.objectKey);
  return res.json({ url });
}

export async function getFileMbtilesDownloadUrl(req: Request, res: Response) {
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

  const url = await presignedGetUrl(file.mbtilesKey);
  return res.json({ url });
}

export async function getAttachmentDownloadUrl(req: Request, res: Response) {
  const user = req.user as any;
  const { datasetId, attachmentId } = req.params;

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset || dataset.ownerId !== user.id) {
    throw new NotFound("A kutatás nem található");
  }

  const attachment = await datasetAttachmentRepo().findOne({
    where: { id: attachmentId, datasetId },
  });
  if (!attachment) throw new NotFound("A melléklet nem található");

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
    throw new NotFound("A fájl nem található a megosztott kutatásban");
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
    throw new NotFound("Ez a fájl még nem készült el MBTiles formátumban");
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
    throw new NotFound("A melléklet nem érhető el");
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
    throw new NotFound("A fájl nem található a nyilvános kutatásban");
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
    throw new NotFound("Ez a fájl még nem készült el MBTiles formátumban");
  }
  const url = await presignedGetUrl(file.mbtilesKey);
  return res.json({ url });
}

export async function getPublicAttachmentDownloadUrl(req: Request, res: Response) {
  const { datasetId, attachmentId } = req.params;
  const detail = await getPublicDataset(datasetId, {
    includeDownloads: false,
    includeObjectKeys: true,
  });
  const attachment = detail.attachments.find((a) => a.id === attachmentId);
  if (!attachment || !attachment.objectKey) {
    throw new NotFound("A melléklet nem érhető el");
  }
  const url = await presignedGetUrl(attachment.objectKey);
  return res.json({ url });
}
