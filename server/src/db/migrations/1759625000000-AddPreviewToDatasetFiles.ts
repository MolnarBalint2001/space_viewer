import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPreviewToDatasetFiles1759625000000 implements MigrationInterface {
    name = "AddPreviewToDatasetFiles1759625000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "previewImageKey" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "previewImageMimeType" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "previewImageSize" bigint`);
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "previewImageWidth" integer`);
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "previewImageHeight" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "previewImageHeight"`);
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "previewImageWidth"`);
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "previewImageSize"`);
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "previewImageMimeType"`);
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "previewImageKey"`);
    }
}
