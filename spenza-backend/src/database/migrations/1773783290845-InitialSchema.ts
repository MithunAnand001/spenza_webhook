import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773783290845 implements MigrationInterface {
    name = 'InitialSchema1773783290845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_configurations_authentication_type_enum" AS ENUM('none', 'basic', 'bearer', 'hmac')`);
        await queryRunner.query(`CREATE TABLE "user_configurations" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT gen_random_uuid(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" integer, "modified_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modified_by" integer, "is_active" boolean NOT NULL DEFAULT true, "user_id" integer NOT NULL, "health_check_url" character varying(500), "authentication_type" "public"."user_configurations_authentication_type_enum" NOT NULL DEFAULT 'none', "callback_username" character varying(255), "callback_password" character varying(255), "callback_bearer_token" character varying(500), "signing_secret" character varying(255), "validity" date, CONSTRAINT "UQ_c2c5115fcc8dce202e57157fb05" UNIQUE ("uuid"), CONSTRAINT "PK_e423577b0f7e5bfa832478fb3ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event_types" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT gen_random_uuid(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" integer, "modified_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modified_by" integer, "is_active" boolean NOT NULL DEFAULT true, "name" character varying(100) NOT NULL, "short_description" character varying(255), "long_description" text, CONSTRAINT "UQ_095b4746edcbfd9687b0a22e447" UNIQUE ("uuid"), CONSTRAINT "UQ_d5110ab69f4aacfe41fecdf4fcd" UNIQUE ("name"), CONSTRAINT "PK_ffe6b2d60596409fb08fb13830d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT gen_random_uuid(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" integer, "modified_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modified_by" integer, "is_active" boolean NOT NULL DEFAULT true, "event_type_id" integer NOT NULL, "name" character varying(255) NOT NULL, "description" text, "schema_definition" jsonb, CONSTRAINT "UQ_f1ae990f4f98735f0285a949690" UNIQUE ("uuid"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."webhook_event_logs_status_enum" AS ENUM('pending', 'processing', 'delivered', 'failed', 'retrying')`);
        await queryRunner.query(`CREATE TABLE "webhook_event_logs" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT gen_random_uuid(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" integer, "modified_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modified_by" integer, "is_active" boolean NOT NULL DEFAULT true, "user_id" integer NOT NULL, "event_id" integer NOT NULL, "mapping_id" integer, "payload" jsonb NOT NULL, "status" "public"."webhook_event_logs_status_enum" NOT NULL DEFAULT 'pending', "correlation_id" character varying(255), "attempt_number" integer NOT NULL DEFAULT '0', "response_code" integer, "response_body" text, "next_retry_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_3eb1c14f33a1efbc176849cde05" UNIQUE ("uuid"), CONSTRAINT "PK_de62a62e0b6dc47bb070896f62d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT gen_random_uuid(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" integer, "modified_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modified_by" integer, "is_active" boolean NOT NULL DEFAULT true, "name" character varying(255) NOT NULL, "email_id" character varying(255) NOT NULL, "phone_number" character varying(20), "password" character varying(255) NOT NULL, CONSTRAINT "UQ_951b8f1dfc94ac1d0301a14b7e1" UNIQUE ("uuid"), CONSTRAINT "UQ_e752aee509d8f8118c6e5b1d8cc" UNIQUE ("email_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_event_mapping" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT gen_random_uuid(), "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" integer, "modified_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modified_by" integer, "is_active" boolean NOT NULL DEFAULT true, "user_id" integer NOT NULL, "event_type_id" integer NOT NULL, "callback_url" character varying(500) NOT NULL, CONSTRAINT "UQ_7b0119ad4341a17db07a8c142cc" UNIQUE ("uuid"), CONSTRAINT "UQ_5e0459075867c71d818a16479b0" UNIQUE ("user_id", "event_type_id"), CONSTRAINT "PK_6fddc7d53b93cb05f9f50223507" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_configurations" ADD CONSTRAINT "FK_7c9cd991aa0e75443666a7e4566" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_cca2d7a421ac4b1b24b9996d101" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "webhook_event_logs" ADD CONSTRAINT "FK_c5181099baf6cc3dadf214b7452" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "webhook_event_logs" ADD CONSTRAINT "FK_a27c7f75f8f494190f5cc5f464d" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "webhook_event_logs" ADD CONSTRAINT "FK_0215fc3712bbba57d882df37474" FOREIGN KEY ("mapping_id") REFERENCES "user_event_mapping"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_event_mapping" ADD CONSTRAINT "FK_f1fb4372bfa62a0cb1e419bbb3b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_event_mapping" ADD CONSTRAINT "FK_be9a8d3a58ca5efc84a6ed0b253" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_event_mapping" DROP CONSTRAINT "FK_be9a8d3a58ca5efc84a6ed0b253"`);
        await queryRunner.query(`ALTER TABLE "user_event_mapping" DROP CONSTRAINT "FK_f1fb4372bfa62a0cb1e419bbb3b"`);
        await queryRunner.query(`ALTER TABLE "webhook_event_logs" DROP CONSTRAINT "FK_0215fc3712bbba57d882df37474"`);
        await queryRunner.query(`ALTER TABLE "webhook_event_logs" DROP CONSTRAINT "FK_a27c7f75f8f494190f5cc5f464d"`);
        await queryRunner.query(`ALTER TABLE "webhook_event_logs" DROP CONSTRAINT "FK_c5181099baf6cc3dadf214b7452"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_cca2d7a421ac4b1b24b9996d101"`);
        await queryRunner.query(`ALTER TABLE "user_configurations" DROP CONSTRAINT "FK_7c9cd991aa0e75443666a7e4566"`);
        await queryRunner.query(`DROP TABLE "user_event_mapping"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "webhook_event_logs"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_event_logs_status_enum"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "event_types"`);
        await queryRunner.query(`DROP TABLE "user_configurations"`);
        await queryRunner.query(`DROP TYPE "public"."user_configurations_authentication_type_enum"`);
    }

}
