/*
  Warnings:

  - A unique constraint covering the columns `[ssoId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SSOProvider" AS ENUM ('SAML', 'AZURE_AD', 'GOOGLE', 'OKTA', 'GENERIC_OAUTH');

-- CreateEnum
CREATE TYPE "SSOEventType" AS ENUM ('SSO_LOGIN_SUCCESS', 'SSO_LOGIN_FAILED', 'SSO_LOGOUT', 'SSO_CONFIG_CREATED', 'SSO_CONFIG_UPDATED', 'SSO_CONFIG_DELETED', 'SSO_CONFIG_ENABLED', 'SSO_CONFIG_DISABLED', 'JIT_USER_CREATED', 'JIT_USER_UPDATED', 'SSO_SESSION_EXPIRED', 'SSO_CALLBACK_ERROR', 'SAML_ASSERTION_ERROR', 'OAUTH_TOKEN_ERROR');

-- CreateEnum
CREATE TYPE "BENPersona" AS ENUM ('USER', 'VERIFIER', 'ANALYST', 'GOVERNOR', 'ARCHITECT');

-- CreateEnum
CREATE TYPE "ReceiptType" AS ENUM ('BOOT_CONFIRM', 'ANALYSIS', 'DIRECTIVE', 'RESULT', 'APPEND', 'SYNC_POINT');

-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('BEN_CORE', 'AUDITAAI', 'HUMAN');

-- CreateEnum
CREATE TYPE "HandoffStatus" AS ENUM ('INITIATED', 'IN_TRANSIT', 'COMPLETED', 'FAILED', 'TIMEOUT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentPersona" "BENPersona" NOT NULL DEFAULT 'USER',
ADD COLUMN     "lamportCounter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReceiptId" INTEGER,
ADD COLUMN     "personaLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssoId" TEXT,
ADD COLUMN     "ssoMetadata" JSONB,
ADD COLUMN     "ssoProvider" TEXT;

-- CreateTable
CREATE TABLE "SSOConfiguration" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "provider" "SSOProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "samlEntryPoint" TEXT,
    "samlIssuer" TEXT,
    "samlCert" TEXT,
    "samlCallbackUrl" TEXT,
    "samlLogoutUrl" TEXT,
    "oauthClientId" TEXT,
    "oauthClientSecret" TEXT,
    "oauthAuthUrl" TEXT,
    "oauthTokenUrl" TEXT,
    "oauthUserInfoUrl" TEXT,
    "oauthScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domainRestriction" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jitProvisioning" BOOLEAN NOT NULL DEFAULT true,
    "defaultRole" "Role" NOT NULL DEFAULT 'USER',
    "defaultTier" "UserTier" NOT NULL DEFAULT 'FREE',
    "metadata" JSONB,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "SSOConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "SSOProvider" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "nameId" TEXT,
    "sessionIndex" TEXT,
    "attributes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSOSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOAuditLog" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER,
    "userId" INTEGER,
    "provider" "SSOProvider" NOT NULL,
    "eventType" "SSOEventType" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSOAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lamport_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReceiptId" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "lamport_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ben_receipts" (
    "id" SERIAL NOT NULL,
    "receiptType" "ReceiptType" NOT NULL,
    "lamportClock" INTEGER NOT NULL,
    "realTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "persona" "BENPersona" NOT NULL DEFAULT 'USER',
    "track" "TrackType",
    "payload" JSONB NOT NULL,
    "digest" TEXT NOT NULL,
    "previousDigest" TEXT,
    "baselineDigest" TEXT,
    "witnessModel" TEXT,
    "witnessSignature" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ben_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ben_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "persona" "BENPersona" NOT NULL,
    "priority" INTEGER NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "startLamport" INTEGER NOT NULL,
    "endLamport" INTEGER,
    "switchReason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ben_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tri_track_handoffs" (
    "id" SERIAL NOT NULL,
    "fromTrack" "TrackType" NOT NULL,
    "toTrack" "TrackType" NOT NULL,
    "status" "HandoffStatus" NOT NULL DEFAULT 'INITIATED',
    "fromReceiptId" INTEGER NOT NULL,
    "toReceiptId" INTEGER,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "latencyMs" INTEGER,
    "exceededLimit" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "tri_track_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "witness_signatures" (
    "id" SERIAL NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelFingerprint" TEXT NOT NULL,
    "receiptId" INTEGER,
    "receiptDigest" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lamportClock" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationData" JSONB,
    "metadata" JSONB,

    CONSTRAINT "witness_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cries_computations" (
    "id" SERIAL NOT NULL,
    "testResultId" INTEGER,
    "userId" INTEGER,
    "sigmaWindow" DOUBLE PRECISION NOT NULL,
    "tauThreshold" DOUBLE PRECISION NOT NULL,
    "piPolicy" DOUBLE PRECISION NOT NULL,
    "citationQuality" DOUBLE PRECISION NOT NULL,
    "criesScore" DOUBLE PRECISION NOT NULL,
    "lamportClock" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptId" INTEGER,
    "analysisData" JSONB,
    "metadata" JSONB,

    CONSTRAINT "cries_computations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zscan_verifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "totalRules" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "warnings" INTEGER NOT NULL,
    "critical" INTEGER NOT NULL,
    "results" JSONB NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zscan_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SSOConfiguration_provider_enabled_idx" ON "SSOConfiguration"("provider", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "SSOConfiguration_orgId_provider_key" ON "SSOConfiguration"("orgId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "SSOSession_sessionId_key" ON "SSOSession"("sessionId");

-- CreateIndex
CREATE INDEX "SSOSession_userId_provider_idx" ON "SSOSession"("userId", "provider");

-- CreateIndex
CREATE INDEX "SSOSession_sessionId_idx" ON "SSOSession"("sessionId");

-- CreateIndex
CREATE INDEX "SSOSession_expiresAt_idx" ON "SSOSession"("expiresAt");

-- CreateIndex
CREATE INDEX "SSOAuditLog_orgId_createdAt_idx" ON "SSOAuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "SSOAuditLog_userId_createdAt_idx" ON "SSOAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SSOAuditLog_provider_eventType_idx" ON "SSOAuditLog"("provider", "eventType");

-- CreateIndex
CREATE INDEX "ben_receipts_lamportClock_idx" ON "ben_receipts"("lamportClock");

-- CreateIndex
CREATE INDEX "ben_receipts_receiptType_lamportClock_idx" ON "ben_receipts"("receiptType", "lamportClock");

-- CreateIndex
CREATE INDEX "ben_receipts_userId_lamportClock_idx" ON "ben_receipts"("userId", "lamportClock");

-- CreateIndex
CREATE INDEX "ben_receipts_digest_idx" ON "ben_receipts"("digest");

-- CreateIndex
CREATE INDEX "ben_sessions_userId_startedAt_idx" ON "ben_sessions"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ben_sessions_persona_startedAt_idx" ON "ben_sessions"("persona", "startedAt");

-- CreateIndex
CREATE INDEX "tri_track_handoffs_fromTrack_toTrack_initiatedAt_idx" ON "tri_track_handoffs"("fromTrack", "toTrack", "initiatedAt");

-- CreateIndex
CREATE INDEX "tri_track_handoffs_status_initiatedAt_idx" ON "tri_track_handoffs"("status", "initiatedAt");

-- CreateIndex
CREATE INDEX "witness_signatures_receiptDigest_idx" ON "witness_signatures"("receiptDigest");

-- CreateIndex
CREATE INDEX "witness_signatures_modelName_signedAt_idx" ON "witness_signatures"("modelName", "signedAt");

-- CreateIndex
CREATE INDEX "cries_computations_criesScore_computedAt_idx" ON "cries_computations"("criesScore", "computedAt");

-- CreateIndex
CREATE INDEX "cries_computations_userId_computedAt_idx" ON "cries_computations"("userId", "computedAt");

-- CreateIndex
CREATE INDEX "zscan_verifications_userId_idx" ON "zscan_verifications"("userId");

-- CreateIndex
CREATE INDEX "zscan_verifications_createdAt_idx" ON "zscan_verifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_ssoId_key" ON "User"("ssoId");

-- AddForeignKey
ALTER TABLE "SSOConfiguration" ADD CONSTRAINT "SSOConfiguration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ben_receipts" ADD CONSTRAINT "ben_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ben_sessions" ADD CONSTRAINT "ben_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tri_track_handoffs" ADD CONSTRAINT "tri_track_handoffs_fromReceiptId_fkey" FOREIGN KEY ("fromReceiptId") REFERENCES "ben_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tri_track_handoffs" ADD CONSTRAINT "tri_track_handoffs_toReceiptId_fkey" FOREIGN KEY ("toReceiptId") REFERENCES "ben_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zscan_verifications" ADD CONSTRAINT "zscan_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
