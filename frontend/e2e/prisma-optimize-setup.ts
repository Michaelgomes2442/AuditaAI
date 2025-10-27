import { test as base, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { appendFileSync, existsSync, mkdirSync } from 'fs';

// Local query recorder
const defaultDir = path.join(process.cwd(), 'prisma-query-records');
if (!existsSync(defaultDir)) mkdirSync(defaultDir, { recursive: true });
const fileName = process.env.PRISMA_QUERY_LOG || path.join(defaultDir, `prisma-queries-${Date.now()}.ndjson`);

function safeStringify(v: any) {
  try {
    return JSON.stringify(v);
  } catch (e) {
    return JSON.stringify({ error: 'stringify failed', value: String(v) });
  }
}

function recordQuery(e: { query: string; params: string; duration?: number; timestamp?: number }) {
  const entry = {
    ...e,
    timestamp: e.timestamp || Date.now(),
  };
  const line = safeStringify(entry) + '\n';
  try {
    appendFileSync(fileName, line);
  } catch (err) {
    console.warn('Failed to record query:', err);
  }
}

// Recorder: write query events to a JSONL file as a fallback when Optimize
// cannot attach. This is safe to require synchronously.
let recorder: any = null;
try {
  recorder = { recordQuery };
} catch (e) {
  recorder = null;
}
// Synchronously load dotenv as early as possible so extensions that resolve envs at
// process start can see the variables. Try multiple common .env locations.
try {
  const candidates = [
    path.join(process.cwd(), '..', 'backend', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        // stop after first successful load
        break;
      }
    } catch (e) {
      // ignore
    }
  }
} catch (e) {
  // ignore
}

