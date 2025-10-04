import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePolygonWithTileSetKey1759583938330 implements MigrationInterface {
    name = 'UpdatePolygonWithTileSetKey1759583938330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "polygons" ADD "tilesetKey" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "polygons" DROP COLUMN "tilesetKey"`);
    }

}
