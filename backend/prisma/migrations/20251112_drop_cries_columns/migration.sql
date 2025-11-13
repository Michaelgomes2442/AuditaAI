-- Migration: Drop legacy CRIES columns and artifacts from governance_receipts
-- Date: 2025-11-12
-- IMPORTANT: This migration drops columns. TAKE A FULL BACKUP before applying.

BEGIN;

-- Drop legacy CRIES columns (snake_case names commonly used in DB)
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_omega;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_coherence;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_rigor;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_integrity;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_empathy;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_strictness;

-- JSON / auxiliary columns
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_sub_metrics;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_evidence;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_calculation;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_baseline;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_determinism;
ALTER TABLE IF EXISTS governance_receipts DROP COLUMN IF EXISTS cries_version;

-- If there are camelCase columns (unlikely in unquoted schema) also attempt to drop
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='governance_receipts' AND column_name='criesCoherence') THEN
    EXECUTE 'ALTER TABLE governance_receipts DROP COLUMN "criesCoherence"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='governance_receipts' AND column_name='criesOmega') THEN
    EXECUTE 'ALTER TABLE governance_receipts DROP COLUMN "criesOmega"';
  END IF;
END$$;

COMMIT;

-- End migration
