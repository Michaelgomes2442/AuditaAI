// ==================== PERFORMANCE & SCALABILITY ====================
// Load testing endpoint (for automated performance checks)
app.post('/load-test', async (req, res) => {
  const { requests = 100, concurrency = 10 } = req.body;
  let completed = 0;
  let errors = 0;
  const start = Date.now();
  const promises = [];
  for (let i = 0; i < requests; i++) {
    promises.push(new Promise(resolve => {
      appInsights.defaultClient && appInsights.defaultClient.trackEvent({ name: 'LoadTestRequest', properties: { i } });
      // Simulate endpoint call
      setTimeout(() => {
        completed++;
        resolve();
      }, Math.random() * 50);
    }));
  }
  await Promise.all(promises);
  const duration = Date.now() - start;
  appInsights.defaultClient && appInsights.defaultClient.trackEvent({ name: 'LoadTestComplete', properties: { requests, concurrency, duration } });
  res.json({ requests, completed, errors, duration });
});

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpu: process.cpuUsage(),
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };
  appInsights.defaultClient && appInsights.defaultClient.trackEvent({ name: 'PerformanceMetrics', properties: metrics });
  res.json(metrics);
});

// Horizontal scaling readiness (Azure App Service/Container Apps)
app.get('/scaling-info', (req, res) => {
  const scaling = {
    instanceId: process.env.WEBSITE_INSTANCE_ID || 'local',
    cpu: process.cpuUsage(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  appInsights.defaultClient && appInsights.defaultClient.trackEvent({ name: 'ScalingInfo', properties: scaling });
  res.json(scaling);
});
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// Enforce HTTPS in production
function enforceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
}
// Input validation helper
function validateInput(obj, schema) {
  for (const key of Object.keys(schema)) {
    if (schema[key].required && typeof obj[key] !== schema[key].type) {
      return false;
    }
    if (schema[key].sanitize && typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/[<>"'`]/g, '');
    }
  }
  return true;
}
// Rate limiting: 100 requests/minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
// Forward all console logs and errors to Azure Monitor
function forwardConsoleToAppInsights() {
  if (!appInsights.defaultClient) return;
  const origLog = console.log;
  const origError = console.error;
  console.log = function (...args) {
    appInsights.defaultClient.trackTrace({ message: args.map(String).join(' '), severity: appInsights.Contracts.SeverityLevel.Information });
    origLog.apply(console, args);
  };
  console.error = function (...args) {
    appInsights.defaultClient.trackException({ exception: new Error(args.map(String).join(' ')) });
    origError.apply(console, args);
  };
}
// Azure MCP server scaffold
import express from 'express';
import cors from 'cors';
import appInsights from 'applicationinsights';


// Azure Monitor (Application Insights) setup
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();
  appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'MCP-Server';
  forwardConsoleToAppInsights();
  console.log('Azure Application Insights enabled');
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(enforceHTTPS);

// Expanded health check endpoint with diagnostics
app.get('/health', (req, res) => {
  const diagnostics = {
    ok: true,
    time: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    appInsights: !!appInsights.defaultClient,
  };
  res.json(diagnostics);
});
// Global error handler for robust monitoring
app.use((err, req, res, next) => {
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackException({ exception: err });
    appInsights.defaultClient.trackTrace({ message: `Error: ${err.message}`, severity: appInsights.Contracts.SeverityLevel.Error });
  }
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Example MCP handshake endpoint
app.post('/handshake', (req, res) => {
  const schema = {
    token: { type: 'string', required: true, sanitize: true },
    label: { type: 'string', required: false, sanitize: true },
    demoId: { type: 'string', required: false, sanitize: true },
    apiCall: { type: 'string', required: false, sanitize: true }
  };
  if (!validateInput(req.body, schema)) {
    if (appInsights.defaultClient) appInsights.defaultClient.trackException({ exception: new Error('Invalid input in handshake') });
    return res.status(400).json({ error: 'Invalid input' });
  }
  const { token, label, demoId, apiCall } = req.body;
  // Custom event: Live Pilot Demo
  if (demoId && appInsights.defaultClient) {
    appInsights.defaultClient.trackEvent({ name: 'LivePilotDemo', properties: { demoId, label, token } });
  }
  // Custom event: API Call
  if (apiCall && appInsights.defaultClient) {
    appInsights.defaultClient.trackEvent({ name: 'MCPApiCall', properties: { apiCall, label, token } });
  }
  // Simulate Azure session validation
  if (appInsights.defaultClient) appInsights.defaultClient.trackEvent({ name: 'MCPHandshake', properties: { token, label } });
  res.json({ status: 'handshake-accepted', token });
});

// Add more MCP endpoints as needed

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Azure MCP server running on port ${PORT}`);
  if (appInsights.defaultClient) appInsights.defaultClient.trackEvent({ name: 'ServerStarted', properties: { port: PORT } });
});
