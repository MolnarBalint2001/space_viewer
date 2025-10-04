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

@Entity({ name: "dataset_attachments" })
export class DatasetAttachment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "datasetId", type: "uuid" })
  datasetId!: string;

  @ManyToOne(() => Dataset, (dataset) => dataset.attachments, {
    onDelete: "CASCADE",
  })
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

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}

