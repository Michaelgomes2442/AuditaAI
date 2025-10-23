-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PAID', 'ARCHITECT');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG', 'FEATURE', 'IMPROVEMENT', 'QUESTION', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('UI_UX', 'PERFORMANCE', 'ACCURACY', 'DOCUMENTATION', 'API', 'BILLING', 'SECURITY', 'GENERAL');

-- CreateEnum
CREATE TYPE "FeedbackPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tier" "UserTier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "SharedTestCollection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "testIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedTestCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitQuota" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "windowMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPredefined" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "config" JSONB NOT NULL,
    "sharedWith" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB,
    "payloadTemplate" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 1000,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggered" TIMESTAMP(3),
    "lastSuccess" TIMESTAMP(3),
    "lastFailure" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" SERIAL NOT NULL,
    "webhookId" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "headers" JSONB,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "responseTime" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateLimit" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "limitType" TEXT NOT NULL,
    "limitPeriod" TEXT NOT NULL,
    "maxLimit" INTEGER NOT NULL,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "warningThreshold" INTEGER NOT NULL DEFAULT 80,
    "lastWarningAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegressionBaseline" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT,
    "testType" TEXT NOT NULL,
    "avgResponseTime" DOUBLE PRECISION NOT NULL,
    "avgCost" DOUBLE PRECISION NOT NULL,
    "avgQualityScore" DOUBLE PRECISION NOT NULL,
    "avgAccuracy" DOUBLE PRECISION NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "sampleSize" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegressionBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "priority" "FeedbackPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" INTEGER,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" INTEGER,
    "sentiment" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "testComplete" BOOLEAN NOT NULL DEFAULT true,
    "batchComplete" BOOLEAN NOT NULL DEFAULT true,
    "scheduledTestComplete" BOOLEAN NOT NULL DEFAULT true,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lowScoreThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "highScoreThreshold" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "scoreDropAlert" BOOLEAN NOT NULL DEFAULT true,
    "witnessFailureAlert" BOOLEAN NOT NULL DEFAULT true,
    "dailyReport" BOOLEAN NOT NULL DEFAULT false,
    "weeklyReport" BOOLEAN NOT NULL DEFAULT true,
    "monthlyReport" BOOLEAN NOT NULL DEFAULT false,
    "reportTime" TEXT NOT NULL DEFAULT '09:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT,
    "criesScore" DOUBLE PRECISION,
    "responseTime" INTEGER,
    "tokenCount" INTEGER,
    "cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedTestCollection_teamId_createdAt_idx" ON "SharedTestCollection"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "SharedTestCollection_createdBy_createdAt_idx" ON "SharedTestCollection"("createdBy", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitQuota_userId_resetAt_idx" ON "RateLimitQuota"("userId", "resetAt");

-- CreateIndex
CREATE INDEX "RateLimitQuota_provider_endpoint_idx" ON "RateLimitQuota"("provider", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitQuota_userId_provider_endpoint_key" ON "RateLimitQuota"("userId", "provider", "endpoint");

-- CreateIndex
CREATE INDEX "TestTemplate_userId_createdAt_idx" ON "TestTemplate"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TestTemplate_category_isPublic_idx" ON "TestTemplate"("category", "isPublic");

-- CreateIndex
CREATE INDEX "TestTemplate_teamId_createdAt_idx" ON "TestTemplate"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "TestTemplate_isPredefined_category_idx" ON "TestTemplate"("isPredefined", "category");

-- CreateIndex
CREATE INDEX "Webhook_userId_isActive_idx" ON "Webhook"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Webhook_teamId_isActive_idx" ON "Webhook"("teamId", "isActive");

-- CreateIndex
CREATE INDEX "Webhook_events_idx" ON "Webhook"("events");

-- CreateIndex
CREATE INDEX "WebhookLog_webhookId_createdAt_idx" ON "WebhookLog"("webhookId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_event_createdAt_idx" ON "WebhookLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_success_createdAt_idx" ON "WebhookLog"("success", "createdAt");

-- CreateIndex
CREATE INDEX "ApiRateLimit_userId_provider_limitType_idx" ON "ApiRateLimit"("userId", "provider", "limitType");

-- CreateIndex
CREATE INDEX "ApiRateLimit_resetAt_idx" ON "ApiRateLimit"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRateLimit_userId_provider_limitType_limitPeriod_key" ON "ApiRateLimit"("userId", "provider", "limitType", "limitPeriod");

-- CreateIndex
CREATE INDEX "Budget_userId_createdAt_idx" ON "Budget"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RegressionBaseline_userId_modelName_isActive_idx" ON "RegressionBaseline"("userId", "modelName", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RegressionBaseline_userId_modelName_modelVersion_testType_key" ON "RegressionBaseline"("userId", "modelName", "modelVersion", "testType");

-- CreateIndex
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_type_status_idx" ON "Feedback"("type", "status");

-- CreateIndex
CREATE INDEX "Feedback_category_status_idx" ON "Feedback"("category", "status");

-- CreateIndex
CREATE INDEX "Feedback_priority_status_idx" ON "Feedback"("priority", "status");

-- CreateIndex
CREATE INDEX "Feedback_assignedTo_status_idx" ON "Feedback"("assignedTo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "TestResult_userId_createdAt_idx" ON "TestResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TestResult_modelName_createdAt_idx" ON "TestResult"("modelName", "createdAt");

-- CreateIndex
CREATE INDEX "TestResult_userId_modelName_createdAt_idx" ON "TestResult"("userId", "modelName", "createdAt");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegressionBaseline" ADD CONSTRAINT "RegressionBaseline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
