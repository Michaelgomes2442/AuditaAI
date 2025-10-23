# LLM API Setup Guide

## Overview
AuditaAI now supports real LLM API integration with OpenAI (GPT-4) and Anthropic (Claude). This guide will help you configure API keys and test the integration.

## Quick Start

### 1. Copy Environment Template
```bash
cd /home/michaelgomes/AuditaAI/backend
cp .env.example .env
```

### 2. Add Your API Keys

Edit `.env` file and add your API keys:

```env
# OpenAI API Key (for GPT-4 Turbo, GPT-4, etc.)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...your-key-here...

# Anthropic API Key (for Claude 3.5 Sonnet, Claude 3 Opus, etc.)
# Get your key from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...your-key-here...

# Server Configuration
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
```

### 3. Test API Availability

Run the test script to verify your API keys work:

```bash
node -e "import('./src/llm-client.js').then(m => m.checkAPIAvailability().then(console.log))"
```

Expected output:
```javascript
{
  openai: true,
  anthropic: true,
  hasAnyAPI: true
}
```

## API Key Sources

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)
5. Add to `.env` as `OPENAI_API_KEY=sk-proj-...`

**Pricing (as of 2024):**
- GPT-4 Turbo: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens

### Anthropic API Key
1. Go to https://console.anthropic.com/settings/keys
2. Sign in or create an account
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-...`)
5. Add to `.env` as `ANTHROPIC_API_KEY=sk-ant-...`

**Pricing (as of 2024):**
- Claude 3.5 Sonnet: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- Claude 3 Opus: ~$0.015 per 1K input tokens, ~$0.075 per 1K output tokens

## Supported Models

### OpenAI Models
- `gpt-4-turbo-preview` - GPT-4 Turbo (recommended for most tasks)
- `gpt-4` - GPT-4 (more expensive, slightly higher quality)
- `gpt-3.5-turbo` - GPT-3.5 Turbo (faster, cheaper, lower quality)

### Anthropic Models
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet (recommended, best balance)
- `claude-3-opus-20240229` - Claude 3 Opus (highest quality, most expensive)
- `claude-3-sonnet-20240229` - Claude 3 Sonnet (good balance)
- `claude-3-haiku-20240307` - Claude 3 Haiku (fastest, cheapest)

## Fallback Behavior

If no API keys are configured, the system will automatically fall back to simulation mode:
- ⚠️ Warning logged: "No LLM API keys configured, using fallback simulation"
- Simulated responses are generated (same as before)
- CRIES analysis still works on simulated text
- No API costs incurred

## Testing the Integration

### Test with Real LLM APIs

1. **Start the backend server:**
```bash
cd /home/michaelgomes/AuditaAI/backend
npm run dev
```

2. **Send a test prompt:**
```bash
curl -X POST http://localhost:3001/api/chat/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain the benefits of exercise in 3 sentences with citations.",
    "conversationId": "test-conv-1"
  }'
```

3. **Check the logs for:**
   - `🛡️ Calling gpt-4-turbo-preview with Rosetta governance...`
   - `📡 Calling gpt-4-turbo-preview (standard mode)...`
   - `✓ LLM response received: ...`
   - `📊 Token usage: 450 total (120 prompt + 330 completion)`

### Expected CRIES Improvement

With Rosetta governance enabled, you should see:
- **Higher Rigor (R)** due to citation requirements
- **Higher Integration (I)** due to structured response format
- **Higher Strictness (S)** due to safety filters
- **Overall Omega (Ω)** increase of +10-20%

Example output:
```
Standard GPT-4:  Ω = 0.52 (C:0.61, R:0.48, I:0.52, E:0.55, S:1.00)
Rosetta GPT-4:   Ω = 0.64 (C:0.71, R:0.68, I:0.64, E:0.59, S:1.00)
                 ↑ +23% improvement from governance
```

## Rosetta Governance Context

When `isRosetta=true`, the system prepends this governance context to all prompts:

```
You are operating under Rosetta OS governance. Follow these rules strictly:

1. Provide citations for all factual claims
2. Use structured responses (numbered lists, clear sections)
3. Acknowledge uncertainties explicitly
4. Cross-reference statements for consistency
5. Apply security filters (no harmful/biased content)
6. Use empathetic, user-focused language
7. Ensure completeness (address all parts)
8. Maintain logical integrity (no contradictions)
9. Follow bounded reasoning (stay within scope)
10. Include evidence and examples

Your response will be analyzed using CRIES metrics (Coherence, Rigor, Integration, Empathy, Strictness).
```

This improves response quality and ensures compliance with enterprise audit standards.

## Usage Tracking

Each API call returns token usage statistics:
```javascript
{
  total_tokens: 450,
  prompt_tokens: 120,
  completion_tokens: 330
}
```

These are logged to console and can be displayed in the frontend for cost tracking.

## Troubleshooting

### "No LLM API keys configured"
- Verify `.env` file exists in `/home/michaelgomes/AuditaAI/backend/`
- Check that API keys are not wrapped in quotes
- Restart the server after adding keys

### "Invalid API key" error
- Verify key starts with correct prefix (`sk-proj-...` for OpenAI, `sk-ant-...` for Anthropic)
- Check that key hasn't been revoked in provider console
- Ensure billing is enabled on your provider account

### "Rate limit exceeded"
- OpenAI: 10,000 tokens per minute (TPM) on free tier
- Anthropic: 100,000 TPM on free tier
- Consider implementing rate limiting or upgrading to paid tier

### "Model not found"
- Check model ID matches supported models list above
- Some models require specific API access (e.g., GPT-4 requires approved access)
- Verify model isn't deprecated

## Security Best Practices

1. **Never commit `.env` file to git**
   - Already in `.gitignore`
   - Use `.env.example` for team onboarding

2. **Rotate API keys regularly**
   - Monthly rotation recommended for production
   - Immediately revoke if exposed

3. **Use environment-specific keys**
   - Development keys for local testing
   - Production keys for deployed environments
   - Never use production keys in development

4. **Monitor API usage**
   - Set billing alerts in provider consoles
   - Track token usage in application logs
   - Implement usage quotas for users

## Next Steps

After configuring API keys:
1. Test parallel prompting with real GPT-4 vs Rosetta GPT-4
2. Compare CRIES scores to validate governance effectiveness
3. Test Claude 3.5 Sonnet for comparison
4. Implement model selection in frontend UI
5. Add cost estimation display
6. Set up usage monitoring dashboard

## Support

For issues or questions:
- Check provider documentation: [OpenAI Docs](https://platform.openai.com/docs) | [Anthropic Docs](https://docs.anthropic.com)
- Review `/home/michaelgomes/AuditaAI/backend/src/llm-client.js` for implementation details
- Test with `backend/test-cries-analyzer.mjs` to validate CRIES computation
