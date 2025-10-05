import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AdminUser } from "./AdminUser";
import { DatasetFile } from "./DatasetFile";
import { DatasetAttachment } from "./DatasetAttachment";

export enum DatasetVisibility {
  PRIVATE = "private",
  PUBLIC = "public",
  LINK = "link",
}

export enum DatasetStatus {
  EMPTY = "empty",
  UPLOADING = "uploading",
  PROCESSING = "processing",
  READY = "ready",
  FAILED = "failed",
}

@Entity({ name: "datasets" })
export class Dataset {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "ownerId", type: "uuid" })
  ownerId!: string;

  @ManyToOne(() => AdminUser, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner!: AdminUser;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Index()
  @Column({
    type: "enum",
    enum: DatasetVisibility,
    default: DatasetVisibility.PRIVATE,
  })
  visibility!: DatasetVisibility;

  @Column({
    type: "enum",
    enum: DatasetStatus,
    default: DatasetStatus.EMPTY,
  })
  status!: DatasetStatus;

  @Column({ type: "varchar", length: 255, nullable: true, unique: true })
  shareToken?: string | null;

  @Column({ type: "timestamp", nullable: true })
  readyAt?: Date | null;

  
  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => DatasetFile, (file) => file.dataset)
  files!: DatasetFile[];

  @OneToMany(() => DatasetAttachment, (attachment) => attachment.dataset)
  attachments!: DatasetAttachment[];
}


