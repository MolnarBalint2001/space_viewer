import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDatasets1755619600000 implements MigrationInterface {
    name = "CreateDatasets1755619600000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TYPE "public"."datasets_visibility_enum" AS ENUM('private', 'public', 'link')`);
        await queryRunner.query(`CREATE TYPE "public"."datasets_status_enum" AS ENUM('empty', 'uploading', 'processing', 'ready', 'failed')`);
        await queryRunner.query(`CREATE TABLE "datasets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "visibility" "public"."datasets_visibility_enum" NOT NULL DEFAULT 'private', "status" "public"."datasets_status_enum" NOT NULL DEFAULT 'empty', "shareToken" character varying(255), "readyAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_998f0df0d85d5df6c72d4b67904" UNIQUE ("shareToken"), CONSTRAINT "PK_10ee93e6e812cafe3b6c621bb35" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ee0b0172698467b27a1e7d7c91" ON "datasets" ("ownerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_59461b6fc08a85da1e0dc18440" ON "datasets" ("visibility")`);

        await queryRunner.query(`CREATE TYPE "public"."dataset_files_status_enum" AS ENUM('uploaded', 'processing', 'ready', 'failed')`);
        await queryRunner.query(`CREATE TABLE "dataset_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "datasetId" uuid NOT NULL, "originalFilename" character varying(255) NOT NULL, "mimeType" character varying(128) NOT NULL, "objectKey" character varying(512) NOT NULL, "size" bigint, "width" integer, "height" integer, "status" "public"."dataset_files_status_enum" NOT NULL DEFAULT 'uploaded', "errorMessage" text, "mbtilesKey" character varying(512), "mbtilesSize" bigint, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "processedAt" TIMESTAMP, CONSTRAINT "PK_8b3ef9f5af8dbad1a2cd934452a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_35fd2a984de1af85a26d708027" ON "dataset_files" ("datasetId")`);

        await queryRunner.query(`CREATE TABLE "dataset_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "datasetId" uuid NOT NULL, "originalFilename" character varying(255) NOT NULL, "mimeType" character varying(128) NOT NULL, "objectKey" character varying(512) NOT NULL, "size" bigint, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d62f094caf0a2d3471cb24837a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_709f688779459c91d500225af8" ON "dataset_attachments" ("datasetId")`);

        await queryRunner.query(`ALTER TABLE "datasets" ADD CONSTRAINT "FK_ee0b0172698467b27a1e7d7c918" FOREIGN KEY ("ownerId") REFERENCES "adminUsers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD CONSTRAINT "FK_35fd2a984de1af85a26d7080275" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dataset_attachments" ADD CONSTRAINT "FK_709f688779459c91d500225af81" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset_attachments" DROP CONSTRAINT "FK_709f688779459c91d500225af81"`);
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP CONSTRAINT "FK_35fd2a984de1af85a26d7080275"`);
        await queryRunner.query(`ALTER TABLE "datasets" DROP CONSTRAINT "FK_ee0b0172698467b27a1e7d7c918"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_709f688779459c91d500225af8"`);
        await queryRunner.query(`DROP TABLE "dataset_attachments"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_35fd2a984de1af85a26d708027"`);
        await queryRunner.query(`DROP TABLE "dataset_files"`);
        await queryRunner.query(`DROP TYPE "public"."dataset_files_status_enum"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_59461b6fc08a85da1e0dc18440"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee0b0172698467b27a1e7d7c91"`);
        await queryRunner.query(`DROP TABLE "datasets"`);
        await queryRunner.query(`DROP TYPE "public"."datasets_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."datasets_visibility_enum"`);
    }
}

