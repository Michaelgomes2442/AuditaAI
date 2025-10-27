Prisma Accelerate / Optimize integration

This project includes optional integration points for Prisma Optimize (recording) and Prisma Accelerate (query caching).

What the repository provides

- `backend/src/prisma-optimize.ts` exports `createOptimizedPrismaClient()` which will:
  - Load env vars from `.env`.
  - Create a base `PrismaClient` with query/info/warn/error event logging and a local recorder fallback.
  - Optionally extend the Prisma client with `withOptimize({ apiKey })` when `ENABLE_PRISMA_OPTIMIZE=true` and `OPTIMIZE_API_KEY` is set.
  - Optionally extend the Prisma client with `withAccelerate(...)` when `ENABLE_PRISMA_ACCELERATE=true` (and the accelerate extension is installed). When both are enabled, both extensions are attached.

Quick setup

1. Install the optional extensions (if you plan to use them):

```bash
# From the repo root (or backend folder)
pnpm add -D @prisma/extension-optimize @prisma/extension-accelerate
```

2. Add environment variables to `backend/.env` (or your environment):

```
# Enable remote query recording (Prisma Optimize)
ENABLE_PRISMA_OPTIMIZE=true
OPTIMIZE_API_KEY=your_optimize_api_key_here

# Enable Prisma Accelerate caching (optional)
ENABLE_PRISMA_ACCELERATE=true
# Accelerate may require an API key or other config depending on provider
PRISMA_ACCELERATE_API_KEY=your_accelerate_api_key_here
# (alternate env name supported) ACCELERATE_API_KEY=...
```

Notes and guidance

- The code in `prisma-optimize.ts` will attempt to import `@prisma/extension-optimize` and `@prisma/extension-accelerate` using native ESM dynamic imports and fall back to `createRequire` for CommonJS environments.

- Per-query caching: to take advantage of Accelerate caching, use the `cacheStrategy` option on Prisma queries (examples are already wired into `backend/src/receipt-service.js`). Example:

```js
prisma.bENReceipt.findMany({
  where: {},
  orderBy: { lamportClock: 'asc' },
  take: 200,
  cacheStrategy: { swr: 60, ttl: 60 },
})
```

- If you enable these extensions, confirm the dependencies are installed and the proper API keys are present. If either extension is not available, the client will fall back to a normal `PrismaClient` and emit a warning.

- Accelerate is a managed caching layer. If you run multiple backend instances (multiple Node processes, containers, or replicas), using Accelerate (or another distributed cache) will ensure cache consistency across instances. Local in-process caching (LRU) won't be shared between processes.

Troubleshooting

- If you see a warning like "@prisma/extension-accelerate is not available", ensure the package is installed and that your environment supports dynamic import of that package.
- If caching doesn't appear to take effect, double-check that `ENABLE_PRISMA_ACCELERATE=true` is set and that the extension library version is compatible with your Prisma version.

Contact

If you want, I can enable a simple `PRISMA_ACCELERATE.md` or integrate CI steps to verify the extensions are present and to validate cache hits during test runs.