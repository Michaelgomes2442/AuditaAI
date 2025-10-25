# Deployment guide — Frontend (Vercel) + Neon Postgres

This document explains how to deploy the Next.js frontend to Vercel, connect it to a Neon Postgres database, and run Playwright E2E tests reliably against deployed infrastructure.

Summary
- Host the frontend on Vercel. Use server-side proxy routes (already present at `/api/proxy/[...segments]`) so the browser never needs to call developer-only hosts.
- Host the database on Neon (set `DATABASE_URL` in Vercel environment variables).
- Make E2E tests environment-aware: tests skip by default unless integration env vars are present (we added `requiresBackend()` and `test.skip` guards).

Key environment variables (Vercel project > Settings > Environment Variables)
- NEXT_PUBLIC_BACKEND_URL (optional, browser-visible): If your browser must call backend directly in production, set this to the public backend URL (e.g., `https://api.example.com`). If you rely on the server proxy, you can leave this blank.
- BACKEND_INTERNAL_URL (server-only): The upstream backend URL used by the server-side proxy route. Example: `https://api.internal.example`.
  - Use this when you want the frontend's server (Vercel functions) to forward requests to a backend without exposing the backend URL to the browser.
- NEXT_PUBLIC_APP_URL (optional, browser-visible): Public frontend origin. Useful for absolute link generation in emails or notifications.
- DATABASE_URL (server-only): Neon Postgres connection string. Example: `postgresql://username:password@<host>.neon.tech:5432/<db>?schema=public`
- MCP_SERVER_URL (server-only or CI): If Playwright or integration tests need an external MCP server, set this for tests that target it.
- CLAUDE_API_KEY / OPENAI_API_KEY / OTHER_MODEL_KEYS (CI-only): Set model keys required by particular E2E specs. Prefer storing them in CI's secrets rather than Vercel.

Security notes
- Never set database or other secret keys as public (`NEXT_PUBLIC_*`) environment variables.
- Use Vercel's secret/preview/production environment selection to avoid leaking staging keys into production.

How the proxy works (recommended pattern)
- Browser -> Frontend (Vercel) -> server-side proxy route `/api/proxy/[...segments]` -> BACKEND_INTERNAL_URL
- Client code should call same-origin endpoints like `/api/receipts/conversations` or `/api/proxy/receipts/conversations` rather than `http://localhost:3001`.
- Server-side code can use `process.env.BACKEND_INTERNAL_URL` to forward requests.

Playwright / E2E guidance
- Tests are skipped by default unless an integration environment is detected. To enable full E2E:
  - Set `E2E_RUN_INTEGRATION=1` or provide `BACKEND_INTERNAL_URL` / `NEXT_PUBLIC_BACKEND_URL` / `MCP_SERVER_URL` in the CI environment.
  - Provide any required API keys (e.g., `CLAUDE_API_KEY`) as CI secrets.

Example GitHub Actions (snippet)
```yaml
name: Playwright E2E
on: [pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: pnpm/action-setup@v2
        with:
          node-version: 20
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BACKEND_INTERNAL_URL: ${{ secrets.BACKEND_INTERNAL_URL }}
        run: pnpm --filter frontend run build
      - name: Start (for Playwright)
        run: pnpm --filter frontend start &
      - name: Run Playwright Tests
        env:
          E2E_RUN_INTEGRATION: '1'
          BACKEND_INTERNAL_URL: ${{ secrets.BACKEND_INTERNAL_URL }}
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        run: pnpm --filter frontend exec playwright test --config=./frontend/playwright.config.ts
```

If your CI runs `next build` and the build fails due to TypeScript/validator import issues, try running inside the CI's Ubuntu image rather than locally — Vercel and CI runners sometimes resolve the Next-generated validator artifacts differently than a developer machine.

Local dev notes
- Keep a local `.env` (do NOT commit) with values like:
  - `NEXTAUTH_URL=http://localhost:3000`
  - `NEXT_PUBLIC_API_URL=http://localhost:3000/api`
  - `DATABASE_URL=postgresql://...` (if you use a local Postgres)
- Use `pnpm --filter frontend dev` for local development.

Validation checklist before merging
- No remaining hardcoded `http://localhost:...` calls in editable source files. (We performed a sweep and replaced remaining ones with env-driven or proxy paths.)
- Playwright tests are environment-aware and will be skipped unless CI provides integration env vars.
- Create a PR and let CI/Vercel run `next build` and the tests in a production-like environment.

Troubleshooting
- If `pnpm run build` locally fails because of `.next/types/validator.ts` unresolved imports, you can:
  - Let CI run the build (practical option).
  - Or iterate locally: add a `frontend/types/next-generated.d.ts` with wildcard module declarations, adjust `tsconfig.json` includes, and re-run `pnpm run build` (this is more involved and environment-specific).

Questions / follow-ups
- Want me to add the GitHub Actions workflow file to the repo (draft) so you can see CI run immediately? Or would you prefer I open a PR with the changes made so far and let your CI validate them?

---
Generated on: 2025-10-24

CI workflow added
- A draft GitHub Actions workflow was added at `.github/workflows/frontend-ci.yml`. It runs on PRs and pushes to `main`, performs install/typecheck/build, and conditionally runs Playwright E2E only when `BACKEND_INTERNAL_URL` and `E2E_RUN_INTEGRATION` are present in repository secrets.
- Update: If you want the E2E job to run on PRs that target specific branches or for scheduled runs, we can extend the workflow triggers.

Add these secrets to GitHub repository Settings > Secrets to enable full E2E in CI:
- BACKEND_INTERNAL_URL
- DATABASE_URL
- E2E_RUN_INTEGRATION (set to '1' to enable the E2E job)
- CLAUDE_API_KEY (if your tests require it)
- OPENAI_API_KEY (optional)

