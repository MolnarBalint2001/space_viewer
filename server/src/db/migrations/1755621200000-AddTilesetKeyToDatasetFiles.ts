import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTilesetKeyToDatasetFiles1755621200000 implements MigrationInterface {
    name = "AddTilesetKeyToDatasetFiles1755621200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset_files" ADD "tilesetKey" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset_files" DROP COLUMN "tilesetKey"`);
    }
}

