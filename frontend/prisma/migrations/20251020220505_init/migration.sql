-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "ts" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "lamport" INTEGER NOT NULL,
    "self_hash" TEXT NOT NULL,
    "calc_hash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);
