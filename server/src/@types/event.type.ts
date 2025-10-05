import { DatasetStatus } from "../domain/entities/Dataset";

export type DomainEventName =
  | "order.created"
  | "order.status-changed"
  | "feedback.received"
  | "dataset.file.uploaded"
  | "dataset.attachment.uploaded"
  | "dataset.processing.completed";

export interface DomainEvent<TPayload = any> {
  name: DomainEventName;
  occurredAt: string;
  id: string;
  payload: TPayload;
}

export interface DatasetFileUploadedPayload {
  datasetId: string;
  datasetFileId: string;
  ownerId: string;
  objectKey: string;
  originalFilename: string;
}

export type DatasetFileUploadedEvent = DomainEvent<DatasetFileUploadedPayload> & {
  name: "dataset.file.uploaded";
};

export interface DatasetAttachmentUploadedPayload {
  datasetId: string;
  attachmentId: string;
  ownerId: string;
  objectKey: string;
  originalFilename: string;
}

export type DatasetAttachmentUploadedEvent = DomainEvent<DatasetAttachmentUploadedPayload> & {
  name: "dataset.attachment.uploaded";
};

export interface DatasetProcessingCompletedPayload {
  datasetId: string;
  ownerId: string;
  status: DatasetStatus;
}

export type DatasetProcessingCompletedEvent = DomainEvent<DatasetProcessingCompletedPayload> & {
  name: "dataset.processing.completed";
};
