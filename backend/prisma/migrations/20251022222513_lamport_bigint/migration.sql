-- AlterTable
ALTER TABLE "AuditRecord" ALTER COLUMN "lamport" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Block" ALTER COLUMN "lamportClock" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Receipt" ALTER COLUMN "lamport" SET DATA TYPE BIGINT;
