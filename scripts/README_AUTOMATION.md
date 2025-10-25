Automation scripts
==================

This folder contains two convenience scripts to help diagnose deployed backend issues and to run the Playwright bypass E2E against a deployed host.

1) scripts/diagnose_backend.sh

- Probes the deployed backend at the given TARGET_HOST and saves outputs to scripts/_outputs.
- Requires:
  - TARGET_HOST (e.g. auditaai.vercel.app)
  - Optionally VERCEL_BYPASS_TOKEN to bypass Vercel preview protection.

Example:

```bash
TARGET_HOST=auditaai.vercel.app VERCEL_BYPASS_TOKEN=... bash scripts/diagnose_backend.sh
```

Check the saved JSON files in `scripts/_outputs` (health.json, signup.json, login.json) for the backend responses. If `DEBUG_LOGIN=true` is set on the backend, the `login.json` may contain stack traces or helpful debug fields.

2) scripts/run_e2e_deploy.sh

- Wrapper around the existing Playwright bypass script at `backend/scripts/playwright_bypass.cjs`.
- Usage:

```bash
TARGET_HOST=auditaai.vercel.app VERCEL_BYPASS_TOKEN=... bash scripts/run_e2e_deploy.sh
```

Notes
-----
- These scripts intentionally do not persist secrets to the repo. Provide secrets via environment variables or CI secret configuration.
- If you prefer the Vercel API approach to fetch invocation-level logs, you'll need a VERCEL_TOKEN with appropriate scopes — that flow can be added later if desired.
