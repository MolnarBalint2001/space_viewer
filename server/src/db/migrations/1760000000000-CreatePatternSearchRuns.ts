import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePatternSearchRuns1760000000000 implements MigrationInterface {
    name = "CreatePatternSearchRuns1760000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."pattern_search_runs_asset_preference_enum" AS ENUM('auto','mbtiles','original')`);

        await queryRunner.query(`CREATE TABLE "pattern_search_runs" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "runId" character varying(64) NOT NULL,
            "datasetId" uuid NOT NULL,
            "datasetName" character varying(255) NOT NULL,
            "patternName" character varying(255) NOT NULL,
            "linePoints" jsonb NOT NULL,
            "starParams" jsonb,
            "verifyTolPx" double precision NOT NULL,
            "scoreThreshold" double precision NOT NULL,
            "assetPreference" "public"."pattern_search_runs_asset_preference_enum" NOT NULL DEFAULT 'auto',
            "requestedFileIds" jsonb,
            "usedFileIds" jsonb NOT NULL,
            "successCount" integer NOT NULL,
            "totalFiles" integer NOT NULL,
            "durationMs" double precision NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "storedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_pattern_search_runs_id" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_pattern_search_runs_runId" UNIQUE ("runId")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_pattern_search_runs_dataset" ON "pattern_search_runs" ("datasetId")`);
        await queryRunner.query(`CREATE INDEX "IDX_pattern_search_runs_created" ON "pattern_search_runs" ("createdAt" DESC)`);

        await queryRunner.query(`CREATE TABLE "pattern_search_results" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "runId" uuid NOT NULL,
            "datasetFileId" uuid NOT NULL,
            "datasetFileName" character varying(255) NOT NULL,
            "assetKind" character varying(32) NOT NULL,
            "success" boolean NOT NULL,
            "score" double precision NOT NULL,
            "scoreAboveThreshold" boolean NOT NULL,
            "previewPath" character varying(512),
            "previewUrl" character varying(512),
            "starsPath" character varying(512),
            "starsUrl" character varying(512),
            "transform" jsonb,
            "matchedPointsImage" jsonb,
            "message" text,
            "geojson" jsonb,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_pattern_search_results_id" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_pattern_search_results_run" ON "pattern_search_results" ("runId")`);

        await queryRunner.query(`ALTER TABLE "pattern_search_runs"
            ADD CONSTRAINT "FK_pattern_search_runs_dataset"
            FOREIGN KEY ("datasetId") REFERENCES "datasets"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pattern_search_results"
            ADD CONSTRAINT "FK_pattern_search_results_run"
            FOREIGN KEY ("runId") REFERENCES "pattern_search_runs"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pattern_search_results" DROP CONSTRAINT "FK_pattern_search_results_run"`);
        await queryRunner.query(`ALTER TABLE "pattern_search_runs" DROP CONSTRAINT "FK_pattern_search_runs_dataset"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_pattern_search_results_run"`);
        await queryRunner.query(`DROP TABLE "pattern_search_results"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_pattern_search_runs_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pattern_search_runs_dataset"`);
        await queryRunner.query(`DROP TABLE "pattern_search_runs"`);

        await queryRunner.query(`DROP TYPE "public"."pattern_search_runs_asset_preference_enum"`);
    }
}

