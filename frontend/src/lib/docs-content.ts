export interface DocSection {
  id: string;
  title: string;
  icon: string;
  articles: DocArticle[];
}

export interface DocArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastUpdated: string;
}

export const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket',
    articles: [
      {
        id: 'introduction',
        title: 'Introduction to AuditaAI',
        tags: ['basics', 'overview'],
        lastUpdated: '2025-10-22',
        content: `# Introduction to AuditaAI

AuditaAI is a comprehensive AI model testing and evaluation platform designed for teams who need to ensure quality, performance, and cost-efficiency across multiple LLM providers.

## Key Features

- **Multi-Provider Support**: Test models from OpenAI, Anthropic, Google, and more
- **CRIES Framework**: Comprehensive evaluation using Completeness, Relevance, Instruction-following, Efficiency, and Safety metrics
- **Real-time Monitoring**: Track performance, costs, and rate limits across all your tests
- **Collaboration Tools**: Share templates, comment on results, and work together with your team
- **Automated Testing**: Schedule recurring tests and regression checks

## Quick Start

1. Sign up for an account
2. Configure your API keys in Settings
3. Create your first test in the Playground
4. View results in the Dashboard
5. Set up automated tests and alerts

## Platform Architecture

AuditaAI uses a modern tech stack:
- Next.js 15 for the frontend
- PostgreSQL for data persistence  
- Lamport clocks for blockchain verification
- WebSocket support for real-time updates

Get started by exploring the Pilot interface or jump right into the Playground!`,
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        tags: ['tutorial', 'basics'],
        lastUpdated: '2025-10-22',
        content: `# Quick Start Guide

Get up and running with AuditaAI in under 5 minutes.

## Step 1: Create Your Account

Navigate to the signup page and create your account. Choose your tier:
- **Free**: 100 tests/month, 1 user
- **Starter**: 1,000 tests/month, 5 users
- **Professional**: 10,000 tests/month, 20 users
- **Enterprise**: Unlimited tests, unlimited users

## Step 2: Configure API Keys

Go to Settings > API Keys and add your provider credentials:

\`\`\`bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
\`\`\`

## Step 3: Run Your First Test

### Using the Playground

1. Navigate to /playground
2. Select your provider and model
3. Enter a test prompt
4. Click "Execute" to see results
5. Save successful prompts as templates

### Using the Pilot Interface

1. Go to /pilot
2. Choose a model from the dropdown
3. Enter your prompt
4. Click "Test Model"
5. View CRIES analysis results

## Step 4: View Results

- **Dashboard**: Overview of all test results
- **Compare**: Side-by-side model comparisons
- **Heatmap**: Visual performance matrix
- **Costs**: Track spending across models

## Step 5: Automate Testing

1. Create a template from a successful test
2. Go to Templates and configure automation
3. Set up webhooks for notifications
4. Enable regression testing for your models

## Next Steps

- Explore the API Reference
- Set up team collaboration
- Configure budget alerts
- Review best practices`,
      },
      {
        id: 'api-keys',
        title: 'Setting Up API Keys',
        tags: ['configuration', 'setup'],
        lastUpdated: '2025-10-22',
        content: `# Setting Up API Keys

Learn how to securely configure your LLM provider API keys.

## Supported Providers

AuditaAI supports the following providers:

### OpenAI
- Models: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, GPT-4o
- Key format: \`sk-...\`
- Get your key: https://platform.openai.com/api-keys

### Anthropic
- Models: Claude 3 Opus, Sonnet, Haiku, Claude 2.1
- Key format: \`sk-ant-...\`
- Get your key: https://console.anthropic.com/

### Google AI
- Models: Gemini Pro, Gemini 1.5 Pro/Flash
- Key format: \`AIza...\`
- Get your key: https://makersuite.google.com/app/apikey

## Adding Keys

### Via Settings UI

1. Navigate to Settings > API Keys
2. Click "Add Provider"
3. Select your provider
4. Paste your API key
5. Click "Save"

### Environment Variables

For self-hosted deployments, add to your \`.env\`:

\`\`\`bash
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_API_KEY=AIzayour-key-here
\`\`\`

## Security Best Practices

- **Never commit API keys** to version control
- **Rotate keys regularly** (every 90 days recommended)
- **Use separate keys** for development and production
- **Monitor usage** via provider dashboards
- **Set spending limits** on provider accounts
- **Enable IP restrictions** when available

## Key Permissions

Ensure your keys have the correct permissions:

- OpenAI: \`model.request\` permission
- Anthropic: Full API access
- Google: Generative AI API enabled

## Troubleshooting

### "Invalid API Key" Error
- Verify the key is copied correctly (no extra spaces)
- Check the key hasn't expired
- Ensure the key has proper permissions

### "Rate Limit" Error
- Check your provider's rate limits
- Upgrade your provider tier if needed
- Use our rate limiting dashboard to monitor usage

### "Insufficient Quota" Error
- Add payment method to provider account
- Check billing status
- Contact provider support`,
      },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    icon: 'sparkles',
    articles: [
      {
        id: 'cries-framework',
        title: 'CRIES Evaluation Framework',
        tags: ['evaluation', 'metrics'],
        lastUpdated: '2025-10-22',
        content: `# CRIES Evaluation Framework

The CRIES framework provides comprehensive evaluation of AI model outputs across five key dimensions.

## The Five Dimensions

### 1. Completeness (20%)
Measures whether the response addresses all aspects of the prompt.

**Scoring Criteria:**
- 100: All aspects fully addressed
- 75: Most aspects covered
- 50: Partial coverage
- 25: Minimal coverage
- 0: No relevant content

### 2. Relevance (20%)
Evaluates how well the response stays on topic.

**Scoring Criteria:**
- 100: Highly relevant throughout
- 75: Mostly relevant
- 50: Partially relevant
- 25: Minimally relevant
- 0: Off-topic

### 3. Instruction-following (20%)
Assesses adherence to specific instructions in the prompt.

**Scoring Criteria:**
- 100: Follows all instructions perfectly
- 75: Follows most instructions
- 50: Follows some instructions
- 25: Minimal instruction following
- 0: Ignores instructions

### 4. Efficiency (20%)
Measures response conciseness vs. completeness balance.

**Scoring Criteria:**
- 100: Optimal length, no redundancy
- 75: Slightly verbose but acceptable
- 50: Some unnecessary content
- 25: Significantly verbose
- 0: Extremely verbose or too brief

### 5. Safety (20%)
Evaluates content safety and appropriateness.

**Scoring Criteria:**
- 100: Completely safe
- 75: Minor concerns
- 50: Moderate concerns
- 25: Significant concerns
- 0: Unsafe content

## Total CRIES Score

The final score is a weighted average of all five dimensions:

\`\`\`
Total Score = (C + R + I + E + S) / 5
\`\`\`

## Interpreting Scores

- **90-100**: Excellent
- **80-89**: Very Good
- **70-79**: Good
- **60-69**: Fair
- **Below 60**: Needs Improvement

## Using CRIES in Tests

CRIES scores are automatically calculated for all tests and displayed in:
- Test result details
- Dashboard analytics
- Heatmap visualizations
- Comparison views`,
      },
      {
        id: 'templates',
        title: 'Working with Templates',
        tags: ['templates', 'automation'],
        lastUpdated: '2025-10-22',
        content: `# Working with Templates

Templates allow you to save and reuse test configurations across your team.

## Creating Templates

### From Playground
1. Execute a test in the Playground
2. Click "Save as Template"
3. Enter a name and description
4. Template is saved to your library

### From Scratch
1. Go to /templates
2. Click "New Template"
3. Fill in the configuration:
   - Name and description
   - Provider and model
   - Prompt template
   - Parameters (temperature, max tokens, etc.)
4. Click "Save"

## Template Variables

Use variables in your prompts for dynamic content:

\`\`\`
Test the model's ability to {{task}} with {{context}}.
Respond in {{format}} format.
\`\`\`

When executing, you'll be prompted to fill in the variables.

## Sharing Templates

### With Your Team
1. Open a template
2. Click "Share"
3. Select team members
4. Set permissions (view/edit)

### Public Templates
- Mark templates as "Public" to share with all users
- Browse public templates in the template library
- Fork public templates to customize

## Automating Templates

### Scheduled Execution
1. Open a template
2. Click "Schedule"
3. Set frequency (daily, weekly, monthly)
4. Configure time and timezone
5. Enable automation

### Webhook Triggers
1. Go to /webhooks
2. Create a new webhook
3. Select template to execute
4. Set trigger events
5. Configure delivery URL

## Best Practices

- **Use descriptive names**: Make templates easy to find
- **Add detailed descriptions**: Help others understand the purpose
- **Tag appropriately**: Use tags for better organization
- **Version control**: Create new templates for major changes
- **Test before scheduling**: Verify templates work correctly
- **Monitor costs**: Set budget alerts for automated templates`,
      },
      {
        id: 'regression-testing',
        title: 'Automated Regression Testing',
        tags: ['testing', 'automation'],
        lastUpdated: '2025-10-22',
        content: `# Automated Regression Testing

Detect performance degradation automatically when models are updated.

## Setting Up Baselines

Baselines establish expected performance levels for your models.

### Creating a Baseline

1. Navigate to /regression
2. Click "New Baseline"
3. Configure:
   - Model name and version
   - Test type (coding, reasoning, creative, etc.)
   - Alert threshold (% degradation to trigger alerts)
4. Click "Create Baseline"

The system will analyze your last 100 tests (minimum 10 required) to establish baseline metrics.

## Baseline Metrics

Each baseline tracks five key metrics:

1. **Response Time**: Average milliseconds
2. **Cost**: Average per request
3. **Quality Score**: Average CRIES score
4. **Accuracy**: Average accuracy percentage
5. **Success Rate**: Percentage of completed tests

## Running Regression Tests

### Manual Execution
1. Go to /regression
2. Click "Run Regression Tests"
3. View comparison results

### Automated Execution
Set up webhooks to trigger regression tests when:
- New model versions are released
- Scheduled intervals (daily, weekly)
- After configuration changes

## Alert Thresholds

Configure when to be notified of regressions:

- **10%**: Recommended default
- **5%**: Strict quality requirements
- **15%**: More tolerance for variation

## Interpreting Results

### Passing Tests
Green indicators show performance within acceptable ranges.

### Regressions Detected
Red badges indicate metrics that have degraded beyond threshold:
- Review specific degraded metrics
- Compare current vs. baseline performance
- Investigate root causes
- Update baselines if changes are expected

## Best Practices

- **Establish baselines early**: Before major model updates
- **Use appropriate thresholds**: Balance sensitivity and noise
- **Monitor regularly**: Weekly regression checks recommended
- **Update baselines**: When intentional changes occur
- **Investigate promptly**: Address regressions quickly
- **Document changes**: Track model version history`,
      },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: 'code',
    articles: [
      {
        id: 'rest-api',
        title: 'REST API Overview',
        tags: ['api', 'integration'],
        lastUpdated: '2025-10-22',
        content: `# REST API Overview

AuditaAI provides a comprehensive REST API for programmatic access.

## Authentication

All API requests require authentication using API keys.

### Getting Your API Key

1. Go to Settings > API Keys
2. Click "Generate API Key"
3. Copy and store securely

### Using Your API Key

Include in the Authorization header:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.auditaai.com/v1/tests
\`\`\`

## Base URL

\`\`\`
https://api.auditaai.com/v1
\`\`\`

## Rate Limits

- **Free**: 100 requests/hour
- **Starter**: 1,000 requests/hour
- **Professional**: 10,000 requests/hour
- **Enterprise**: Custom limits

## Common Endpoints

### Tests

\`\`\`bash
# Create a test
POST /v1/tests
{
  "prompt": "Your test prompt",
  "modelName": "gpt-4",
  "modelProvider": "openai",
  "temperature": 0.7
}

# Get test results
GET /v1/tests/:id

# List tests
GET /v1/tests?limit=20&offset=0
\`\`\`

### Templates

\`\`\`bash
# List templates
GET /v1/templates

# Create template
POST /v1/templates
{
  "name": "My Template",
  "prompt": "Template content",
  "modelName": "gpt-4"
}

# Execute template
POST /v1/templates/:id/execute
\`\`\`

### Webhooks

\`\`\`bash
# List webhooks
GET /v1/webhooks

# Create webhook
POST /v1/webhooks
{
  "url": "https://your-domain.com/webhook",
  "events": ["test.completed"],
  "secret": "your-secret"
}
\`\`\`

## Response Format

All responses follow this structure:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2025-10-22T10:00:00Z"
  }
}
\`\`\`

## Error Handling

Errors return appropriate HTTP status codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limit Exceeded
- 500: Internal Server Error

Error response format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Description of error"
  }
}
\`\`\``,
      },
      {
        id: 'webhooks-api',
        title: 'Webhooks API',
        tags: ['api', 'webhooks', 'integration'],
        lastUpdated: '2025-10-22',
        content: `# Webhooks API

Receive real-time notifications for events in your AuditaAI workspace.

## Supported Events

- \`test.completed\`: Test execution finished
- \`test.failed\`: Test execution failed
- \`batch.completed\`: Batch test finished
- \`schedule.completed\`: Scheduled test finished
- \`regression.detected\`: Performance regression found
- \`budget.threshold\`: Budget limit reached
- \`rate_limit.warning\`: Approaching rate limit
- \`rate_limit.exceeded\`: Rate limit exceeded

## Webhook Payload

All webhook deliveries include:

\`\`\`json
{
  "event": "test.completed",
  "timestamp": "2025-10-22T10:00:00Z",
  "data": {
    "testId": 123,
    "modelName": "gpt-4",
    "status": "completed",
    "criesScore": 0.85,
    "responseTime": 1234,
    "cost": 0.002
  },
  "webhookId": "wh_123"
}
\`\`\`

## Security

### HMAC Signature

All webhooks include an HMAC signature in the \`X-Signature\` header.

Verify the signature:

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  );
}
\`\`\`

### Best Practices

- Always verify signatures
- Use HTTPS endpoints only
- Implement idempotency using \`webhookId\`
- Return 200 status quickly (process async)
- Implement retry logic for failures

## Retry Logic

Failed deliveries are retried with exponential backoff:

1. Immediate retry
2. 1 minute
3. 5 minutes
4. 15 minutes
5. 1 hour

After 5 failed attempts, the webhook is disabled.

## Testing Webhooks

Use the /webhooks interface to:
- Send test deliveries
- View delivery logs
- Debug payloads
- Check signatures`,
      },
    ],
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: 'lightbulb',
    articles: [
      {
        id: 'cost-optimization',
        title: 'Cost Optimization Strategies',
        tags: ['costs', 'optimization'],
        lastUpdated: '2025-10-22',
        content: `# Cost Optimization Strategies

Reduce your AI testing costs while maintaining quality.

## Model Selection

### Choose the Right Model
- Use GPT-3.5 for simple tasks
- Reserve GPT-4 for complex reasoning
- Try Claude Haiku for cost-effective alternatives
- Use Gemini Flash for high-volume testing

### Cost Comparison

| Model | Cost per 1K tokens | Best For |
|-------|-------------------|----------|
| GPT-4o | $0.005 | Complex tasks |
| GPT-4 Turbo | $0.01 | Analysis |
| GPT-3.5 | $0.0015 | Simple tasks |
| Claude Sonnet | $0.003 | Balanced |
| Gemini Flash | $0.0001 | Volume |

## Token Management

### Optimize Prompts
- Be concise and specific
- Remove unnecessary context
- Use structured formats
- Limit example count

### Set Token Limits
Configure \`maxTokens\` appropriately:
- Simple responses: 500-1000
- Detailed answers: 1000-2000
- Complex analysis: 2000-4000

## Caching Strategies

### Reuse Results
- Save successful responses
- Create templates from good tests
- Use templates for similar tasks

### Batch Processing
- Group similar tests together
- Use batch endpoints when available
- Schedule tests during off-peak hours

## Budget Monitoring

### Set Alerts
1. Go to /costs
2. Click "Set Budget"
3. Enter monthly limit
4. Enable alerts at 75% and 90%

### Track Spending
- Review daily cost trends
- Analyze cost by model
- Identify expensive tests
- Optimize high-cost workflows

## Testing Efficiency

### Use Regression Baselines
- Test only when needed
- Focus on critical paths
- Automate only essential tests

### Sampling Strategy
- Test 10-20% during development
- Full testing before production
- Spot checks in production

## Advanced Techniques

### Model Cascading
1. Start with cheaper model
2. If score < threshold, use premium model
3. Only pay for quality when needed

### Smart Retry Logic
- Don't retry transient errors immediately
- Use exponential backoff
- Set maximum retry limits

## Monitoring ROI

Calculate your testing ROI:

\`\`\`
ROI = (Issues Prevented Cost - Testing Cost) / Testing Cost
\`\`\`

Track:
- Bugs caught before production
- Customer satisfaction improvements
- Time saved on manual testing`,
      },
      {
        id: 'security-best-practices',
        title: 'Security Best Practices',
        tags: ['security', 'compliance'],
        lastUpdated: '2025-10-22',
        content: `# Security Best Practices

Keep your AuditaAI workspace secure and compliant.

## API Key Management

### Storage
- Never commit keys to git
- Use environment variables
- Encrypt keys at rest
- Rotate keys quarterly

### Access Control
- Use separate keys per environment
- Limit key permissions
- Revoke unused keys
- Monitor key usage

## User Access

### Role-Based Access
- Assign minimal permissions
- Review permissions quarterly
- Remove inactive users
- Use teams for organization

### Authentication
- Enforce strong passwords
- Enable 2FA for all users
- Set session timeouts
- Monitor login activity

## Data Protection

### Sensitive Data
- Don't include PII in prompts
- Sanitize test data
- Use data masking
- Follow GDPR/CCPA requirements

### Audit Logging
- Enable audit logs
- Review logs regularly
- Export for compliance
- Retain per policy

## Network Security

### API Access
- Use HTTPS only
- Whitelist IP addresses
- Set up firewalls
- Monitor traffic

### Webhook Security
- Verify HMAC signatures
- Use HTTPS endpoints
- Implement rate limiting
- Validate payloads

## Compliance

### Data Retention
- Set retention policies
- Auto-delete old data
- Archive when required
- Document retention rules

### Privacy
- Minimize data collection
- Obtain consent
- Honor deletion requests
- Provide data exports

## Incident Response

### Preparation
1. Document incident procedures
2. Assign response team
3. Set up alerting
4. Regular drills

### Response Steps
1. Identify and contain
2. Assess impact
3. Notify stakeholders
4. Remediate
5. Post-mortem

## Regular Security Reviews

Monthly:
- Review active API keys
- Check user access
- Audit webhook configurations
- Review cost anomalies

Quarterly:
- Rotate API keys
- Security training
- Penetration testing
- Compliance audit`,
      },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: 'help-circle',
    articles: [
      {
        id: 'general-faq',
        title: 'General Questions',
        tags: ['faq', 'help'],
        lastUpdated: '2025-10-22',
        content: `# Frequently Asked Questions

## General

**Q: What is AuditaAI?**
A: AuditaAI is a comprehensive platform for testing, evaluating, and monitoring AI models across multiple providers.

**Q: Which LLM providers are supported?**
A: We support OpenAI (GPT-4, GPT-3.5), Anthropic (Claude 3), Google (Gemini), and more providers being added regularly.

**Q: How is pricing calculated?**
A: Pricing is based on your tier (Free, Starter, Professional, Enterprise) plus the underlying costs from LLM providers.

**Q: Can I use my own API keys?**
A: Yes! You provide your own API keys for each provider, giving you full control and direct billing.

## Technical

**Q: How does the CRIES framework work?**
A: CRIES evaluates responses across five dimensions: Completeness, Relevance, Instruction-following, Efficiency, and Safety.

**Q: What is Lamport clock verification?**
A: We use Lamport clocks to create an immutable audit trail of all test executions for compliance and verification.

**Q: Can I export my data?**
A: Yes! Export test results in CSV, JSON, or PDF formats from the dashboard or via API.

**Q: Does AuditaAI store my prompts?**
A: Yes, prompts and responses are stored for analysis. You can delete data anytime from Settings.

## Features

**Q: How do I set up automated testing?**
A: Create a template, then configure scheduling or webhooks to trigger automatic execution.

**Q: Can I compare multiple models?**
A: Yes! Use the Compare view or Heatmap to see side-by-side model performance.

**Q: What are regression baselines?**
A: Baselines establish expected performance levels and alert you when models degrade.

**Q: How do I share templates with my team?**
A: Open any template and click "Share" to grant access to specific team members.

## Billing

**Q: How are LLM costs calculated?**
A: Costs are calculated based on tokens used and the provider's pricing. We show estimated costs for each test.

**Q: Can I set budget limits?**
A: Yes! Set monthly budgets in the Costs dashboard with alerts at 75% and 90%.

**Q: What happens if I exceed my tier limits?**
A: Tests will be paused until the next billing cycle. Upgrade your tier for higher limits.

## Support

**Q: How do I get help?**
A: Use the in-app support widget, email support@auditaai.com, or check this documentation.

**Q: Is there a community forum?**
A: Yes! Join our Discord community for discussions, tips, and updates.

**Q: Can I request new features?**
A: Absolutely! Use the feedback widget or submit on our GitHub roadmap.`,
      },
    ],
  },
];
