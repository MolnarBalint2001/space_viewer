import { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import { DatasetAttachment } from "../domain/entities/DatasetAttachment";
import { Dataset } from "../domain/entities/Dataset";

export interface CreateDatasetAttachmentInput {
  datasetId: string;
  originalFilename: string;
  mimeType: string;
  objectKey: string;
  size?: string | null;
}

export async function createDatasetAttachment(
  input: CreateDatasetAttachmentInput,
): Promise<DatasetAttachment> {
  const repo = AppDataSource.getRepository(DatasetAttachment);
  const entity = repo.create({
    datasetId: input.datasetId,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    objectKey: input.objectKey,
    size: input.size ?? null,
  });
  return repo.save(entity);
}

export async function findDatasetAttachmentById(
  attachmentId: string,
  withDataset = false,
): Promise<DatasetAttachment | null> {
  const repo = AppDataSource.getRepository(DatasetAttachment);
  return repo.findOne({
    where: { id: attachmentId },
    relations: withDataset ? { dataset: true } : undefined,
  });
}

export async function listDatasetAttachments(
  datasetId: string,
): Promise<DatasetAttachment[]> {
  const repo = AppDataSource.getRepository(DatasetAttachment);
  return repo.find({ where: { datasetId } satisfies FindOptionsWhere<DatasetAttachment> });
}

export async function ensureAttachmentOwnership(
  attachmentId: string,
  ownerId: string,
): Promise<DatasetAttachment | null> {
  const repo = AppDataSource.getRepository(DatasetAttachment);
  return repo.findOne({
    where: { id: attachmentId, dataset: { ownerId } },
    relations: { dataset: true },
  });
}

export async function findDatasetWithAttachments(
  datasetId: string,
): Promise<Dataset | null> {
  const repo = AppDataSource.getRepository(Dataset);
  return repo.findOne({
    where: { id: datasetId },
    relations: { attachments: true },
  });
}
