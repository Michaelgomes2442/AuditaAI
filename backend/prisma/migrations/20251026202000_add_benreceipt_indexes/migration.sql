-- Migration: add ben_receipts indexes for realTimestamp, createdAt, and (userId, realTimestamp)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ben_receipts') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_ben_receipts_realtimestamp') THEN
      EXECUTE 'CREATE INDEX idx_ben_receipts_realtimestamp ON ben_receipts ("realTimestamp")';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_ben_receipts_createdat') THEN
      EXECUTE 'CREATE INDEX idx_ben_receipts_createdat ON ben_receipts ("createdAt")';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_ben_receipts_userid_realtimestamp') THEN
      EXECUTE 'CREATE INDEX idx_ben_receipts_userid_realtimestamp ON ben_receipts ("userId", "realTimestamp")';
    END IF;
  END IF;
END $$;
