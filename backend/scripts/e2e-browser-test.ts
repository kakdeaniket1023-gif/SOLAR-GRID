import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/Users/aniketsanjaykakde/.gemini/antigravity-ide/brain/445e2aa8-2229-48f2-a993-1f3e017a43b0/screenshots';
const SCRATCHPAD_FILE = '/Users/aniketsanjaykakde/.gemini/antigravity-ide/brain/445e2aa8-2229-48f2-a993-1f3e017a43b0/browser/scratchpad_2jme7pze.md';

interface TestResult {
  route: string;
  name: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  errors: string[];
  consoleErrors: string[];
  screenshotPath?: string;
}

const results: TestResult[] = [];

async function main() {
  console.log('🚀 Launching Chrome at:', CHROME_PATH);
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  let currentConsoleErrors: string[] = [];
  let currentNetworkErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon or non-critical asset warnings if any
      if (!text.includes('favicon.ico')) {
        currentConsoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    currentConsoleErrors.push(err.message);
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
      currentNetworkErrors.push(`${res.status()} on ${res.url()}`);
    }
  });

  async function testPage(route: string, name: string, options: { waitForSelector?: string; waitTime?: number } = {}) {
    console.log(`\nTesting: [${name}] -> ${route}`);
    currentConsoleErrors = [];
    currentNetworkErrors = [];

    const testItem: TestResult = {
      route,
      name,
      status: 'PASS',
      errors: [],
      consoleErrors: [],
    };

    try {
      const response = await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      testItem.statusCode = response?.status();

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 5000 }).catch(() => {
          testItem.errors.push(`Selector not found: ${options.waitForSelector}`);
        });
      }

      if (options.waitTime) {
        await new Promise((resolve) => setTimeout(resolve, options.waitTime));
      }

      testItem.consoleErrors = [...currentConsoleErrors];
      if (currentNetworkErrors.length > 0) {
        testItem.errors.push(...currentNetworkErrors);
      }

      // Check if page rendered Next.js error overlay or 404/500 text
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('Internal Server Error') || bodyText.includes('Application error: a client-side exception')) {
        testItem.errors.push('Found fatal error string in rendered page body');
      }

      if (testItem.errors.length > 0 || testItem.consoleErrors.length > 0 || (testItem.statusCode && testItem.statusCode >= 400)) {
        testItem.status = 'FAIL';
      }

      // Save screenshot
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${testItem.status.toLowerCase()}_${safeName}.png`;
      const screenshotPath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      testItem.screenshotPath = screenshotPath;
      console.log(`  Result: ${testItem.status} (Screenshot saved: ${filename})`);
    } catch (err: any) {
      testItem.status = 'FAIL';
      testItem.errors.push(`Navigation failed: ${err.message}`);
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `fail_crash_${safeName}.png`;
      const screenshotPath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: screenshotPath }).catch(() => {});
      testItem.screenshotPath = screenshotPath;
      console.log(`  Result: FAIL with exception: ${err.message}`);
    }

    results.push(testItem);
  }

  // 1. PUBLIC PAGES
  await testPage('/', 'Landing Page', { waitTime: 500 });
  await testPage('/login', 'Login Page', { waitForSelector: 'input[type="email"]' });
  await testPage('/signup', 'Signup Page', { waitForSelector: 'input[type="email"]' });
  await testPage('/forgot-password', 'Forgot Password Page');
  await testPage('/rules', 'Rules Page');
  await testPage('/privacy', 'Privacy Page');
  await testPage('/terms', 'Terms Page');

  // 2. ADMIN AUTHENTICATION & MLM ADMIN SUITE
  console.log('\n--- Executing Super Admin Login ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@gmail.com');
  await page.type('input[type="password"]', 'password-admin123@');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  await testPage('/admin', 'Admin MLM Dashboard', { waitTime: 1000 });
  await testPage('/admin/mlm', 'Admin Genealogy Tree', { waitTime: 1500 });
  await testPage('/admin/commissions', 'Admin 3-Tier Commissions', { waitTime: 1000 });
  await testPage('/admin/users', 'Admin Member Directory', { waitTime: 1000 });
  await testPage('/admin/points', 'Admin Points Desk', { waitTime: 1000 });
  await testPage('/admin/units', 'Admin Member Units', { waitTime: 1000 });
  await testPage('/admin/recharges', 'Admin Recharges Desk', { waitTime: 1000 });
  await testPage('/admin/withdrawals', 'Admin Withdrawals Desk', { waitTime: 1000 });
  await testPage('/admin/settings', 'Admin Operational Settings', { waitTime: 1000 });

  // 3. USER AUTHENTICATION & USER DASHBOARD
  console.log('\n--- Executing User Login ---');
  // Clear cookies
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'sarah.jenkins@solargrid.io');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  await testPage('/dashboard', 'User Home Dashboard', { waitTime: 1000 });
  await testPage('/dashboard/panels', 'User Panels Catalogue', { waitTime: 1000 });
  await testPage('/dashboard/start-panel', 'User Start Panel Console', { waitTime: 1000 });
  await testPage('/dashboard/invite', 'User Referral & Invite', { waitTime: 1000 });
  await testPage('/dashboard/profile', 'User Profile & Wallet', { waitTime: 1000 });
  await testPage('/dashboard/recharge', 'User Recharge Desk', { waitTime: 1000 });
  await testPage('/dashboard/withdrawal', 'User Withdrawal Desk', { waitTime: 1000 });

  await browser.close();

  // 4. WRITE REPORT TO SCRATCHPAD
  console.log('\nWriting comprehensive report to scratchpad...');
  let report = `# End-to-End Test Report & Error Scratchboard\n\n`;
  report += `**Execution Time:** ${new Date().toISOString()}\n`;
  report += `**Target:** ${BASE_URL}\n`;
  report += `**Browser:** Google Chrome (Headless) via Puppeteer\n\n`;

  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  report += `## Summary\n`;
  report += `- **Total Routes Tested:** ${total}\n`;
  report += `- **Passed (Clean Render, 0 Console/Network Errors):** ${passed}\n`;
  report += `- **Failed (Errors Encountered):** ${failed}\n\n`;

  report += `## Detailed Route Results\n\n`;
  report += `| Route | Name | Status | Status Code | Screenshot |\n`;
  report += `| :--- | :--- | :---: | :---: | :--- |\n`;

  for (const r of results) {
    const filename = r.screenshotPath ? path.basename(r.screenshotPath) : 'N/A';
    report += `| \`${r.route}\` | ${r.name} | **${r.status}** | ${r.statusCode || 'N/A'} | \`${filename}\` |\n`;
  }

  report += `\n## Error & Issue Log\n\n`;
  const failResults = results.filter((r) => r.status === 'FAIL');
  if (failResults.length === 0) {
    report += `> 🎉 **Zero errors encountered across all tested routes!** All pages rendered cleanly with status 200 and zero console exceptions.\n\n`;
  } else {
    for (const r of failResults) {
      report += `### ❌ [${r.name}] (\`${r.route}\`)\n`;
      if (r.screenshotPath) {
        report += `- **Screenshot:** \`${r.screenshotPath}\`\n`;
      }
      if (r.errors.length > 0) {
        report += `- **Errors:**\n${r.errors.map((e) => `  - \`${e}\``).join('\n')}\n`;
      }
      if (r.consoleErrors.length > 0) {
        report += `- **Console Errors:**\n${r.consoleErrors.map((e) => `  - \`${e}\``).join('\n')}\n`;
      }
      report += `\n`;
    }
  }

  report += `\n## Saved Screenshots\n\n`;
  for (const r of results) {
    if (r.screenshotPath) {
      report += `- **${r.name}** (\`${r.route}\`): \`${r.screenshotPath}\`\n`;
    }
  }

  fs.writeFileSync(SCRATCHPAD_FILE, report, 'utf-8');
  console.log('✅ Scratchpad successfully updated at:', SCRATCHPAD_FILE);
  console.log(`Completed testing: ${passed}/${total} passed.`);
}

main().catch((err) => {
  console.error('Fatal error running e2e test:', err);
  process.exit(1);
});
