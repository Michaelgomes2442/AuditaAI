**Runbook: Remove legacy CRIES columns and complete FORGE migration**

- Scope: This runbook drops CRIES columns from `governance_receipts` and finalizes the repo-wide move to FORGE-only storage and runtime.

Preflight (MUST DO)
- Create a full logical DB backup (pg_dump) and/or a filesystem snapshot of the DB host
  - Example:

```bash
PGHOST=your-db-host PGPORT=5432 PGUSER=your-user PGPASSFILE=~/.pgpass pg_dump --format=custom --file=governance_receipts_before_drop.dump --dbname=your_db_name
```

- Run the migration first in a staging environment and verify everything.
- Ensure you have a rollback plan (see below).

Files included
- `prisma/migrations/20251112_drop_cries_columns/migration.sql` — SQL to drop CRIES columns (safe IF EXISTS checks included).

Recommended execution steps (staging)
1. Checkout appropriate deployment branch and ensure `backend/prisma/schema.prisma` already reflects FORGE fields (no `cries*`).
2. Copy `migration.sql` to the target DB host, or run it locally against the DB using `psql`.

Example (psql):

```bash
# Replace these env values with your DB connection info
export PGHOST=<host>
export PGPORT=<port>
export PGUSER=<user>
export PGPASSWORD=<password>
export PGDATABASE=<database>

psql "postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE" -f ./prisma/migrations/20251112_drop_cries_columns/migration.sql
```

3. Verify schema: confirm columns are gone:

```bash
psql "postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE" -c "\d+ governance_receipts"
```

4. Regenerate Prisma client in the backend environment (after migration):

```bash
cd backend
pnpm install
pnpm exec prisma generate
```

5. Run backend smoke tests and start server in staging. Validate endpoints that return FORGE fields.

6. If all good, schedule the production migration during a maintenance window and repeat steps.

Rollback plan
- If anything fails after applying the DROP migration, restore from the DB backup taken in the preflight step:

```bash
pg_restore --clean --no-owner --dbname=your_db_name governance_receipts_before_drop.dump
```

Notes and cautions
- Dropping columns is destructive. Only proceed once you are certain CRIES values are no longer required.
- If you prefer a less-destructive approach, use an add+backfill+switch approach (add `forge*` columns, backfill from `cries*`, then drop). This migration file is an in-place destructive drop per your instruction.
- After DB migration, regenerate the Prisma client and redeploy the backend so code and DB are in sync.

Post-migration cleanup
- Remove legacy `backend/src/cries/*` modules once the migration is live and tested.
- Remove any client-side references to CRIES in the frontend and redeploy.
- Remove CRIES-related tests and CI jobs (if any) or adapt them to FORGE.

Contact/Owner
- Runbook prepared by automation. Ask the engineering team lead to schedule the migration and confirm backups before running in production.
