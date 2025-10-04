import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCenterToDatasetFiles1755621400000 implements MigrationInterface {
    name = "AddCenterToDatasetFiles1755621400000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "centerLat" double precision`);
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "centerLng" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "centerLng"`);
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "centerLat"`);
    }
}

