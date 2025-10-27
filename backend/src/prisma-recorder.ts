import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

// Simple JSONL recorder for Prisma query events. Creates a timestamped file
// under ./prisma-query-records by default, or uses PRISMA_QUERY_LOG env var.
const defaultDir = join(process.cwd(), 'prisma-query-records');
if (!existsSync(defaultDir)) mkdirSync(defaultDir, { recursive: true });

const fileName = process.env.PRISMA_QUERY_LOG || join(defaultDir, `prisma-queries-${Date.now()}.ndjson`);

function safeStringify(v: any) {
  try {
    return JSON.stringify(v);
  } catch (e) {
    return JSON.stringify({ error: 'stringify failed', value: String(v) });
  }
}

export function recordQuery(e: { query: string; params: string; duration?: number; timestamp?: number }) {
  const entry = {
    ts: e.timestamp || Date.now(),
    query: e.query,
    params: e.params,
    duration: e.duration ?? null,
  };
  try {
    appendFileSync(fileName, safeStringify(entry) + '\n', { encoding: 'utf8' });
  } catch (err) {
    // best-effort; don't throw in recording
    try {
      const fallback = join(process.cwd(), 'prisma-query-records', 'fallback-ndjson.log');
      appendFileSync(fallback, safeStringify({ err: String(err), entry }) + '\n');
    } catch (e) {
      // ignore
    }
  }
}

export function getLogPath() {
  return fileName;
}

export default { recordQuery, getLogPath };
