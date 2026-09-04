import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as signupRoute } from '@/app/api/auth/signup/route';
import { POST as loginRoute } from '@/app/api/auth/login/route';
import { GET as meRoute } from '@/app/api/auth/me/route';
import { POST as passwordRoute } from '@/app/api/auth/password/route';
import { POST as txPasswordRoute } from '@/app/api/auth/transaction-password/route';
import { GET as sessionsRoute } from '@/app/api/auth/sessions/route';
import { GET as plansRoute } from '@/app/api/solar/plans/route';
import { POST as purchaseRoute } from '@/app/api/solar/purchase/route';
import { GET as operateGetRoute, POST as operatePostRoute } from '@/app/api/solar/operate/route';
import { POST as upgradeRoute } from '@/app/api/solar/upgrade/route';
import { POST as rechargeSubmitRoute } from '@/app/api/recharge/submit/route';
import { GET as rechargeListRoute } from '@/app/api/recharge/list/route';
import { GET as adminRechargesGetRoute } from '@/app/api/admin/recharges/route';
import { POST as withdrawalRequestRoute } from '@/app/api/withdrawals/request/route';
import { POST as withdrawalProcessRoute } from '@/app/api/withdrawals/process/route';
import { GET as mlmTreeRoute } from '@/app/api/mlm/tree/route';
import { GET as mlmStatsRoute } from '@/app/api/mlm/stats/route';
import { GET as leadershipProgressRoute } from '@/app/api/leadership/progress/route';
import { POST as pointsAdjustRoute } from '@/app/api/points/adjust/route';
import { GET as adminStatsRoute } from '@/app/api/admin/stats/route';
import { GET as adminUsersGetRoute } from '@/app/api/admin/users/route';
import { GET as adminRulesGetRoute } from '@/app/api/admin/rules/route';
import { GET as adminPanelImagesGetRoute } from '@/app/api/admin/panel-images/route';
import { GET as adminSearchRoute } from '@/app/api/admin/search/route';
import { GET as dashboardOverviewRoute } from '@/app/api/dashboard/overview/route';
import { GET as supportTicketsGetRoute, POST as supportTicketsPostRoute } from '@/app/api/support/tickets/route';

describe('SolarGrid API Endpoint Security & Validation Test Suite', () => {
  // ==========================================
  // AUTHENTICATION & VALIDATION
  // ==========================================
  describe('Authentication & Session Endpoints', () => {
    it('rejects signup with missing email or password', async () => {
      const signupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User' }),
      });

      const res = await signupRoute(signupReq);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('rejects login with missing password', async () => {
      const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sarah.jenkins@solargrid.io' }),
      });

      const res = await loginRoute(loginReq);
      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated /api/auth/me requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/me');
      const res = await meRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated /api/auth/password requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'NewPassword123!' }),
      });
      const res = await passwordRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated /api/auth/transaction-password requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/transaction-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', transactionPassword: '123456' }),
      });
      const res = await txPasswordRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated /api/auth/sessions requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/sessions');
      const res = await sessionsRoute(req);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // SOLAR ENDPOINTS
  // ==========================================
  describe('Solar Plans & Operations Endpoints', () => {
    it('returns all solar plans publicly without requiring authentication', async () => {
      const res = await plansRoute();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.plans)).toBe(true);
      expect(data.schedule).toBeDefined();
    });

    it('returns live solar operation schedule publicly', async () => {
      const res = await operateGetRoute();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.schedule).toBeDefined();
    });

    it('rejects unauthenticated solar purchase with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/solar/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode: 'P1' }),
      });
      const res = await purchaseRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated solar operation with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/solar/operate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: 'unit-1', action: 'START' }),
      });
      const res = await operatePostRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated solar upgrade with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/solar/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: 'unit-1', targetPlanCode: 'P2' }),
      });
      const res = await upgradeRoute(req);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // RECHARGES & WITHDRAWALS
  // ==========================================
  describe('Recharge & Withdrawal Endpoints Security', () => {
    it('rejects unauthenticated recharge submit with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/recharge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100 }),
      });
      const res = await rechargeSubmitRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated recharge list with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/recharge/list');
      const res = await rechargeListRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated withdrawal request with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50, walletAddress: 'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v' }),
      });
      const res = await withdrawalRequestRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated withdrawal processing with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/withdrawals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: 'wdr-1', action: 'APPROVE' }),
      });
      const res = await withdrawalProcessRoute(req);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // MLM & DASHBOARD & SUPPORT
  // ==========================================
  describe('MLM, Leadership, Dashboard, Support Security', () => {
    it('rejects unauthenticated MLM tree query with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/mlm/tree');
      const res = await mlmTreeRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated MLM stats query with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/mlm/stats');
      const res = await mlmStatsRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated leadership progress query with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/leadership/progress');
      const res = await leadershipProgressRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated points adjustment with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/points/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: 'u-1', pointsChange: 5 }),
      });
      const res = await pointsAdjustRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated dashboard overview query with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/dashboard/overview');
      const res = await dashboardOverviewRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated support ticket create with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Need help' }),
      });
      const res = await supportTicketsPostRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated support ticket list with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/support/tickets');
      const res = await supportTicketsGetRoute(req);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // ADMIN PORTAL GUARDS
  // ==========================================
  describe('Super Admin Guards on Admin Endpoints', () => {
    it('rejects anonymous access to /api/admin/stats with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/stats');
      const res = await adminStatsRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects anonymous access to /api/admin/users with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/users');
      const res = await adminUsersGetRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects anonymous access to /api/admin/recharges with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/recharges');
      const res = await adminRechargesGetRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects anonymous access to /api/admin/rules with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/rules');
      const res = await adminRulesGetRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects anonymous access to /api/admin/panel-images with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/panel-images');
      const res = await adminPanelImagesGetRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejects anonymous access to /api/admin/search with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/search?q=test');
      const res = await adminSearchRoute(req);
      expect(res.status).toBe(401);
    });
  });
});
