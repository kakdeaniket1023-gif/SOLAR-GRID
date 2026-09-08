/**
 * SolarGrid End-to-End Live Application Verification Suite
 * Tests against the live running Next.js application on http://localhost:3000
 */

interface TestResult {
  category: string;
  name: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  details?: string;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const results: TestResult[] = [];

// Cookie jar simulation for persistent sessions
class SessionClient {
  private cookies: Map<string, string> = new Map();

  parseCookies(headers: Headers) {
    const setCookieHeaders = headers.getSetCookie ? headers.getSetCookie() : [];
    if (setCookieHeaders.length === 0) {
      const single = headers.get('set-cookie');
      if (single) setCookieHeaders.push(single);
    }
    for (const cookieStr of setCookieHeaders) {
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        const isExpired =
          cookieStr.toLowerCase().includes('max-age=0') ||
          cookieStr.toLowerCase().includes('1970') ||
          value === '';
        if (isExpired) {
          this.cookies.delete(name);
        } else {
          this.cookies.set(name, value);
        }
      }
    }
  }

  clearCookies() {
    this.cookies.clear();
  }

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async request(path: string, options: RequestInit = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const headers = new Headers(options.headers || {});
    
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader && !headers.has('Cookie')) {
      headers.set('Cookie', cookieHeader);
    }
    if (!headers.has('X-Forwarded-For')) {
      headers.set('X-Forwarded-For', `192.168.10.${Math.floor(Math.random() * 200) + 1}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    this.parseCookies(response.headers);
    return response;
  }
}

async function runTest(category: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ category, name, status: 'PASSED', durationMs });
    console.log(`  ✓ [${category}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ category, name, status: 'FAILED', durationMs, details: err.message || String(err) });
    console.error(`  ✗ [${category}] ${name} (${durationMs}ms): ${err.message || String(err)}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log(`🚀 SolarGrid Live End-to-End Suite against ${BASE_URL}`);
  console.log('================================================================\n');

  const anonClient = new SessionClient();
  const userClient = new SessionClient();
  const adminClient = new SessionClient();

  // ============================================================================
  // 1. PUBLIC ENDPOINTS & LANDING PAGES
  // ============================================================================
  console.log('--- 1. Public Endpoints & Catalog ---');

  await runTest('Public', 'GET / returns 200 with HTML landing page', async () => {
    const res = await anonClient.request('/');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes('SolarGrid') || text.includes('solar'), 'Landing page content missing');
  });

  await runTest('Public', 'GET /login returns 200 with login interface', async () => {
    const res = await anonClient.request('/login');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.length > 500, 'Login page content truncated');
  });

  await runTest('Public', 'GET /api/solar/plans returns public plans and schedule', async () => {
    const res = await anonClient.request('/api/solar/plans');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response success is not true');
    assert(Array.isArray(data.plans) && data.plans.length >= 3, `Expected at least 3 plans, got ${data.plans?.length}`);
    assert(data.schedule !== undefined, 'Schedule object missing');
    const p1 = data.plans.find((p: any) => p.code === 'P1');
    assert(p1 && p1.priceUsdt > 0, 'Plan P1 missing or invalid');
  });

  await runTest('Public', 'GET /api/solar/operate returns public operating window schedule', async () => {
    const res = await anonClient.request('/api/solar/operate');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response success is not true');
    assert(data.schedule?.startTime !== undefined, 'Start time missing');
    assert(data.schedule?.endTime !== undefined, 'End time missing');
  });

  // ============================================================================
  // 2. SECURITY & AUTH GUARDS (UNAUTHENTICATED)
  // ============================================================================
  console.log('\n--- 2. Unauthenticated Security Boundary Checks ---');

  await runTest('Security', 'POST /api/auth/login rejects missing credentials with 400', async () => {
    const res = await anonClient.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@solargrid.io' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest('Security', 'POST /api/auth/login rejects invalid password with 401', async () => {
    const res = await anonClient.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.jenkins@solargrid.io', password: 'WrongPassword999!' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await runTest('Security', 'GET /api/auth/me rejects unauthenticated request with 401', async () => {
    anonClient.clearCookies();
    const res = await anonClient.request('/api/auth/me');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await runTest('Security', 'GET /api/dashboard/overview rejects unauthenticated request with 401', async () => {
    const res = await anonClient.request('/api/dashboard/overview');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await runTest('Security', 'GET /api/admin/stats rejects unauthenticated request with 401', async () => {
    const res = await anonClient.request('/api/admin/stats');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await runTest('Security', 'GET /api/admin/users rejects unauthenticated request with 401', async () => {
    const res = await anonClient.request('/api/admin/users');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // ============================================================================
  // 3. USER WORKFLOW (Sarah Jenkins - Member Portal)
  // ============================================================================
  console.log('\n--- 3. User Portal Workflow (Sarah Jenkins) ---');

  let sarahUserId = '';
  await runTest('User Flow', 'Authenticate Sarah Jenkins and receive session cookies', async () => {
    const res = await userClient.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.jenkins@solargrid.io',
        password: 'password123',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Login success is not true');
    assert(data.user.role === 'USER', `Expected role USER, got ${data.user.role}`);
    sarahUserId = data.user.id;
    assert(sarahUserId.length > 0, 'User ID is empty');
  });

  await runTest('User Flow', 'GET /api/auth/me returns authenticated Sarah user profile', async () => {
    const res = await userClient.request('/api/auth/me');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response success is not true');
    assert(data.user.email === 'sarah.jenkins@solargrid.io', `Unexpected email: ${data.user.email}`);
    assert(data.user.role === 'USER', `Unexpected role: ${data.user.role}`);
  });

  await runTest('User Flow', 'GET /api/dashboard/overview returns portfolio metrics', async () => {
    const res = await userClient.request('/api/dashboard/overview');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response success is not true');
    assert(data.user !== undefined, 'User object missing in overview');
    assert(Array.isArray(data.units), 'Units array missing in overview');
  });

  await runTest('User Flow', 'GET /dashboard user pages render successfully with session', async () => {
    const pages = [
      '/dashboard',
      '/dashboard/panels',
      '/dashboard/panel-operation',
      '/dashboard/recharge',
      '/dashboard/withdrawals',
      '/dashboard/invite',
      '/dashboard/rewards',
      '/dashboard/records',
      '/dashboard/profile',
    ];

    for (const page of pages) {
      const res = await userClient.request(page);
      assert(res.status === 200, `Page ${page} failed with status ${res.status}`);
    }
  });

  let submittedRechargeId = '';
  await runTest('User Flow', 'POST /api/recharge/submit queues a recharge with tx proof', async () => {
    const res = await userClient.request('/api/recharge/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 75.0,
        txReference: 'TXH_E2E_TEST_' + Date.now(),
        network: 'USDT-TRC20',
        destinationAddress: 'TY5a718392019284719284719284719283',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Recharge submit failed');
    submittedRechargeId = data.record?.id || data.recharge?.id || data.id || '';
  });

  await runTest('User Flow', 'GET /api/recharge/list displays user recharge request history', async () => {
    const res = await userClient.request('/api/recharge/list');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Recharge list failed');
    assert(Array.isArray(data.recharges), 'Recharges is not an array');
  });

  await runTest('User Flow', 'POST /api/withdrawals/request validates minimum amount & balance', async () => {
    // Attempt withdrawal under 10 USDT minimum
    const resLow = await userClient.request('/api/withdrawals/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 5.0,
        walletAddress: 'TY5a718392019284719284719284719283',
      }),
    });
    assert(resLow.status === 400 || resLow.status === 422 || resLow.status === 429, `Expected 400/422/429 on < 10 USDT, got ${resLow.status}`);

    // Attempt withdrawal exceeding available balance
    const resHigh = await userClient.request('/api/withdrawals/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 999999.0,
        walletAddress: 'TY5a718392019284719284719284719283',
      }),
    });
    assert(resHigh.status === 400 || resHigh.status === 422 || resHigh.status === 429, `Expected 400/422/429 on excessive amount, got ${resHigh.status}`);
  });

  await runTest('User Flow', 'GET /api/mlm/tree and /api/mlm/stats return network data', async () => {
    const [treeRes, statsRes] = await Promise.all([
      userClient.request('/api/mlm/tree'),
      userClient.request('/api/mlm/stats'),
    ]);
    assert(treeRes.status === 200, `MLM tree failed with ${treeRes.status}`);
    assert(statsRes.status === 200, `MLM stats failed with ${statsRes.status}`);
    const treeData = await treeRes.json();
    const statsData = await statsRes.json();
    assert(treeData.success === true, 'Tree success is not true');
    assert(statsData.success === true, 'Stats success is not true');
  });

  await runTest('User Flow', 'GET /api/leadership/progress returns rank progression', async () => {
    const res = await userClient.request('/api/leadership/progress');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Leadership progress failed');
    assert(data.progress?.currentLevel !== undefined || data.currentLevel !== undefined, 'Current level missing');
  });

  await runTest('User Flow', 'POST and GET /api/support/tickets creates and retrieves tickets', async () => {
    const createRes = await userClient.request('/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Live E2E Verification Ticket ' + Date.now(),
        category: 'TECHNICAL',
        priority: 'NORMAL',
        message: 'This is an automated E2E test verifying customer support ticketing.',
      }),
    });
    assert(createRes.status === 200, `Create ticket failed with ${createRes.status}`);

    const listRes = await userClient.request('/api/support/tickets');
    assert(listRes.status === 200, `List tickets failed with ${listRes.status}`);
    const listData = await listRes.json();
    assert(listData.success === true, 'Ticket list success is not true');
    assert(Array.isArray(listData.tickets) && listData.tickets.length > 0, 'No tickets found');
  });

  // ============================================================================
  // 4. RBAC ISOLATION (USER ROLE DENIED ACCESS TO ADMIN APIS)
  // ============================================================================
  console.log('\n--- 4. Role-Based Access Control (RBAC) Hardening ---');

  await runTest('RBAC Guard', 'Sarah (USER role) is strictly forbidden from /api/admin/stats (403)', async () => {
    const res = await userClient.request('/api/admin/stats');
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest('RBAC Guard', 'Sarah (USER role) is strictly forbidden from /api/admin/users (403)', async () => {
    const res = await userClient.request('/api/admin/users');
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest('RBAC Guard', 'Sarah (USER role) is strictly forbidden from /api/admin/recharges (403)', async () => {
    const res = await userClient.request('/api/admin/recharges');
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest('RBAC Guard', 'Sarah (USER role) is strictly forbidden from /api/admin/rules (403)', async () => {
    const res = await userClient.request('/api/admin/rules');
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // ============================================================================
  // 5. SUPER ADMIN WORKFLOW (Marcus Vance - Admin Portal)
  // ============================================================================
  console.log('\n--- 5. Super Administrator Portal Workflow (Marcus Vance) ---');

  await runTest('Admin Flow', 'Authenticate Marcus Vance as SUPER_ADMIN', async () => {
    const res = await adminClient.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marcus.vance@solargrid.io',
        password: 'adminPass123',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Admin login failed');
    assert(data.user.role === 'SUPER_ADMIN', `Expected role SUPER_ADMIN, got ${data.user.role}`);
  });

  await runTest('Admin Flow', 'GET /api/admin/stats returns platform telemetry & health', async () => {
    const res = await adminClient.request('/api/admin/stats');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Admin stats failed');
    assert(data.stats !== undefined, 'Platform telemetry missing');
  });

  await runTest('Admin Flow', 'GET /api/admin/users returns user roster with roles', async () => {
    const res = await adminClient.request('/api/admin/users');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Admin users query failed');
    assert(Array.isArray(data.users) && data.users.length >= 2, 'User roster missing demo users');
  });

  await runTest('Admin Flow', 'GET /api/admin/recharges lists pending recharge requests', async () => {
    const res = await adminClient.request('/api/admin/recharges');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Admin recharges query failed');
    assert(Array.isArray(data.recharges), 'Recharges array missing');
  });

  await runTest('Admin Flow', 'GET /api/admin/rules returns editable system business rules', async () => {
    const res = await adminClient.request('/api/admin/rules');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Admin rules query failed');
    assert(Array.isArray(data.rules) && data.rules.length > 0, 'Business rules missing');
  });

  await runTest('Admin Flow', 'GET /api/admin/panel-images returns configured assets', async () => {
    const res = await adminClient.request('/api/admin/panel-images');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Admin panel images query failed');
  });

  await runTest('Admin Flow', 'GET /api/admin/search searches across platform entities', async () => {
    const res = await adminClient.request('/api/admin/search?q=sarah');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Admin search failed');
  });

  await runTest('Admin Flow', 'GET /admin pages render successfully for SUPER_ADMIN', async () => {
    const adminPages = [
      '/admin',
      '/admin/users',
      '/admin/recharges',
      '/admin/withdrawals',
      '/admin/ledger',
      '/admin/security/sessions',
      '/admin/settings',
      '/admin/panel-images',
    ];

    for (const page of adminPages) {
      const res = await adminClient.request(page);
      assert(res.status === 200, `Admin page ${page} failed with status ${res.status}`);
    }
  });

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log('📊 E2E SUITE EXECUTION SUMMARY');
  console.log('================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const totalDurationMs = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log(`Total Time:      ${(totalDurationMs / 1000).toFixed(2)}s`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => r.status === 'FAILED')
      .forEach((r) => console.log(`  - [${r.category}] ${r.name}: ${r.details}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL LIVE END-TO-END TESTS PASSED CLEANLY!');
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
