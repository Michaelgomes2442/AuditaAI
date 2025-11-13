-- Non-destructive migration: add FORGE columns to governance_receipts
-- Safe to run repeatedly (uses IF NOT EXISTS)

BEGIN;

-- CamelCase-style columns (match Prisma field names if used as-is)
ALTER TABLE governance_receipts
  ADD COLUMN IF NOT EXISTS "forgeF" double precision,
  ADD COLUMN IF NOT EXISTS "forgeO" double precision,
  ADD COLUMN IF NOT EXISTS "forgeR" double precision,
  ADD COLUMN IF NOT EXISTS "forgeG" double precision,
  ADD COLUMN IF NOT EXISTS "forgeE" double precision,
  ADD COLUMN IF NOT EXISTS "forgeOverall" double precision,
  ADD COLUMN IF NOT EXISTS "forgeSubMetrics" jsonb,
  ADD COLUMN IF NOT EXISTS "forgeEvidence" jsonb,
  ADD COLUMN IF NOT EXISTS "forgeCalculation" jsonb,
  ADD COLUMN IF NOT EXISTS "forgeBaseline" jsonb,
  ADD COLUMN IF NOT EXISTS "forgeDeterminism" jsonb,
  ADD COLUMN IF NOT EXISTS "governanceMode" text;

-- Snake_case variants (in case the DB uses snake_case column names)
ALTER TABLE governance_receipts
  ADD COLUMN IF NOT EXISTS forge_f double precision,
  ADD COLUMN IF NOT EXISTS forge_o double precision,
  ADD COLUMN IF NOT EXISTS forge_r double precision,
  ADD COLUMN IF NOT EXISTS forge_g double precision,
  ADD COLUMN IF NOT EXISTS forge_e double precision,
  ADD COLUMN IF NOT EXISTS forge_overall double precision,
  ADD COLUMN IF NOT EXISTS forge_sub_metrics jsonb,
  ADD COLUMN IF NOT EXISTS forge_evidence jsonb,
  ADD COLUMN IF NOT EXISTS forge_calculation jsonb,
  ADD COLUMN IF NOT EXISTS forge_baseline jsonb,
  ADD COLUMN IF NOT EXISTS forge_determinism jsonb,
  ADD COLUMN IF NOT EXISTS governance_mode text;

COMMIT;

-- Notes:
-- 1) This migration is intentionally non-destructive and idempotent.
-- 2) Column types chosen to match Prisma schema: Float -> double precision, Json -> jsonb, String -> text.
-- 3) After applying this migration, run `pnpm exec prisma generate` and redeploy the backend so runtime writes succeed.
