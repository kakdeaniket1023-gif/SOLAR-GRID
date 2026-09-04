def generate_section_11():
    return """# 11. PRODUCTION-READINESS VERDICT & ACTIONABLE ROADMAP

This section consolidates the overall audit findings, ranks the top 10 P0 blockers that must be remediated before processing real funds, lists the top 10 nice-to-have optimizations, and concludes with a complete self-check file coverage matrix.

---

## 11.1 Consolidated Production-Readiness Scorecard

| Architectural Category | Status | Critical Findings | Recommended Fix | Priority |
| :--- | :---: | :--- | :--- | :---: |
| **Build & Compilation** | ❌ FAIL | `next build` fails because Client Components (`app/dashboard/page.tsx`) directly import `next/headers` via `lib/supabase/server.ts`. | Decouple client components from backend database services; route all data through API endpoints. | **P0** |
| **Test Runner & CI/CD** | ❌ FAIL | `npm test` crashes on startup with `[ERR_REQUIRE_ESM]` in Vitest/Vite configuration. | Fix Vitest configuration or migrate test runner to work with ESM. | **P0** |
| **Secrets & Keys** | ❌ FAIL | `SUPABASE_SERVICE_ROLE_KEY` is committed in plaintext in `.env`; Anon key is hardcoded in source files. | Rotate keys in Supabase immediately; remove hardcoded strings from code. | **P0** |
| **Authorization & RBAC** | ⚠️ HIGH RISK | Edge middleware (`lib/supabase/middleware.ts`) does not check `user.role === 'SUPER_ADMIN'` for `/admin/*` routes. | Check user role in middleware and reject non-admins with 403. | **P0** |
| **API Endpoint Security** | ❌ FAIL | `GET /api/mlm/stats` has no auth guard and fails to `await` the async service call. | Add `requireUser(request)` and `await` to `app/api/mlm/stats/route.ts`. | **P0** |
| **Financial Transactions** | ⚠️ HIGH RISK | Multi-step balance adjustments (recharge approvals, daily settlements) lack atomic DB transactions. | Implement PostgreSQL RPC stored procedures for balance debits/credits. | **P0** |
| **SSRF & Network Security** | ⚠️ HIGH RISK | `next.config.mjs` allows wildcard image proxying (`hostname: "**"`). | Restrict image remote patterns to trusted domains. | **P1** |
| **Missing Screens** | ⚠️ HIGH RISK | 15 routes (e.g., `/dashboard/invite`, `/dashboard/points`, `/dashboard/leadership`) are redirect stubs. | Implement dedicated screens for referral tree, points store, and leadership. | **P1** |
| **Type Safety** | ⚠️ HIGH RISK | `npx tsc --noEmit` fails on `lib/database/seed-data.ts`; extensive use of `any` in mapper functions. | Fix seed data type mismatches and replace `any` with strict PostgreSQL row types. | **P1** |
| **Rate Limiting Scalability** | ⚠️ WARNING | In-memory `Map` rate limiter does not share state across serverless/multi-instance environments. | Migrate rate limiter to Redis (e.g., Upstash). | **P2** |

---

## 11.2 Top 10 P0 Blockers (Must Fix Before Handling Real Money)

1. **Fix Next.js Build Crash (`P0`):** Resolve the `next/headers` import violation in client components so that `npm run build` compiles cleanly.
2. **Rotate Exposed Supabase Keys (`P0`):** Rotate the Supabase Service Role Key and Anon Key in the Supabase Dashboard immediately to prevent full database takeover.
3. **Enforce SuperAdmin Role Check in Edge Middleware (`P0`):** Update `lib/supabase/middleware.ts` to inspect the user's role before allowing access to `/admin` routes.
4. **Secure `GET /api/mlm/stats` (`P0`):** Add `requireUser()` authentication guard and fix the missing `await` bug in `app/api/mlm/stats/route.ts`.
5. **Fix Vitest Test Runner (`P0`):** Resolve the `[ERR_REQUIRE_ESM]` module loading failure so that all 32 unit, security, and E2E tests can run in automated pipelines.
6. **Implement Atomic Financial Transactions (`P0`):** Wrap wallet balance debits/credits, ledger insertions, and status updates in PostgreSQL transactions or Supabase RPCs to eliminate partial failure states.
7. **Eliminate Concurrency Race Conditions (`P0`):** Use row-level locking (`SELECT ... FOR UPDATE`) or atomic database balance constraints (`available_balance = available_balance - amount WHERE available_balance >= amount`) on wallet debits.
8. **Fix TypeScript Seed Data Errors (`P0`):** Update `lib/database/seed-data.ts` to supply all required `SolarUnit` properties so `npx tsc --noEmit` exits with code 0.
9. **Eliminate Wildcard Image Remote Patterns (`P0`):** Replace `hostname: "**"` in `next.config.mjs` with explicit trusted hostnames to mitigate SSRF vulnerabilities.
10. **Add HTTP Security Headers (`P0`):** Configure CSP, HSTS, X-Frame-Options, and X-Content-Type-Options in `next.config.mjs` to protect user sessions and prevent clickjacking.

---

## 11.3 Top 10 "Nice to Have" Improvements

1. **Automated Blockchain Payment Verification:** Integrate TRONGrid / Etherscan webhooks to automatically verify crypto deposit transaction hashes without manual admin approval.
2. **Implement Full Dedicated Screens for Redirect Stubs:** Build interactive visual UIs for `/dashboard/invite` (with live QR code and downline tree) and `/dashboard/leadership` (with rank milestone claim buttons).
3. **Migrate In-Memory Rate Limiter to Redis / Upstash:** Ensure sliding-window rate limits persist across serverless instances and cold starts.
4. **Server-Side Pagination on Admin Ledgers:** Add cursor or offset pagination to `GET /api/admin/ledger` and `GET /api/admin/users` to prevent memory exhaustion at scale.
5. **Real-Time WebSocket Updates:** Use Supabase Realtime subscriptions to push instant balance and notification updates without polling.
6. **Hardware Inverter IoT Simulator:** Add a real-time MQTT / WebSocket telemetry simulator for solar array wattages, temperatures, and cloud coverage.
7. **Multi-Language Support (i18n):** Implement Next.js internationalization for global contributor markets (Spanish, German, Japanese, Chinese).
8. **Automated End-to-End Playwright UI Tests:** Add browser automation tests covering login, deposit submission, daily generation, and withdrawal flows.
9. **Comprehensive Dark/Light Theme Customizer:** Provide high-contrast accessibility themes alongside Midnight Solar glass styling.
10. **CSV & PDF Tax Statement Generator:** Enable members to download certified annual clean energy generation yield statements for tax reporting.

---

## 11.4 Self-Check File Coverage Matrix

Below is the verification table confirming that every single file in the repository has been audited and covered in this report.

| File Path | Covered in Section(s) | Verification Status |
| :--- | :--- | :---: |
| `/.env` | Section 1.4, Section 7.5, Section 11.1 | ✅ Audited |
| `/.eslintrc.json` | Section 1.3, Section 9.3 | ✅ Audited |
| `/PRODUCTION_AUDIT.md` | Section 1.1, Section 10.1 | ✅ Audited |
| `/middleware.ts` | Section 1.3, Section 7.1, Section 11.1 | ✅ Audited |
| `/next-env.d.ts` | Section 1.1 | ✅ Audited |
| `/next.config.mjs` | Section 1.3, Section 7.4, Section 11.2 | ✅ Audited |
| `/package.json` | Section 1.2 | ✅ Audited |
| `/package-lock.json` | Section 1.1, Section 7.4 | ✅ Audited |
| `/postcss.config.mjs` | Section 1.3 | ✅ Audited |
| `/tailwind.config.ts` | Section 1.3 | ✅ Audited |
| `/tsconfig.json` | Section 1.3, Section 9.3 | ✅ Audited |
| `/tsconfig.tsbuildinfo` | Section 1.1 | ✅ Audited |
| `/vitest.config.ts` | Section 1.3, Section 9.2, Section 11.1 | ✅ Audited |
| `/types/index.ts` | Section 1.1, Section 5.1, Section 6.2 | ✅ Audited |
| `/database/schema.sql` | Section 6.1, Section 6.2, Section 6.3, Section 6.4 | ✅ Audited |
| `/database/migrations/` | Section 6.1 | ✅ Audited |
| `/scripts/inventory.js` | Section 1.1, Section 10.2 | ✅ Audited |
| `/scripts/seed-demo-users.ts` | Section 1.1, Section 7.5, Section 10.2 | ✅ Audited |
| `/public/images/panel-p1.jpg` | Section 1.1, Section 2.3 | ✅ Audited |
| `/public/images/panel-p2.jpg` | Section 1.1, Section 2.3 | ✅ Audited |
| `/public/images/panel-p3.jpg` | Section 1.1, Section 2.3 | ✅ Audited |
| `/public/images/solar-desert-park.png` | Section 1.1, Section 2.1 | ✅ Audited |
| `/public/images/solar-farm-hero.png` | Section 1.1, Section 2.1 | ✅ Audited |
| `/public/images/solar-floating.png` | Section 1.1, Section 2.1 | ✅ Audited |
| `/public/images/solar-rooftop.png` | Section 1.1, Section 2.1 | ✅ Audited |
| `/components/glass/glass-badge.tsx` | Section 3.1.1 | ✅ Audited |
| `/components/glass/glass-bottom-bar.tsx` | Section 3.1.2 | ✅ Audited |
| `/components/glass/glass-button.tsx` | Section 3.1.3 | ✅ Audited |
| `/components/glass/glass-card.tsx` | Section 3.1.4 | ✅ Audited |
| `/components/glass/glass-chart-container.tsx` | Section 3.1.5 | ✅ Audited |
| `/components/glass/glass-input.tsx` | Section 3.1.6 | ✅ Audited |
| `/components/glass/glass-navbar.tsx` | Section 3.1.7 | ✅ Audited |
| `/components/glass/glass-sheet.tsx` | Section 3.1.8 | ✅ Audited |
| `/components/glass/glass-table.tsx` | Section 3.1.9 | ✅ Audited |
| `/components/glass/glass-tabs.tsx` | Section 3.1.10 | ✅ Audited |
| `/components/glass/index.ts` | Section 3.1.11 | ✅ Audited |
| `/components/motion/lenis-provider.tsx` | Section 3.2.1 | ✅ Audited |
| `/components/ui/footer.tsx` | Section 3.3.2 | ✅ Audited |
| `/components/ui/navigation.tsx` | Section 3.3.1 | ✅ Audited |
| `/components/ui/role-switcher.tsx` | Section 3.3.3 | ✅ Audited |
| `/lib/auth/auth-context.tsx` | Section 5.7 | ✅ Audited |
| `/lib/auth/guards.ts` | Section 5.7, Section 7.3 | ✅ Audited |
| `/lib/auth/transaction-pin.ts` | Section 5.7, Section 7.2 | ✅ Audited |
| `/lib/database/db.ts` | Section 1.1, Section 5.8 | ✅ Audited |
| `/lib/database/seed-data.ts` | Section 5.8, Section 9.3, Section 11.2 | ✅ Audited |
| `/lib/leadership-engine/index.ts` | Section 5.4, Section 8.5 | ✅ Audited |
| `/lib/mlm-engine/index.ts` | Section 5.1, Section 8.2 | ✅ Audited |
| `/lib/points-engine/index.ts` | Section 5.3 | ✅ Audited |
| `/lib/security/rate-limiter.ts` | Section 5.6 | ✅ Audited |
| `/lib/solar-engine/index.ts` | Section 5.2, Section 8.3 | ✅ Audited |
| `/lib/solar-engine/upgrade.ts` | Section 5.2 | ✅ Audited |
| `/lib/supabase/admin.ts` | Section 1.1, Section 5.8 | ✅ Audited |
| `/lib/supabase/client.ts` | Section 1.1, Section 5.8 | ✅ Audited |
| `/lib/supabase/db.ts` | Section 5.8, Section 11.1 | ✅ Audited |
| `/lib/supabase/middleware.ts` | Section 1.3, Section 7.1, Section 11.2 | ✅ Audited |
| `/lib/supabase/server.ts` | Section 1.1, Section 5.8, Section 11.1 | ✅ Audited |
| `/lib/withdrawal-engine/index.ts` | Section 5.5, Section 8.3 | ✅ Audited |
| `/tests/auth-guards.test.ts` | Section 9.1 | ✅ Audited |
| `/tests/business-logic.test.ts` | Section 9.1 | ✅ Audited |
| `/tests/e2e-api-and-workflows.test.ts` | Section 9.1 | ✅ Audited |
| `/tests/security-auth.test.ts` | Section 9.1 | ✅ Audited |
| `/app/layout.tsx` | Section 1.1, Section 2.1 | ✅ Audited |
| `/app/globals.css` | Section 1.3, Section 3.1 | ✅ Audited |
| `/app/page.tsx` | Section 2.1.1 | ✅ Audited |
| `/app/about/page.tsx` | Section 2.1.2 | ✅ Audited |
| `/app/plans/page.tsx` | Section 2.1.3 | ✅ Audited |
| `/app/projects/page.tsx` | Section 2.1.4 | ✅ Audited |
| `/app/how-it-works/page.tsx` | Section 2.1.5 | ✅ Audited |
| `/app/rules/page.tsx` | Section 2.1.6 | ✅ Audited |
| `/app/contact/page.tsx` | Section 2.1.7 | ✅ Audited |
| `/app/faq/page.tsx` | Section 2.1.8 | ✅ Audited |
| `/app/privacy/page.tsx` | Section 2.1.9 | ✅ Audited |
| `/app/terms/page.tsx` | Section 2.1.9 | ✅ Audited |
| `/app/login/page.tsx` | Section 2.2.1 | ✅ Audited |
| `/app/signup/page.tsx` | Section 2.2.2, Section 8.1 | ✅ Audited |
| `/app/forgot-password/page.tsx` | Section 2.2.3 | ✅ Audited |
| `/app/community/page.tsx` | Section 2.1.10 | ✅ Audited |
| `/app/leadership/page.tsx` | Section 2.1.10 | ✅ Audited |
| `/app/rewards/page.tsx` | Section 2.1.10 | ✅ Audited |
| `/app/dashboard/layout.tsx` | Section 2.3 | ✅ Audited |
| `/app/dashboard/page.tsx` | Section 2.3.1 | ✅ Audited |
| `/app/dashboard/panels/page.tsx` | Section 2.3.2 | ✅ Audited |
| `/app/dashboard/panels/[id]/page.tsx` | Section 2.3.3 | ✅ Audited |
| `/app/dashboard/panel-operation/page.tsx` | Section 2.3.4 | ✅ Audited |
| `/app/dashboard/plans/page.tsx` | Section 2.3.5, Section 8.1 | ✅ Audited |
| `/app/dashboard/units/page.tsx` | Section 2.3.6 | ✅ Audited |
| `/app/dashboard/earnings/page.tsx` | Section 2.3.7 | ✅ Audited |
| `/app/dashboard/recharge/page.tsx` | Section 2.3.8, Section 8.3 | ✅ Audited |
| `/app/dashboard/withdrawal/page.tsx` | Section 2.3.9, Section 8.3 | ✅ Audited |
| `/app/dashboard/withdrawals/page.tsx` | Section 2.3.9 | ✅ Audited |
| `/app/dashboard/records/page.tsx` | Section 2.3.10 | ✅ Audited |
| `/app/dashboard/records/purchases/page.tsx` | Section 2.3.11 | ✅ Audited |
| `/app/dashboard/records/recharge/page.tsx` | Section 2.3.11 | ✅ Audited |
| `/app/dashboard/records/withdrawals/page.tsx` | Section 2.3.11 | ✅ Audited |
| `/app/dashboard/notifications/page.tsx` | Section 2.3.12 | ✅ Audited |
| `/app/dashboard/profile/page.tsx` | Section 2.3.13 | ✅ Audited |
| `/app/dashboard/profile/wallet/page.tsx` | Section 2.3.14 | ✅ Audited |
| `/app/dashboard/support/page.tsx` | Section 2.3.15 | ✅ Audited |
| `/app/dashboard/invite/page.tsx` | Section 2.3.16 | ✅ Audited |
| `/app/dashboard/network/page.tsx` | Section 2.3.16 | ✅ Audited |
| `/app/dashboard/team/page.tsx` | Section 2.3.16 | ✅ Audited |
| `/app/dashboard/referrals/page.tsx` | Section 2.3.16 | ✅ Audited |
| `/app/dashboard/points/page.tsx` | Section 2.3.16 | ✅ Audited |
| `/app/dashboard/rewards/page.tsx` | Section 2.3.16 | ✅ Audited |
| `/app/dashboard/leadership/page.tsx` | Section 2.3.16 | ✅ Audited |
| `/app/admin/layout.tsx` | Section 2.4 | ✅ Audited |
| `/app/admin/page.tsx` | Section 2.4.1 | ✅ Audited |
| `/app/admin/analytics/page.tsx` | Section 2.4.2 | ✅ Audited |
| `/app/admin/users/page.tsx` | Section 2.4.3 | ✅ Audited |
| `/app/admin/users/[id]/page.tsx` | Section 2.4.4 | ✅ Audited |
| `/app/admin/plans/page.tsx` | Section 2.4.5 | ✅ Audited |
| `/app/admin/units/page.tsx` | Section 2.4.6 | ✅ Audited |
| `/app/admin/panel-images/page.tsx` | Section 2.4.7 | ✅ Audited |
| `/app/admin/recharges/page.tsx` | Section 2.4.8 | ✅ Audited |
| `/app/admin/withdrawals/page.tsx` | Section 2.4.9 | ✅ Audited |
| `/app/admin/ledger/page.tsx` | Section 2.4.10 | ✅ Audited |
| `/app/admin/security/sessions/page.tsx` | Section 2.4.11 | ✅ Audited |
| `/app/admin/broadcasts/page.tsx` | Section 2.4.12 | ✅ Audited |
| `/app/admin/support/page.tsx` | Section 2.4.13 | ✅ Audited |
| `/app/admin/audit/page.tsx` | Section 2.4.14 | ✅ Audited |
| `/app/admin/settings/page.tsx` | Section 2.4.15 | ✅ Audited |
| `/app/admin/leadership/page.tsx` | Section 2.4.16 | ✅ Audited |
| `/app/admin/mlm/page.tsx` | Section 2.4.16 | ✅ Audited |
| `/app/admin/network/page.tsx` | Section 2.4.16 | ✅ Audited |
| `/app/admin/points/page.tsx` | Section 2.4.16 | ✅ Audited |
| `/app/admin/rewards/page.tsx` | Section 2.4.16 | ✅ Audited |
| `/app/api/admin/broadcast/route.ts` | Section 4.1.1 | ✅ Audited |
| `/app/api/admin/ledger/route.ts` | Section 4.1.2 | ✅ Audited |
| `/app/api/admin/panel-images/route.ts` | Section 4.1.3 | ✅ Audited |
| `/app/api/admin/recharges/route.ts` | Section 4.1.4 | ✅ Audited |
| `/app/api/admin/rules/route.ts` | Section 4.1.5 | ✅ Audited |
| `/app/api/admin/search/route.ts` | Section 4.1.6 | ✅ Audited |
| `/app/api/admin/stats/route.ts` | Section 4.1.7 | ✅ Audited |
| `/app/api/admin/units/route.ts` | Section 4.1.8 | ✅ Audited |
| `/app/api/admin/users/route.ts` | Section 4.1.9 | ✅ Audited |
| `/app/api/admin/withdrawals/route.ts` | Section 4.1.10 | ✅ Audited |
| `/app/api/auth/login/route.ts` | Section 4.2.1 | ✅ Audited |
| `/app/api/auth/logout/route.ts` | Section 4.2.2 | ✅ Audited |
| `/app/api/auth/me/route.ts` | Section 4.2.3 | ✅ Audited |
| `/app/api/auth/password/route.ts` | Section 4.2.4 | ✅ Audited |
| `/app/api/auth/sessions/route.ts` | Section 4.2.5 | ✅ Audited |
| `/app/api/auth/signup/route.ts` | Section 4.2.6 | ✅ Audited |
| `/app/api/auth/transaction-password/route.ts` | Section 4.2.7 | ✅ Audited |
| `/app/api/dashboard/overview/route.ts` | Section 4.3.1 | ✅ Audited |
| `/app/api/leadership/progress/route.ts` | Section 4.3.2 | ✅ Audited |
| `/app/api/leadership/promote/route.ts` | Section 4.3.3 | ✅ Audited |
| `/app/api/mlm/stats/route.ts` | Section 4.4.1, Section 7.3, Section 11.2 | ✅ Audited |
| `/app/api/mlm/tree/route.ts` | Section 4.4.2 | ✅ Audited |
| `/app/api/points/adjust/route.ts` | Section 4.4.3 | ✅ Audited |
| `/app/api/points/redeem/route.ts` | Section 4.4.4 | ✅ Audited |
| `/app/api/recharge/list/route.ts` | Section 4.5.1 | ✅ Audited |
| `/app/api/recharge/submit/route.ts` | Section 4.5.2 | ✅ Audited |
| `/app/api/solar/operate/route.ts` | Section 4.5.3 | ✅ Audited |
| `/app/api/solar/plans/route.ts` | Section 4.5.4 | ✅ Audited |
| `/app/api/solar/purchase/route.ts` | Section 4.5.5 | ✅ Audited |
| `/app/api/solar/upgrade/route.ts` | Section 4.5.6 | ✅ Audited |
| `/app/api/support/tickets/route.ts` | Section 4.6.1 | ✅ Audited |
| `/app/api/withdrawals/process/route.ts` | Section 4.6.2 | ✅ Audited |
| `/app/api/withdrawals/request/route.ts` | Section 4.6.3 | ✅ Audited |

"""
