-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'TWO_FACTOR_VERIFIED', 'TWO_FACTOR_FAILED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'IP_WHITELIST_ADDED', 'IP_WHITELIST_REMOVED', 'IP_BLOCKED', 'SESSION_CREATED', 'SESSION_TERMINATED', 'PERMISSION_CHANGED', 'SUSPICIOUS_ACTIVITY');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "backupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "IpWhitelist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "orgId" INTEGER,
    "ipAddress" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "IpWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "eventType" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorBackup" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwoFactorBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IpWhitelist_userId_isActive_idx" ON "IpWhitelist"("userId", "isActive");

-- CreateIndex
CREATE INDEX "IpWhitelist_orgId_isActive_idx" ON "IpWhitelist"("orgId", "isActive");

-- CreateIndex
CREATE INDEX "IpWhitelist_ipAddress_idx" ON "IpWhitelist"("ipAddress");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_resolved_idx" ON "SecurityEvent"("severity", "resolved");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorBackup_code_key" ON "TwoFactorBackup"("code");

-- CreateIndex
CREATE INDEX "TwoFactorBackup_userId_used_idx" ON "TwoFactorBackup"("userId", "used");

-- CreateIndex
CREATE INDEX "TwoFactorBackup_code_idx" ON "TwoFactorBackup"("code");
