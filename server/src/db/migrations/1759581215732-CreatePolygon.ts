import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePolygon1759581215732 implements MigrationInterface {
    name = 'CreatePolygon1759581215732'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "polygons" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "creator_user_id" integer NOT NULL, "creator_user_name" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "geom" geometry(Polygon,4326) NOT NULL, CONSTRAINT "PK_820373c50c2a9a63bb7edc0959b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5b77b327b9119a08c8d977bb09" ON "polygons" USING GiST ("geom") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5b77b327b9119a08c8d977bb09"`);
        await queryRunner.query(`DROP TABLE "polygons"`);
    }

}
