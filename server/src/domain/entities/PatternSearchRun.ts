import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Dataset } from "./Dataset";
import { PatternSearchResult } from "./PatternSearchResult";

export enum PatternAssetPreference {
  AUTO = "auto",
  MBTILES = "mbtiles",
  ORIGINAL = "original",
}

export interface PatternLinePoint {
  x: number;
  y: number;
}

export interface PatternStarParams {
  minSigma: number;
  maxSigma: number;
  numSigma: number;
  threshold: number;
  logScale: boolean;
}

@Entity({ name: "pattern_search_runs" })
@Index("IDX_pattern_search_runs_dataset", ["datasetId"])
@Index("UQ_pattern_search_runs_run_id", ["runId"], { unique: true })
export class PatternSearchRun {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "character varying", length: 64 })
  runId!: string;

  @Column({ name: "datasetId", type: "uuid" })
  datasetId!: string;

  @ManyToOne(() => Dataset, { onDelete: "CASCADE" })
  @JoinColumn({ name: "datasetId" })
  dataset!: Dataset;

  @Column({ type: "varchar", length: 255 })
  datasetName!: string;

  @Column({ type: "varchar", length: 255 })
  patternName!: string;

  @Column({ type: "jsonb" })
  linePoints!: PatternLinePoint[];

  @Column({ type: "jsonb", nullable: true })
  starParams?: PatternStarParams | null;

  @Column({ type: "double precision" })
  verifyTolPx!: number;

  @Column({ type: "double precision" })
  scoreThreshold!: number;

  @Column({
    type: "enum",
    enum: PatternAssetPreference,
    default: PatternAssetPreference.AUTO,
  })
  assetPreference!: PatternAssetPreference;

  @Column({ type: "jsonb", nullable: true })
  requestedFileIds?: string[] | null;

  @Column({ type: "jsonb" })
  usedFileIds!: string[];

  @Column({ type: "integer" })
  successCount!: number;

  @Column({ type: "integer" })
  totalFiles!: number;

  @Column({ type: "double precision" })
  durationMs!: number;

  @Column({ type: "timestamp", default: () => "now()" })
  createdAt!: Date;

  @CreateDateColumn({ type: "timestamp" })
  storedAt!: Date;

  @OneToMany(() => PatternSearchResult, (result) => result.run, {
    cascade: ["insert"],
  })
  results!: PatternSearchResult[];
}

