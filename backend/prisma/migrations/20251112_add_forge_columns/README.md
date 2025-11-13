Add FORGE columns (non-destructive)

This migration adds FORGE metric columns to the `governance_receipts` table.

How to apply
1. From a safe operator host run:

```bash
psql "${DATABASE_URL}" -f ./prisma/migrations/20251112_add_forge_columns/migration.sql
```

2. After the migration completes, regenerate the Prisma client and deploy:

```bash
cd backend
pnpm install
pnpm exec prisma generate
# Restart/redeploy backend service
```

Notes:
- The migration uses `IF NOT EXISTS` and is idempotent.
- Types chosen: `double precision` for floats, `jsonb` for Json fields, `text` for strings.
