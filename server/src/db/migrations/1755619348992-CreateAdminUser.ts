import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdminUser1755619348992 implements MigrationInterface {
    name = 'CreateAdminUser1755619348992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "adminUsers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "lastLoginDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6f8ff9474ecc7a2814e29a099ff" UNIQUE ("username"), CONSTRAINT "UQ_e108b7bf5593be248dd80244794" UNIQUE ("email"), CONSTRAINT "PK_5c8231336c2c6fc47cb6b999dc4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "adminUsers"`);
    }

}
