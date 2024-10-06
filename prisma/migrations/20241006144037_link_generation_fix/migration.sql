/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Invitation` table. All the data in the column will be lost.

*/
-- AlterTable
CREATE SEQUENCE invitation_id_seq;
ALTER TABLE "Invitation" DROP COLUMN "expiresAt",
ALTER COLUMN "id" SET DEFAULT nextval('invitation_id_seq');
ALTER SEQUENCE invitation_id_seq OWNED BY "Invitation"."id";
