// Playwright script to perform Vercel preview-bypass cookie flow and exercise
// /health and /api/auth/signup endpoints. Prints responses to stdout.
const { chromium } = require('playwright');

// Set these values as needed
const BYPASS_TOKEN = process.env.VERCEL_BYPASS_TOKEN || 'zwk5CexKzbTbYw72W7K7ZhoL';
const TARGET_HOST = process.env.TARGET_HOST || 'backend-git-main-michael-gomes-projects.vercel.app';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Compose the bypass URL which instructs Vercel to set the bypass cookie
  const bypassUrl = `https://${TARGET_HOST}/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${BYPASS_TOKEN}`;
  console.log('BYPASS URL:', bypassUrl);

  try {
    // Navigate and wait for network to be idle; this should follow the SSO redirect
    const resp = await page.goto(bypassUrl, { waitUntil: 'networkidle', timeout: 45000 });
    console.log('Initial navigation status:', resp && resp.status());

    // After navigation, ensure cookies include Vercel auth cookie if present
    const cookies = await context.cookies();
    console.log('Cookies after bypass attempt:', cookies.map(c => ({ name: c.name, domain: c.domain }))); 

    // Use Playwright's APIRequestContext to call /health and signup using the same context cookies
    const request = await context.request.newContext();

    // Copy cookies into request context
    await request.setExtraHTTPHeaders({
      // no-op: cookies are sent automatically in browser context requests
    });

    // GET /health
    const healthRes = await page.request.get(`https://${TARGET_HOST}/health`);
    console.log('/health status:', healthRes.status());
    try { const body = await healthRes.text(); console.log('/health body (truncated):', body.slice(0, 200)); } catch (e) {}

    // POST /api/auth/signup
    const signupPayload = { email: `e2e+playwright+${Date.now()}@example.com`, password: 'Test1234!' };
    const signupRes = await page.request.post(`https://${TARGET_HOST}/api/auth/signup`, {
      data: JSON.stringify(signupPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('/api/auth/signup status:', signupRes.status());
    try { const sbody = await signupRes.text(); console.log('/api/auth/signup body (truncated):', sbody.slice(0, 1000)); } catch (e) {}

  } catch (err) {
    console.error('Playwright flow failed:', err && (err.stack || err.message) || String(err));
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}
