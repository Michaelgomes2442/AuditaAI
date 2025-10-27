# AuditaAI Frontend (Optional)

**Optional dashboard interface for AuditaAI Core**

> **Note**: This frontend is **optional** and not part of the core AuditaAI Core runtime. AuditaAI Core is a backend-only governance runtime that can be used independently or integrated with any frontend/dashboard of your choice.

This is a [Next.js](https://nextjs.org) project that provides a dashboard interface for interacting with AuditaAI Core. It demonstrates how to consume the AuditaAI Core API endpoints.

## Integration with AuditaAI Core

This frontend can connect to a running AuditaAI Core instance via the REST API:

- `POST /api/analyze` - Analyze prompts with governance
- `POST /api/compare` - Compare multiple LLMs
- `GET /api/receipts` - View Δ-Receipts
- `GET /api/health` - Health checks

## Getting Started

First, ensure AuditaAI Core is running:

```bash
cd ../backend
pnpm install
pnpm run migrate
pnpm run dev
```

Then run the frontend:

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 to see the dashboard.

## Architecture Note

This frontend is designed to demonstrate AuditaAI Core integration but is not required for the core functionality. You can:

1. Use AuditaAI Core as a standalone backend service
2. Build your own frontend/dashboard
3. Integrate with existing enterprise systems
4. Use the API directly from any programming language

## Core vs Frontend

- **AuditaAI Core** (required): Backend governance runtime with API
- **This Frontend** (optional): Example dashboard interface
