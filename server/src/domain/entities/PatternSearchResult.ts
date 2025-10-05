import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PatternSearchRun } from "./PatternSearchRun";

@Entity({ name: "pattern_search_results" })
@Index("IDX_pattern_search_results_run", ["runId"])
export class PatternSearchResult {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "runId", type: "uuid" })
  runId!: string;

  @ManyToOne(() => PatternSearchRun, (run) => run.results, { onDelete: "CASCADE" })
  @JoinColumn({ name: "runId" })
  run!: PatternSearchRun;

  @Column({ type: "uuid" })
  datasetFileId!: string;

  @Column({ type: "varchar", length: 255 })
  datasetFileName!: string;

  @Column({ type: "varchar", length: 32 })
  assetKind!: string;

  @Column({ type: "boolean" })
  success!: boolean;

  @Column({ type: "double precision" })
  score!: number;

  @Column({ type: "boolean" })
  scoreAboveThreshold!: boolean;

  @Column({ type: "varchar", length: 512, nullable: true })
  previewPath?: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  previewUrl?: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  starsPath?: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  starsUrl?: string | null;

  @Column({ type: "jsonb", nullable: true })
  transform?: number[][] | null;

  @Column({ type: "jsonb", nullable: true })
  matchedPointsImage?: number[][] | null;

  @Column({ type: "text", nullable: true })
  message?: string | null;

  @Column({ type: "jsonb", nullable: true })
  geojson?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}

