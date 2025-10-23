# Azure MCP Server

This is a minimal Model Context Protocol (MCP) server scaffold for Azure deployment.

## Features
- Express.js API with CORS and JSON body parsing
- `/health` endpoint for status checks
- `/handshake` endpoint for MCP session token exchange
- Ready for Azure App Service or Container Apps

## Deployment

1. Set up an Azure Web App or Container App.
2. Add your Azure publish profile secrets to GitHub Actions.
3. Push to `main` to trigger deployment via `azure-webapp.yml`.

## Local Development

```bash
cd backend/mcp-server
npm install
node index.js
```

## Endpoints
- `GET /health` — returns `{ ok: true, time }`
- `POST /handshake` — accepts `{ token }` and returns handshake status

## Next Steps
- Add authentication, session management, and MCP protocol logic as needed.
- Integrate with Azure Key Vault for ephemeral session keys.
- Use Azure Monitor for logging and diagnostics.
