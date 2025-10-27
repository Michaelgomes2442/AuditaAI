-- Migration: add GIN index on ben_receipts.payload (jsonb)
-- NOTE: In production prefer to run the CONCURRENTLY variant outside of a transaction:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ben_receipts_payload_gin ON ben_receipts USING gin (payload);

CREATE INDEX IF NOT EXISTS idx_ben_receipts_payload_gin ON ben_receipts USING gin (payload);
