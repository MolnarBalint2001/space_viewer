import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Dataset } from "./Dataset";

export enum DatasetFileStatus {
  UPLOADED = "uploaded",
  PROCESSING = "processing",
  READY = "ready",
  FAILED = "failed",
}

@Entity({ name: "dataset_files" })
export class DatasetFile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "datasetId", type: "uuid" })
  datasetId!: string;

  @ManyToOne(() => Dataset, (dataset) => dataset.files, { onDelete: "CASCADE" })
  @JoinColumn({ name: "datasetId" })
  dataset!: Dataset;

  @Column({ type: "varchar", length: 255 })
  originalFilename!: string;

  @Column({ type: "varchar", length: 128 })
  mimeType!: string;

  @Column({ type: "varchar", length: 512 })
  objectKey!: string;

  @Column({ type: "bigint", nullable: true })
  size?: string | null;

  @Column({ type: "integer", nullable: true })
  width?: number | null;

  @Column({ type: "integer", nullable: true })
  height?: number | null;

  @Column({
    type: "enum",
    enum: DatasetFileStatus,
    default: DatasetFileStatus.UPLOADED,
  })
  status!: DatasetFileStatus;

  @Column({ type: "text", nullable: true })
  errorMessage?: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  mbtilesKey?: string | null;

  @Column({ type: "bigint", nullable: true })
  mbtilesSize?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  tilesetKey?: string | null;

  @Column({ type: "float", nullable: true })
  centerLat?: number | null;

  @Column({ type: "float", nullable: true })
  centerLng?: number | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  processedAt?: Date | null;
}