// Create Prisma client with optional Optimize extension for E2E testing
export const createOptimizedPrismaClient = async () => {
  // Ensure environment variables from backend/.env are loaded when called from other CWDs
  try {
    const envPath = path.join(process.cwd(), '..', 'backend', '.env');
    if (envPath) dotenv.config({ path: envPath });
    // If dotenv didn't populate expected vars (some environments), parse manually
    if (!process.env.DATABASE_URL) {
      try {
        if (fs.existsSync(envPath)) {
          const raw = fs.readFileSync(envPath, 'utf-8');
          raw.split(/\r?\n/).forEach((line: string) => {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\"?(.*?)\"?\s*$/);
            if (m) {
              const k = m[1];
              const v = m[2];
              if (!process.env[k]) process.env[k] = v;
            }
          });
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }
  let withOptimize: any = null;
  try {
    // In ESM environments, create a CommonJS require to load the package reliably
    const { createRequire } = await import('module');
    // Use import.meta.url if available, otherwise fallback to cwd
    const base = typeof import.meta !== 'undefined' ? import.meta.url : undefined;
    const req = createRequire(base || process.cwd());
    const mod = req('@prisma/extension-optimize');
    withOptimize = mod && mod.withOptimize ? mod.withOptimize : null;
    console.log('DEBUG: @prisma/extension-optimize loaded:', typeof withOptimize === 'function');
  } catch (err) {
    withOptimize = null;
  }

  
  const enableOptimize = String(process.env.ENABLE_PRISMA_OPTIMIZE || '').toLowerCase() === 'true';
  const optimizeApiKey = process.env.OPTIMIZE_API_KEY;

  const baseClient = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });

  // Wire up local query logging regardless
  baseClient.$on('query', (e: any) => {
    console.log(`[PRISMA QUERY] ${e.query}`);
    console.log(`[PRISMA PARAMS] ${e.params}`);
    console.log(`[PRISMA DURATION] ${e.duration}ms`);
    try {
      if (recorder && typeof recorder.recordQuery === 'function') {
        recorder.recordQuery({ query: e.query, params: e.params, duration: e.duration, timestamp: Date.now() });
      }
    } catch (err) {
      // ignore recording failures
    }
  });

  baseClient.$on('info', (e: any) => console.log(`[PRISMA INFO] ${e.message}`));
  baseClient.$on('warn', (e: any) => console.warn(`[PRISMA WARN] ${e.message}`));
  baseClient.$on('error', (e: any) => console.error(`[PRISMA ERROR] ${e.message}`));

  if (enableOptimize) {
    if (!withOptimize) {
      console.warn('Prisma Optimize extension is enabled but @prisma/extension-optimize is not available. Running without remote recording.');
      return baseClient;
    }
    if (!optimizeApiKey) {
      console.warn('ENABLE_PRISMA_OPTIMIZE is true but OPTIMIZE_API_KEY is not set. Running without remote recording.');
      return baseClient;
    }

    try {
      // Dump a masked snapshot of the env vars right before attach to help
      // diagnose attach-time env resolution issues.
      try {
        const keys = Object.keys(process.env).slice(0, 200);
        console.log('DEBUG_AT_ATTACH: env keys (sample):', keys.slice(0, 50));
        // Normalize and strip surrounding quotes if present (often .env values
        // are quoted). This ensures the engine receives a clean URL string.
        const rawDb = process.env.DATABASE_URL || '';
        const normalizedDb = typeof rawDb === 'string' ? rawDb.replace(/^\"|\"$/g, '').replace(/^\'|\'$/g, '') : rawDb;
        process.env.DATABASE_URL = normalizedDb;
        const masked = normalizedDb
          ? normalizedDb.length > 40
            ? `${normalizedDb.slice(0, 16)}...${normalizedDb.slice(-16)}`
            : normalizedDb
          : '<none>';
        console.log('DEBUG_AT_ATTACH: DATABASE_URL (masked):', masked);
        // Also normalize OPTIMIZE_API_KEY
        if (process.env.OPTIMIZE_API_KEY) {
          process.env.OPTIMIZE_API_KEY = (process.env.OPTIMIZE_API_KEY as string).replace(/^\"|\"$/g, '').replace(/^\'|\'$/g, '');
        }
      } catch (e) {
        // ignore
      }

      console.log('DEBUG: process.env.DATABASE_URL present?', !!process.env.DATABASE_URL);
      console.log('DEBUG: process.env.OPTIMIZE_API_KEY present?', !!process.env.OPTIMIZE_API_KEY);
      // Apply the Optimize extension to the Prisma client
      // Use $extends to attach the extension (supported in Prisma v6+)
      // @ts-ignore
      const extended = baseClient.$extends(withOptimize({ apiKey: optimizeApiKey }));
      console.log('Prisma Optimize extension attached — recording enabled for E2E tests');
      return extended;
    } catch (err: any) {
      console.warn('Failed to attach Prisma Optimize extension:', err?.message || err);
          if (err && err.stack) console.warn(err.stack);
      return baseClient;
    }
  }

  return baseClient;
};

// Cleanup function for tests. If a client is provided, disconnect it; otherwise no-op.
export const cleanupPrisma = async (client?: any) => {
  try {
    if (client && typeof client.$disconnect === 'function') {
      await client.$disconnect();
    }
  } catch (err) {
    // ignore
  }
};

// Extend the base test with Prisma Optimize integration
export const test = base.extend<{
  prisma: any;
}>({
  // Setup Prisma client with Optimize for each test
  prisma: async ({}, use) => {
  const prisma = await createOptimizedPrismaClient();

    await use(prisma);

    // Cleanup after each test
    await cleanupPrisma(prisma);
  },
});

// Export expect for convenience
export { expect };

// Global setup for E2E tests with Prisma query monitoring
export const setupPrismaOptimize = () => {
  // Set environment variables for Prisma monitoring
  process.env.ENABLE_PRISMA_OPTIMIZE = 'true';

  // Attempt to load OPTIMIZE_API_KEY from backend/.env if not already set
  try {
    if (!process.env.OPTIMIZE_API_KEY) {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '..', 'backend', '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const m = content.match(/OPTIMIZE_API_KEY\s*=\s*"?(.*?)"?\s*$/m);
        if (m && m[1]) {
          process.env.OPTIMIZE_API_KEY = m[1].trim();
        }
      }
    }
  } catch (err) {
    // ignore
  }

  console.log('🔍 Prisma query monitoring enabled for E2E testing');
  if (process.env.OPTIMIZE_API_KEY) console.log('🔐 Prisma Optimize API key loaded for remote recording');
  else console.log('⚠️ Prisma Optimize API key not found — recordings will not be sent');
  console.log('📊 Database queries will be logged during test execution');
};

// Global teardown
export const teardownPrismaOptimize = async () => {
  console.log('🧹 Cleaning up Prisma Optimize for E2E testing');
};