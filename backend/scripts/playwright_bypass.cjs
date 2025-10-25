const { chromium } = require('playwright');

// Set these via env or defaults
const BYPASS_TOKEN = process.env.VERCEL_BYPASS_TOKEN || process.env.BYPASS_TOKEN || '';
const TARGET_HOST = process.env.TARGET_HOST || 'backend-git-main-michael-gomes-projects.vercel.app';

// Allow TARGET_HOST to be either a host (example.com) or a full URL (http://localhost:3001)
function normalizeBaseUrl(target) {
  if (!target) return 'https://backend-git-main-michael-gomes-projects.vercel.app';
  if (target.startsWith('http://') || target.startsWith('https://')) return target.replace(/\/$/, '');
  return `https://${target}`;
}
const BASE_URL = normalizeBaseUrl(TARGET_HOST);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const urlFor = (path) => {
    if (!path.startsWith('/')) path = '/' + path;
    return `${BASE_URL}${path}`;
  };

  // Append bypass query params to a url when a bypass token is present.
  const urlForWithBypass = (path) => {
    const base = urlFor(path);
    if (!BYPASS_TOKEN) return base;
    return `${base}${base.includes('?') ? '&' : '?'}x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${BYPASS_TOKEN}`;
  };

  const bypassUrl = `${BASE_URL}/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${BYPASS_TOKEN}`;
  console.log('BYPASS URL:', bypassUrl);

  try {
    let resp = await page.goto(bypassUrl, { waitUntil: 'networkidle', timeout: 45000 });
    console.log('Initial navigation status:', resp && resp.status());

    // If a bypass token is present, always attempt the vercel SSO API
    // endpoint to ensure cookies are set on the vercel.com domain. Some
    // deployments return 200 on the initial page but still require the
    // SSO cookie to access protected API routes (login). Calling the SSO
    // endpoint proactively avoids relying on a 401 trigger.
    if (BYPASS_TOKEN) {
      const ssoUrl = `https://vercel.com/sso-api?url=${encodeURIComponent(urlFor('/health'))}&x-vercel-protection-bypass=${BYPASS_TOKEN}`;
      console.log('Navigating to vercel SSO API (force):', ssoUrl);
      try {
        resp = await page.goto(ssoUrl, { waitUntil: 'networkidle', timeout: 45000 });
        console.log('SSO navigation status:', resp && resp.status());
      } catch (e) {
        console.warn('SSO navigation failed:', e && (e.stack || e.message) || String(e));
      }
    }

    const cookies = await context.cookies();
    console.log('Cookies after bypass attempt:', cookies.map(c => ({ name: c.name, domain: c.domain })));

    // GET /health
    const healthRes = await page.request.get(urlFor('/health'));
    console.log('/health status:', healthRes.status());
    try { const body = await healthRes.text(); console.log('/health body (truncated):', body.slice(0, 400)); } catch (e) {}

    // POST /api/auth/signup (include name and confirmPassword per backend requirements)
    const testEmail = `e2e+playwright+${Date.now()}@example.com`;
    const testPassword = 'Test1234!';
    const signupPayload = { email: testEmail, password: testPassword, confirmPassword: testPassword, name: 'Playwright E2E' };
    const signupRes = await page.request.post(urlForWithBypass('/api/auth/signup'), {
      data: JSON.stringify(signupPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('/api/auth/signup status:', signupRes.status());
    let signupBody = '';
    try { signupBody = await signupRes.text(); console.log('/api/auth/signup body (truncated):', signupBody.slice(0, 1200)); } catch (e) {}

    // If signup succeeded (200/201), attempt to log in using the same credentials
    if (signupRes.status() === 201 || signupRes.status() === 200) {
      // Perform login via Playwright API request (server-side) for local testing
      try {
        const loginRes = await page.request.post(urlForWithBypass('/api/auth/login'), {
          data: JSON.stringify({ email: testEmail, password: testPassword }),
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('/api/auth/login status:', loginRes.status());
        try { const lbody = await loginRes.text(); console.log('/api/auth/login body (truncated):', lbody.slice(0, 1200)); } catch (e) {}
      } catch (loginErr) {
        console.error('/api/auth/login failed (request error):', String(loginErr));
      }
    } else {
      console.log('Skipping login because signup did not return success status (200/201)');
    }

    // --- UI-driven signup + signin flow (uses page context so cookies are included) ---
    try {
      // Skip UI flows when testing against a local backend-only server (no frontend present)
      if (BASE_URL.startsWith('http://localhost') || BASE_URL.includes('127.0.0.1')) {
        console.log('Skipping UI-driven signup/signin flow because target appears to be a local backend');
      } else {
      const uiEmail = `e2e+ui+${Date.now()}@example.com`;
      const uiPassword = 'Test1234!';
      console.log('Starting UI signup flow for:', uiEmail);

  // Navigate to signup page (browser context has bypass cookie)
  await page.goto(urlForWithBypass('/signup'), { waitUntil: 'networkidle', timeout: 45000 });

      // Fill form fields by id
      await page.fill('#name', 'Playwright UI');
      await page.fill('#email', uiEmail);
      await page.fill('#password', uiPassword);
      await page.fill('#confirmPassword', uiPassword);

      // Submit the form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 45000 }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);

      // After signup the frontend redirects to /signin; verify
      const currentUrl = page.url();
      console.log('After UI signup, current URL:', currentUrl);

      // Now perform UI signin
      console.log('Starting UI signin for:', uiEmail);
  await page.goto(urlForWithBypass('/signin'), { waitUntil: 'networkidle', timeout: 45000 });
      await page.fill('#email', uiEmail);
      await page.fill('#password', uiPassword);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 45000 }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);

      const postSigninUrl = page.url();
      console.log('After UI signin, current URL:', postSigninUrl);
      if (postSigninUrl.includes('/dashboard')) {
        console.log('UI signin appears successful, reached dashboard');
      } else {
        console.log('UI signin did not redirect to dashboard; check page contents or errors');
      }
      }
    } catch (uiErr) {
      console.error('UI-driven signup/signin flow failed:', uiErr && (uiErr.stack || uiErr.message) || String(uiErr));
    }

  } catch (err) {
    console.error('Playwright flow failed:', err && (err.stack || err.message) || String(err));
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}
