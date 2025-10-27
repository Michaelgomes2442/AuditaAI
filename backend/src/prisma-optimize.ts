// Ensure DATABASE_URL is available globally before any Prisma operations
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables immediately
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidates = [
  path.join(process.cwd(), 'backend', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env')
].filter(Boolean);

for (const p of candidates) {
  try {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  } catch (e) {
    // ignore
  }
}

// Ensure DATABASE_URL is normalized
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^\"|\"$/g, '').replace(/^\'|\'$/g, '');
}

import { PrismaClient } from '@prisma/client';
import { recordQuery } from './prisma-recorder';

// Import withOptimize directly as per Prisma documentation
let withOptimize: any = null;
let withAccelerate: any = null;
try {
  // Try the direct import approach from the tutorial
  const mod = await import('@prisma/extension-optimize');
  withOptimize = mod && mod.withOptimize ? mod.withOptimize : null;
  
  // Import Accelerate
  const accelerateMod = await import('@prisma/extension-accelerate');
  withAccelerate = accelerateMod && accelerateMod.withAccelerate ? accelerateMod.withAccelerate : null;
} catch (err: any) {
  try {
    // Fallback to createRequire approach
    const { createRequire } = await import('module');
    const base = typeof import.meta !== 'undefined' ? import.meta.url : undefined;
    const req = createRequire(base || process.cwd());
    const mod = req('@prisma/extension-optimize');
    withOptimize = mod && mod.withOptimize ? mod.withOptimize : null;
    
    // Try to import Accelerate with fallback
    try {
      const accelerateMod = req('@prisma/extension-accelerate');
      withAccelerate = accelerateMod && accelerateMod.withAccelerate ? accelerateMod.withAccelerate : null;
    } catch (accelErr) {
      withAccelerate = null;
    }
  } catch (fallbackErr: any) {
    withOptimize = null;
    withAccelerate = null;
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
  // Compute file-relative directory (works even when process.cwd() is different)
  let __filename: string | undefined;
  let __dirnameFile: string | undefined;
  try {
    __filename = fileURLToPath(import.meta.url as any);
    __dirnameFile = path.dirname(__filename);
  } catch (e) {
    __dirnameFile = undefined;
  }

  const candidates = [
    // repo-root / backend/.env when started from workspace root
    path.join(process.cwd(), 'backend', '.env'),
    // repo-root /.env
    path.join(process.cwd(), '.env'),
    // file-relative: backend/src/ -> backend/.env
    __dirnameFile ? path.join(__dirnameFile, '..', '.env') : null,
    // file-relative one level up (in case structure differs)
    __dirnameFile ? path.join(__dirnameFile, '..', '..', '.env') : null
  ].filter(Boolean) as string[];
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
  // Environment variables should already be loaded at module level

  
  const enableOptimize = String(process.env.ENABLE_PRISMA_OPTIMIZE || '').toLowerCase() === 'true';
  const optimizeApiKey = process.env.OPTIMIZE_API_KEY;

  const baseClient = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
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
      // Create base client
      let client = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: [
          { level: 'query', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'warn', emit: 'event' },
          { level: 'error', emit: 'event' },
        ],
      });
      
      // Chain extensions: Optimize first, then Accelerate
      if (withOptimize) {
        client = client.$extends(withOptimize({ apiKey: optimizeApiKey }));
      }
      if (withAccelerate) {
        client = client.$extends(withAccelerate());
      }

      // Set up event listeners on the final extended client
      client.$on('query', (e: any) => {
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

      client.$on('info', (e: any) => console.log(`[PRISMA INFO] ${e.message}`));
      client.$on('warn', (e: any) => console.warn(`[PRISMA WARN] ${e.message}`));
      client.$on('error', (e: any) => console.error(`[PRISMA ERROR] ${e.message}`));

      console.log('Prisma Optimize and Accelerate extensions attached — recording and caching enabled');
      return client;
    } catch (err: any) {
      console.warn('Failed to create PrismaClient with extensions, falling back to extending existing client:', err?.message || err);
      
      // Fallback to the original approach
      try {
        let extended = baseClient;
        if (withOptimize) {
          extended = extended.$extends(withOptimize({ apiKey: optimizeApiKey }));
        }
        if (withAccelerate) {
          extended = extended.$extends(withAccelerate());
        }
        console.log('Prisma Optimize and Accelerate extensions attached via fallback — recording and caching enabled');
        return extended;
      } catch (fallbackErr: any) {
        console.warn('Failed to attach Prisma extensions:', fallbackErr?.message || fallbackErr);
        if (fallbackErr && fallbackErr.stack) console.warn(fallbackErr.stack);
        return baseClient;
      }
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