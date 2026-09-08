# SolarGrid — Full Software Audit Report (CURRENT CODEBASE)

**Date:** 2026-09-08 (current working tree at HEAD `49f3dca`)
**Repo:** `/Users/aniketsanjaykakde/Downloads/app` — github.com/kakdeaniket1023-gif/SOLAR-GRID (branch `main`)
**Stack (verified):** Next.js 14.2.35 (App Router) · React 18 · Express 4.22.2 · TypeScript 5.7 (both repos `strict: false`) · Neon PostgreSQL 18 (`@neondatabase/serverless`) · jose (JWT HS256) · bcryptjs · zod · Tailwind 3.4 · recharts
**Backend deploy:** Render via `backend/Dockerfile` (node:22-alpine, `NODE_ENV=production`, PORT 5000). **Frontend:** Cloudflare Pages.
**Live DB verified read-only:** Neon project `muddy-fog-76600525` / branch `production`.

> ⚠️ Repo contains TWO OLDER audit reports (`AUDIT_REPORT.md`, `AUDIT_REPORT_FULL_2026-09-08.md`) written against a **previous architecture** (Next.js `app/api/*`, `solargrid_auth_user_id` cookie fallback). This tree is a **rewrite** (Express + Neon SQL). This report audits the **current** code. Verified: the old cookie fallback is GONE from current code.

---

## EXECUTIVE VERDICT

**🔴 NOT SAFE FOR PRODUCTION / NOT SAFE TO RUN LIVE MONEY ON.**

The app is an MLM platform: "solar panel plans" paying fixed daily USDT yields + 2-level referral commissions, manual USDT deposits/withdrawals, KYC, points/ranks. It is technically incomplete, actively exploitable, and compliance-critical:

1. **JWT signing secret is public** (committed `.env.example` + hardcoded fallbacks in both apps) → anyone can **forge a SUPER_ADMIN token** and take over.
2. **Hardcoded SUPER_ADMIN backdoor live in the production DB**: `admin@gmail.com` / `password-admin123@` / TX PIN `8888`, **$5,000 USDT balance** — verified read-only.
3. **CSRF fully exploitable** (sameSite=None + wildcard CORS + no CSRF token + PIN `SET` needs no current PIN) → cross-site **fund-theft chain**.
4. **Every DB op silently falls back to in-memory Maps on error** (75+ empty `catch {}`) → phantom money, lost on restart, diverges per instance.
5. **Live schema missing 8 tables + 2 SQL functions** (`products`, `order_items`, `kyc_submissions`, `payout_methods`, `fraud_signals`, `rewards`, `reward_redemptions`, `leadership_levels`, `debit/credit_user_balance`). Features run on volatile seed data.
6. **Money-printing in solar engine**: `SETTLE` pays full daily yield without starting the 3h cycle; kWh = `Math.random()`.
7. **Admin Withdrawal Queue 404-broken** — UI calls `GET/POST /api/admin/withdrawals` (doesn't exist).
8. **Password reset fake** (`setTimeout`, no endpoint). **Rewards redemption UI fake** (`setTimeout`, no API); real endpoint **racy** (voucher mint).
9. **Live DB publicly reachable** with the repo's `neondb_owner` password.
10. **Severe legal exposure**: fixed daily ROI + recruitment commissions while UI claims "no guaranteed daily returns".

**Counts: 11 P0 · 18 P1 · 24 P2 · ~20 P3.**

**Key:** P0 = exploitable now / money at risk · P1 = serious, fix before launch · P2 = significant defect · P3 = hygiene.

---

## METHOD
- Inventoried all 230 non-build files (~36k LOC).
- Read **every** backend route (18 routers, 63 endpoints), every engine, auth/security modules, query builder, DB service, schema/migrations, seed data, middleware/config/layout, contexts, all pages.
- Ran **read-only queries against the live Neon production DB** (information_schema, pg_proc, users, counts).
- Ran `npm audit` on both packages; cross-referenced every frontend `fetch()` against the backend route table.

---

## P0 — CRITICAL (exploitable now / money at risk)

### P0-1 · JWT signing secret is public → forge any token incl. SUPER_ADMIN
- `backend/src/auth/jwt.ts:4-8` fallback `'solargrid-neon-jwt-crypto-secret-key-2026-secure-production'`.
- `frontend/lib/jwt.ts:4` identical fallback. `frontend/.env.example` (git-tracked) sets the same `JWT_SECRET`.
- **Impact:** any deployment without an overridden secret accepts attacker-signed HS256 JWTs (`{role:'SUPER_ADMIN'}`). Also **dev split-brain**: backend `.env` uses a different 96-hex secret → frontend middleware rejects backend-signed tokens → `/dashboard` & `/admin` redirect-loop.
- **Fix:** one random ≥32-byte secret per env, injected via env only; rotate now; remove fallbacks.

### P0-2 · Hardcoded SUPER_ADMIN backdoor live in production DB
- `backend/scripts/migrate-neon.ts:410-412` → `bcrypt.hash('password-admin123@')`, TX PIN `'8888'`; `:419-437` upserts `admin@gmail.com` as SUPER_ADMIN.
- **Live verification (read-only):** → `admin@gmail.com | SUPER_ADMIN | ACTIVE | 5000.0000`.
- `frontend/app/login/page.tsx:27` special-cases `admin@gmail.com` / `marcus.vance@solargrid.io`.
- **Fix:** remove seeded admin upsert or gate behind env flag + random password; rotate now; audit sessions/logs.

### P0-3 · CSRF → cross-site fund theft (no CSRF protection, SameSite=None, wildcard CORS)
- `backend/src/server.ts:38-57` — CORS allows ANY origin with `credentials: true`.
- `backend/src/auth/jwt.ts:70-83` — cookie `SameSite: isProd ? 'none' : 'lax'`. No CSRF token / Origin check anywhere.
- **Chain:** ① CSRF `POST /api/auth/transaction-password` `{action:'SET', newTransactionPassword:'1234'}` (SET needs no current PIN — `auth.routes.ts:540-546`) → ② CSRF `PATCH /api/auth/me` `{walletAddress: attacker, transactionPin:'1234'}` (`auth.routes.ts:288-323`) → ③ CSRF `POST /api/withdrawals/request`.
- Also any page can drive admin state-changes while an admin is logged in.
- **Fix:** `SameSite=Lax/Strict` + Origin-validating CSRF middleware + CORS restricted to real origins.

### P0-4 · Production DB credential in working tree; DB publicly reachable
- `backend/.env`: `DATABASE_URL=postgresql://neondb_owner:npg_rVE8MpC5FjnP@…neon.tech/neondb` (owner role, r/w).
- Neon (verified): `block_public_connections=false`, `allowed_ips=[]` → public internet can connect with the owner password.
- **Fix:** rotate owner password now; least-privilege app role; IP allow-list; exclude `.env` from images/backups.

### P0-5 · Systemic silent in-memory fallback → phantom money, no errors emitted
- `backend/src/db/index.ts` — nearly every method wraps DB access in `try { … } catch {}` and on ANY error returns/updates an in-memory `fallback*` Map (`getUserById` 1237, `atomicDebitBalance` 1488-1558, `atomicCreditBalance` 1588-1643, `updateUser` 1422-1449, `createOrder` 3521+, `createRecharge` 2099+, `createWithdrawal` 2294+, `createNotification` 2824+, `createDirectCommission` 3719+, …).
- `backend/src/db/query-builder.ts:201-204` — the error path calls **`console.warn` (not a JS method)** → throws inside catch, so nothing is logged at all.
- **Impact:** any SQL error (missing table, constraint, type) silently turns money movement into memory-only writes that vanish on restart / diverge per instance. Horizontal scaling = split-brain balances.
- **Fix:** DB failure must be fatal for financial mutations (500 + rollback), remove fallbacks, add a real logger.

### P0-6 · Money-printing: daily yield collectable without starting the 3-hour cycle
- `backend/src/engines/solar-engine.ts:238-250` — 3h hold only applies `if (startedAtTime > 0 …)`. No today's log → `startedAtTime === 0` → `settleDailyOperation` credits a **full daily yield instantly**. Replayable per day per unit; buy N units and settle all.
- Line 243 — `isTestOrForced = NODE_ENV==='test' || unit.isReceivable` bypasses the hold entirely.
- Line 263 — `kwhGenerated = Math.random()` (fabricated telemetry).
- **Fix:** pay only when a log with `startedAt` exists AND 3h elapsed (or real server-side settlement clock); remove `isTestOrForced`; real generation accounting.

### P0-7 · Live schema drift — 8 tables + 2 functions missing in production
Tables in live DB (verified `information_schema`): `audit_logs, business_rules, commissions, earnings_ledger, generation_logs, notifications, orders, platform_settings, points_ledger, profiles, recharge_requests, solar_plans, solar_projects, solar_units, support_tickets, user_sessions, users, withdrawal_requests`.
**Missing (silently swallowed by P0-5):**
| Code path | Missing table | Prod effect |
|---|---|---|
| `createOrder` | `order_items` | orders persist only in memory |
| shop / admin | `products` | seed-only catalog |
| KYC | `kyc_submissions` | "submitted" but never reviewable |
| KYC wallets | `payout_methods` | wallet methods never persist |
| fraud | `fraud_signals` | scan results vanish |
| rewards | `rewards`, `reward_redemptions` | voucher credits bypass ledger |
| leadership | `leadership_levels` | seed ranks only |
| settings | `business_rules` (**table is empty**) | config defaults only |

`pg_proc` is **empty** → `debit_user_balance` / `credit_user_balance` (schema.sql:476-518) don't exist → the "atomic RPC" tier of `atomicDebitBalance`/`atomicCreditBalance` never runs in prod; only the non-transactional SELECT→UPDATE CAS loop remains, whose failures fall into in-memory.
- **Fix:** complete migration + schema-version test against a real DB in CI.

### P0-8 · Admin Withdrawal Queue is 404-broken (money desk unusable)
- `frontend/app/admin/withdrawals/page.tsx:43` → `GET /api/admin/withdrawals`; `:97-103` → `POST /api/admin/withdrawals`.
- Backend `admin.routes.ts` has **no** `/withdrawals` route (verified). Only `POST /api/withdrawals/process` exists (`withdrawals.routes.ts:95`) and the UI never calls it.
- **Effect:** the 2 pending withdrawals in the live DB can never be approved/completed/rejected from the console.
- **Fix:** add the admin withdrawals routes or re-point the UI, with an integration test.

### P0-9 · Rewards: UI is fake; real endpoint is racy → points/voucher double-spend
- `frontend/app/dashboard/rewards/page.tsx:26-61` — vouchers `voucher-fee-discount`/`voucher-daily-boost`/`voucher-vip-badge` are client-only; `handleRedeem` = `setTimeout(600ms)` + toast. Backend rewards (`points-engine.ts:81-85`: `rew-5usdt`, `rew-20usdt`) are never called; IDs don't even match.
- `backend/src/engines/points-engine.ts:56-132` — non-atomic check-then-credit-then-deduct: two concurrent `POST /api/points/redeem` both pass the balance check → each mints +5/+20 USDT (and deductions use stale reads).
- **Fix:** server-validated rewards + atomic `UPDATE … SET points = points - cost WHERE points >= cost` + idempotent redemption key; wire or remove the fake UI.

### P0-10 · Password reset does not exist — page pretends it does
- `frontend/app/forgot-password/page.tsx:20-23` — `await setTimeout(600ms)` then success. No API call, no email.
- No backend reset endpoint in the 63-route inventory; admin has no user-password-reset endpoint either → locked-out users are permanently locked out.
- **Fix:** real reset (email token / admin-initiated reset) or remove the UI.

### P0-11 · Legal/compliance: fixed daily ROI + recruitment commissions contradict own UI
- Plans pay **guaranteed fixed yields** (`seed-data.ts` `INITIAL_PLANS`): P1 $35→0.80/day×43 days=$34.40 (≈98% in 60d); P2 150→146.20; P3 300→309.60; P4 600→645; P5 1500→1720; P6 4000→4730.
- `frontend/app/dashboard/page.tsx:406-408` compliance notice: *"No guaranteed daily returns, fixed yields, or passive investment contracts are offered."* — direct contradiction.
- **Three different commission structures** advertised: `mlm-engine` L1 10%/L2 5%; `tree-engine.ts:51` comment "L1: 10%, L2: 3%, L3: 1%"; `commission-math.ts` 10/5. `business_rules.REFERRAL_COMMISSION` referenced but empty in prod.
- Fabricated kWh (`Math.random()`), hardcoded `performanceRatio: 99.2`.
---

## P1 — HIGH (serious; fix before launch)

- **P1-1 · No login lockout / brute-force**: `auth.routes.ts` login never checks `failed_login_attempts` / `locked_until` (used only by the PIN path). Combined with spoofable IP rate limiting → unlimited password guessing.
- **P1-2 · Rate limiter is in-memory + IP spoofable**: `rate-limiter.ts:31-56` trusts `cf-connecting-ip`, `x-real-ip`, and last `x-forwarded-for` element; `server.ts:64` sets `trust proxy = 1`. Any client sets these headers to bypass limits. Store is a `Map` (per-instance, not shared, lost on restart).
- **P1-3 · Session revocation IDOR**: `auth.routes.ts:451-492` — any user can `POST /api/auth/sessions {action:'REVOKE_ONE', sessionId:<victim>}`; `db/index.ts:3392-3402` revokes by id with **no ownership check** → log out other users / force admin re-auth (DoS). Also `revokeSession`/`revokeAllUserSessions` return `true` even when the DB update failed.
- **P1-4 · Notification mark-read IDOR**: `notifications.routes.ts:41-44` — any user marks any `notificationId` read (no ownership check).
- **P1-5 · Orders are free & unpaiable**: `orders.routes.ts:35-134` creates "PENDING" orders with **no charge** and no payment initiation (no gateway integration). `payments.routes.ts` webhook is the ONLY way to mark PAID:
  - `PAYMENT_WEBHOOK_SECRET` is absent from `backend/.env` → webhook returns 503 → **orders can never be paid → commissions can never be distributed** (platform's core commerce loop is dead).
  - Raw-body bug: `rawBody = JSON.stringify(req.body)` (line 13) after `express.json()` — re-serialized bytes won't match the HMAC of the real raw body → signature verification would fail even if configured. Header fallbacks `x-signature`/`stripe-signature` (24-27) also imply inconsistent upstreams.
  - When it IS enabled, `order.paid` → `distributeOrderCommissions` is multi-step with no transaction (partial distribution on mid-loop failure).
- **P1-6 · JWT hardening**: no `iss`/`aud` (`jwt.ts:22-28`), role embedded in token (role changes don't invalidate), 7-day expiry, no server-side revocation (sessions table is never consulted on JWT requests; `logout` only clears the cookie), password change doesn't rotate sessions.
- **P1-7 · Signup validation gaps**: `auth.routes.ts:148-186` — phone/country default to fake `+1 (555) 000-0000` / `United States`; no email verification; no anti-bot; referral code means anyone can multi-account to build a downline (no device/IP fingerprinting); deceptive referral-code "applied" indicator (any string shows success; invalid codes are silently ignored, no user feedback).
- **P1-8 · KYC is storage-free, forgeable**: `kyc.routes.ts:41-57` accepts arbitrary `frontUrl`/`backUrl` document URLs and plaintext `docNumber` (PII at rest); no file upload, no image validation, no face/selfie check. And `kyc_submissions` doesn't exist in the live DB (silently vanishes). Withdrawal KYC gate is therefore meaningless.
- **P1-9 · Recharge flow weaknesses**: `recharge.routes.ts` — no rate limit on `/submit`; client can override `destinationAddress` (an attacker can "deposit to their own address" and claim the admin credited the request); `proofImageUrl` optional yet admin approves based on it; the deposit addresses are **hardcoded in client code** (`frontend/app/dashboard/recharge/page.tsx:37-41`, `frontend/app/dashboard/panels/page.tsx` `ADMIN_DEPOSIT_ADDRESSES`) → single point of failure / supply-chain redirect risk.
- **P1-10 · Admin search & stats load ALL rows into memory** (`admin.routes.ts:719-764`, `:15-135`) — N+1 and O(n) filtering; will not scale.
- **P1-11 · Products PUT mass-assignment**: `products.routes.ts:111-133` passes `req.body` wholesale to `updateProduct` with no whitelist in the route (defense should be at DB layer; verify `updateProduct` maps only safe fields).
- **P1-12 · Fraud scanner writes duplicate signals**: `fraud-detector.ts:10-48` — each SCAN run re-creates `CIRCULAR_SPONSOR_LOOP` / shared-payout signals with no dedup key (spam inbox, false KPIs), and `fraud_signals` is absent in prod.
- **P1-13 · Tests can't run**: 7 test files exist (`backend/tests/*.test.ts`) but **no test runner/deps/script** in `backend/package.json` (`dev/build/start/seed-neon` only; no vitest/jest/mocha). The old audit's "62/64 pass" is unverifiable — nothing executes them.
- **P1-14 · Frontend lint is broken**: `package.json` has `"lint": "next lint"` but **no `.eslintrc`/`eslint.config`** → lint fails out of the box.
- **P1-15 · No CI/CD at all**: no `.github/workflows`, no lint/type/test gate before the (automated) deploy path.
- **P1-16 · Withdrawal state machine holes**: `withdrawal-engine.ts` `COMPLETE`/`APPROVE`/`PROCESS` (lines 194-235) use non-conditional `updateWithdrawal` (status can be overwritten concurrently; no `WHERE status = expected` for these transitions), and `updateWithdrawal` (`db/index.ts:2393-2418`) always returns `true` semantics on fallback.
- **P1-17 · Admin user-status update unvalidated enum**: `admin.routes.ts:220-255` accepts any `status` string from body (no CHECK-driven early validation; DB check is the only guard).
---

## P2 — MEDIUM (significant defects / exposure)

- **P2-1 · Latent SQL-injection surface (identifiers)**: `query-builder.ts` interpolates table/column/operator/func names raw (`${this.tableName}`, `${f.column}`, `${f.operator}`, `SELECT * FROM ${functionName}(…)` line 223). Values are parameterized (good), but any future route passing user input as a column/table/function name becomes injectable. Harden with a whitelist.
- **P2-2 · `rpc()` returns only `rows[0]`** (`query-builder.ts:225`) — functions returning multiple rows are truncated; also returns `{data:null}` on empty.
- **P2-3 · Dependency vulnerabilities (verified via npm audit)**:
  - Backend: `express 4.22.2` → `qs` **2 moderate** (array-limit bypass / DoS).
  - Frontend: `next 14.2.35` → `postcss ≤8.5.22` **2 high** (XSS in CSS stringify; source-map file disclosure). `npm audit fix --force` would jump to Next 16 (breaking).
- **P2-4 · CSP is weak**: `next.config.mjs:48-56` — `script-src 'self' 'unsafe-eval' 'unsafe-inline'` (eval + inline defeats most XSS mitigations). OK parts: `X-Frame-Options DENY`, `frame-ancestors 'none'`, HSTS preload, nosniff, Referrer-Policy.
- **P2-5 · Next.js rewrites may not apply on Cloudflare Pages** (`next.config.mjs:12-20`): the `/api/*` → backend rewrite is embedded in the Next server; on Cloudflare Pages the standalone server/rewrites typically don't run unless the project is deployed with the Next.js adapter/runtime — the live deployment likely 404s `/api/*` unless `NEXT_PUBLIC_API_URL` is correctly set and `api-client.ts` bypasses the rewrite (it uses `NEXT_PUBLIC_API_URL || ''`, defaulting to site-relative `/api/...`).
- **P2-6 · Static schedule cache vs dynamic rules**: `solar-engine.ts` keeps a static `cachedSchedule` (12PM–3PM M-F); `getSolarOperationStatus` never calls `loadDynamicSchedule` (refreshed only in `GET /api/solar/plans` with 30s TTL) → operation window can be inconsistent with the configured window.
- **P2-7 · Frontend duplicates plan data**: `frontend/app/dashboard/panels/page.tsx:27+` hardcodes P1–P6 (prices, yields, images) instead of consuming `/api/solar/plans` — guaranteed drift when admin edits plans.
- **P2-8 · Points "efficiency"/yield math is fabricated business logic**: `PointsService.getEfficiencyMultiplier` (70+→1.0 … ≤30→0.1) silently changes promised daily yields; `performanceRatio: 99.2`, `efficiency: 99.1`, `weatherCondition:'OPTIMAL'` are constant strings — the "dynamic generation" is cosmetic.
- **P2-9 · Support ticket flows**: `support.routes.ts:36-77` — when a message and a status arrive together, only the status branch runs (message silently dropped); users can set free-form `status`; no rate limit; new tickets get no admin notification/email.
- **P2-10 · `transaction-password` rate limit keyed by IP only**: an attacker who knows an account can still hit PIN VERIFY 5×/15min per spoofed IP; and SET can be CSRF'd (see P0-3).
- **P2-11 · No 2FA despite schema column**: `profiles.two_factor_enabled` and `users.locked_until` exist but nothing enforces/uses them; password-only login.
- **P2-12 · Session tokens & IDs use `Math.random()`** (`db/index.ts:3248` `tok_${Math.random()...}`), and user ids are timestamp-derived (`auth.routes.ts:174`) → predictable-ish, enables IDOR enumeration.
- **P2-13 · `GET /api/orders?all=true` admin branch** (`orders.routes.ts:16-19`) returns the entire order table with no pagination.
- **P2-14 · MLM tree depth unbounded-ish**: `mlm.routes.ts:37` `depth` from query (no clamp) — deep trees can stall the response; `network/tree` clamps nothing either (`network.routes.ts:74-75` parses int without bounds).
- **P2-15 · `GET /api/admin/users` returns full user objects** incl. phone/country/balance for listing (oversharing within admin is OK, but the same `getAllUsers` feeds `/api/admin/search` returned publicly? No — search is superadmin-only, but `GET /api/admin/users` is also superadmin-guarded; still, avoid returning financials in list endpoints).
- **P2-16 · No `?all=true` ownership confusion**: `GET /api/orders?all=true` for SUPER_ADMIN returns *all* — but the route is under `requireAuthenticatedUser` before role check; role check happens correctly (fine) — retained for awareness.
- **P2-17 · `POST /api/solar/purchase` has no rate limit** — mass plan purchases allowed; combined with P0-6 = mass instant yield harvesting.
- **P2-18 · Withdrawals accept user-supplied `idempotencyKey`** (`withdrawals.routes.ts:20`) but it's never used to dedupe — replay protection is unilateral (only ledger key `WDR-REQ-<id>`), duplicates prevented only by balance math.
- **P2-19 · Hardcoded withdraw fee messaging**: UI says "flat 10% across all plans" while `calculateFee` reads `plan.withdrawalFeePercent` (could differ) — drift + user-facing misinformation.
- **P2-20 · Referral-code enumeration**: `GET /api/mlm/tree` with `search` leaks whether emails/names exist (superadmin only — OK), but **signup** reveals email existence (`EMAIL_IN_USE`) and referral validity is unvalidated.
- **P2-21 · No pagination hardening on ledger/commissions**: `GET /api/admin/ledger` fetches all rows then slices (memory), and `GET /api/commissions` sorts in JS.
- **P2-22 · `platform_settings` table exists in live DB but no code uses it** (schema drift artifact).
- **P2-23 · Error responses can leak internals**: `mlm.routes.ts:78` returns `error: err.message`; several routes return `error.message` to the client (`orders.routes.ts:27`, `products.routes.ts:75`…).
---

## P3 — LOW / HYGIENE

- No `aria-label`s on icon-only buttons (admin mobile menu, copy-address buttons, modals); `<html lang>` set, but no skip-to-content link; tiny 9–13px fonts hurt readability; no `autocomplete` attrs on login/signup; no reduced-motion handling; no i18n.
- `frontend/ui/role-switcher.tsx` returns `null` (dead component, still imported by layout).
- Hardcoded hex colors (`bg-[#050B18]`, `text-[#F8FAFC]`) repeated across ~50 pages instead of theme tokens.
- No `maxLength`/format validation on KYC doc number, wallet address, PIN inputs.
- Duplicated money config: `panels/page.tsx` `DEFAULT_PANELS`, `recharge/page.tsx` deposit addresses, `rewards/page.tsx` voucher list — three sources of truth.
- `seed-data.ts` (1,278 lines) ships in the production bundle; in-memory fallbacks can surface seed user "Sarah Jenkins / usr-demo-user" in prod responses on DB error.
- Old audit docs + committed screenshots (`backend/docs/screenshots/*.png`) and the stale `AUDIT_REPORT.md` describing the deleted architecture remain in-repo.
- Login page redirect logic ORs email-string checks with role checks — fragile, leaks admin lanes.
- No request IDs / structured logging; only `console.error`.
- `NODE_ENV === 'test'` environment-flag abuse risk in engine code.
- Inconsistent aliases (`amountUsdt` vs `amount`, `transactionPassword` vs `pin`) across routes.
- TypeScript `strict: false` in both projects; many `as any`.
- 5 stray `console.*` in app code; no lint gate.
- No `test`/`typecheck` npm scripts; `@types/express ^5` with express 4 (mismatch).

---

## API INVENTORY (all 63 endpoints, current Express backend)

| Method | Path | Auth | Status / Notes |
|---|---|---|---|
| GET | /health | none | OK |
| POST | /api/auth/login | none | OK; no lockout (P1-1) |
| POST | /api/auth/signup | none | OK; fake defaults (P1-7) |
| POST | /api/auth/logout | none | cookie cleared; session not closed |
| GET | /api/auth/me | JWT | OK |
| PATCH | /api/auth/me | JWT | **CSRF target (P0-3)** |
| POST | /api/auth/password | JWT | OK |
| GET | /api/auth/sessions | JWT+role | OK |
| POST | /api/auth/sessions | JWT+role | **IDOR (P1-3)** |
| POST | /api/auth/transaction-password | JWT | **SET w/o PIN (P0-3)** |
| GET | /api/dashboard/overview | JWT | OK |
| GET | /api/solar/plans | none | OK |
| POST | /api/solar/plans | SUPER_ADMIN | OK |
| POST | /api/solar/purchase | JWT | no rate limit (P2-17) |
| GET | /api/solar/operate | none | schedule cache (P2-6) |
| POST | /api/solar/operate | JWT | **money-printing (P0-6)** |
| POST | /api/solar/upgrade | JWT | OK |
| GET | /api/network/stats | JWT | OK; downline-gated |
| GET | /api/network/tree | JWT | unbounded depth (P2-14) |
| GET | /api/network/genealogy/:id | JWT | OK |
| GET | /api/mlm/stats | JWT | OK |
| GET | /api/mlm/tree | JWT | leaks err.message (P2-23) |
| POST | /api/points/adjust | SUPER_ADMIN | OK |
| POST | /api/points/redeem | JWT | **race (P0-9)** |
| GET | /api/recharge/list | JWT | OK |
| POST | /api/recharge/submit | JWT | **no rate limit (P1-9)** |
| GET | /api/withdrawals/request | JWT | OK |
| POST | /api/withdrawals/request | JWT | **CSRF target (P0-3)** |
| POST | /api/withdrawals/process | SUPER_ADMIN | OK; state machine (P1-16) |
| GET | /api/orders | JWT | OK |
| POST | /api/orders | JWT | **unpaid orders (P1-5)** |
| GET | /api/orders/:id | JWT | OK |
| POST | /api/orders/:id | JWT | CANCEL only |
| POST | /api/orders/:id/refund | SUPER_ADMIN | OK |
| GET | /api/products | none | seed-only in prod (P0-7) |
| POST | /api/products | SUPER_ADMIN | OK |
| GET | /api/products/:id | none | OK |
| PUT | /api/products/:id | SUPER_ADMIN | mass-assignment (P1-11) |
| GET | /api/kyc | JWT | OK |
| POST | /api/kyc | JWT | **forgeable (P1-8)** |
| GET | /api/kyc/methods | JWT | OK |
| POST | /api/kyc/methods | JWT | OK |
| GET | /api/leadership/progress | JWT | OK |
| POST | /api/leadership/promote | JWT | OK |
| GET | /api/notifications | JWT | OK |
| POST | /api/notifications | JWT | **IDOR (P1-4)** |
| GET | /api/support/tickets | JWT | OK |
| POST | /api/support/tickets | JWT | **branch bug (P2-9)** |
| POST | /api/contact | none | OK |
| GET | /api/commissions | JWT | OK |
| POST | /api/payments/webhook | HMAC | **never configured (P1-5)** |
| GET | /api/admin/stats | SUPER_ADMIN | heavy (P1-10) |
| GET | /api/admin/users | SUPER_ADMIN | OK |
| POST | /api/admin/users | SUPER_ADMIN | status enum (P1-17) |
| GET | /api/admin/recharges | SUPER_ADMIN | OK |
| POST | /api/admin/recharges | SUPER_ADMIN | OK |
| GET | /api/admin/commissions | SUPER_ADMIN | OK |
| GET | /api/admin/rules | SUPER_ADMIN | OK |
| POST | /api/admin/rules | SUPER_ADMIN | OK |
| GET | /api/admin/fraud | SUPER_ADMIN | OK |
| POST | /api/admin/fraud | SUPER_ADMIN | duplicates (P1-12) |
| GET | /api/admin/kyc | SUPER_ADMIN | empty in prod |
| POST | /api/admin/kyc | SUPER_ADMIN | empty in prod |
| GET | /api/admin/ledger | SUPER_ADMIN | full-table scan |
| GET | /api/admin/units | SUPER_ADMIN | OK |
| GET | /api/admin/panel-images | SUPER_ADMIN | OK |
| POST | /api/admin/panel-images | SUPER_ADMIN | OK |
| POST | /api/admin/broadcast | SUPER_ADMIN | OK |
| GET | /api/admin/search | SUPER_ADMIN | full-table scan |
| **—** | **/api/admin/withdrawals** | **—** | **❌ 404 — UI depends on it (P0-8)** |

---

## LIVE DATABASE AUDIT (verified read-only on Neon production)

- **Users:** 11. SUPER_ADMIN = `admin@gmail.com` (balance $5,000). Remaining are seed/demo users (Sarah Jenkins $145.60, alex/elena/michael/liam $12.80–$420) and test fixtures (`*@solargrid.test`). **Prod DB = test/fake money + hardcoded owner admin.**
- **Units:** 2 · **Orders:** 0 · **Commissions:** 11 (seeded) · **Recharges:** 0 · **Withdrawals:** 2 (pending — stuck, see P0-8) · **Ledger rows:** 7 · **Audit rows:** 27.
- **`pg_proc`:** empty → `debit_user_balance`/`credit_user_balance` do NOT exist.
- **Missing tables:** `products`, `order_items`, `kyc_submissions`, `payout_methods`, `fraud_signals`, `rewards`, `reward_redemptions`, `leadership_levels` (P0-7).
- **`business_rules`:** exists but **empty** → admin Settings has nothing to edit; commission-rate config is inert.
- **`platform_settings`:** exists; no code uses it.
- **Connection exposure:** `block_public_connections=false`, `allowed_ips=[]`, owner password in repo `.env` (P0-4). Always-on compute (suspend 0).

---

## FEATURE MATRIX (every page)

**Public:** Home, Login (works), Signup/Register (works), Forgot Password (**fake**, P0-10), Plans, Products (seed-only in prod), Projects, How-It-Works, FAQ, Terms/Privacy/Rules/Income-Disclosure (income disclosure contradicts engine math, P0-11), About, Contact (writes audit log — no real email), Community/Leadership/Rewards (marketing).

**Member dashboard:** Overview (live), Panels (hardcoded plans + purchase/recharge modals), Start Panel (frontend 3h countdown; backend hold bypassable — P0-6), Wallet/KYC (in-memory in prod — P1-8), Withdraw (real; CSRF-able — P0-3), Recharge (real; no rate limit — P1-9), Records tabs (live), Earnings (live), Network Tree (live), Referrals/Invite (live), Shop (live; unpaid orders — P1-5), Orders (live), Profile (real PATCH; PIN for wallet change), **Rewards (FAKE UI — P0-9)**, Notifications (live; IDOR mark-read — P1-4), Support (live), Leadership (live).

**Admin console:** Stats (live), Users + 360° (live), MLM/Genealogy (live), Commissions (live), Recharges (live), **Withdrawals (❌ 404 — broken, P0-8)**, Points (live), Ledger (live), Plans (reads plans), Rules/Settings (live), Broadcasts (live), Support Desk (live), Audit Trail (live), Panel Images (live), Fraud (live; duplicate signals — P1-12), KYC (broken in prod — table missing), Clawback (refund route; unreachable since orders can't be paid), Security/Sessions (live; IDOR revoke — P1-3), **Network/Leadership/Analytics/Rewards admin pages make ZERO API calls** (placeholder UI).

---

## FRONTEND UI/UX AUDIT

- **Strengths:** cohesive glassmorphic design, consistent theming, smooth Lenis scroll, responsive incl. mobile admin drawer, optimistic-update framework with rollback, toasts, empty states.
- **Issues:** fake interactions (forgot-password, rewards) undermine trust; tiny fonts (9–13px) and low contrast fail WCAG; icon buttons lack labels; no keyboard focus styling on custom elements; wallet address and KYC fields accept arbitrary values; admin pages fire confetti for money actions (tone); no error boundaries; `RoleSwitcher` dead code; duplicated plan/address/reward constants; misleading "referral applied" indicator.
- **State:** client fetch everywhere; 30s balance polling + visibility refresh; **no real WebSocket/SSE** despite "Realtime" naming.

---

## QUALITY / TESTS / DEPLOY

- Tests: 7 suites in `backend/tests/` but **no runner** — cannot execute. No frontend tests. No CI, no typecheck gate, lint broken (no ESLint config).
- Dockerfile: multi-stage OK; env must come from Render; `.env` not copied (only package, tsconfig, src, dist).
- Cloudflare Pages: `next.config` rewrites/headers likely don't apply to a static export; the deployed frontend must set `NEXT_PUBLIC_API_URL` and backend CORS must allow `*.pages.dev` (it does).

---

## PRIORITIZED REMEDIATION ROADMAP

1. **Today / stop the bleeding:** rotate `neondb_owner` password + JWT secret; remove seeded `admin@gmail.com`; IP allow-list; `SameSite=Lax`; set + fix webhook secret & raw body; `crypto.randomUUID()` ids.
2. **Kill the money bugs:** solar settle must require a real started cycle (server clock); atomic points redemption; CSRF Origin check; add `GET/POST /api/admin/withdrawals`.
3. **Stop silent data loss:** remove/disable in-memory fallbacks in production; fail loudly; run full migration (8 tables + 2 functions); schema smoke test.
4. **Auth hardening:** login lockout, email verification, server-side session/JWT revocation, real password reset, 2FA.
5. **Compliance:** legal review; remove "fixed ROI" or restructure; ONE commission structure; stop fabricating kWh.
6. **Quality:** vitest + CI (lint/type/test/audit), fix lint, `strict: true`, error boundaries, pagination, DB-backed rate limiter.
7. **Cleanup:** stale audit docs/screenshots, dead code, duplicated constants.

---

*Report generated from the current working tree + live read-only DB inspection. All file:line references are relative to `/Users/aniketsanjaykakde/Downloads/app`.*

---

## SUPPLEMENT — NUMERICAL & DATA-INTEGRITY AUDIT (added after final verification pass)

### S-1 · Plan pricing/yield has FOUR diverging sources of truth (user money risk)
Verified against live DB, engine seed, FE hardcode, and marketing copy:

| Plan | Field | Homepage copy | `dashboard/panels/page.tsx` hardcode | `seed-data.ts` (engine fallback) | **LIVE DB** (`solar_plans`) |
|---|---|---|---|---|---|
| P5 | price / daily / gross | — | 1500 / 40.00 / 1720 | 40.00 / 1720 | **1500 / 38.00 / 1634** |
| P6 | price / daily / gross | **$2,500** | 3000 / 85.00 / 3655 | 85.00 / 3655 | **3000 / 80.00 / 3440** |

- `frontend/app/page.tsx:112` advertises **P6 at $2,500**; engine + live DB sell it for **$3,000**.
- P5/P6 daily yields: UI & seed show 40.00/85.00; the live DB (which is what `getPlanByCode` returns in prod) says 38.00/80.00 → **the UI displays yields the platform will not pay, or the DB underpays what was advertised.**
- The buy flow (`POST /api/solar/purchase`) reloads the plan from the DB, so the FE numbers are decorative but create false expectations; KYC-verified reality: users are credited `plan.dailyEarningUsdt` × points multiplier from the DB.
- **Fix:** single source of truth (DB), no hardcoded plan tables in FE, no static price claims in marketing, plus a reconciliation test asserting FE/seed/DB equality.

### S-2 · Route-map redundancy & redirect stubs
Verified: 6 dashboard pages are client-side redirect stubs — `units → /dashboard/start-panel`, `plans → /dashboard/panels`, `points → /dashboard/rewards`, `team → /dashboard/invite`, `referrals → /dashboard/invite`, `leadership → /dashboard/profile`. Meanwhile `/dashboard/start-panel` AND `/dashboard/panel-operation` are two routes to the same component. `/dashboard/panels`, `/dashboard/plans`, `/dashboard/units` are three aliases for the same feature. Admin side: `/admin/mlm` = genealogy; `/admin/network`, `/admin/leadership`, `/admin/analytics`, `/admin/rewards` are **placeholder pages with zero data fetching** (verified `fetch(` count = 0 each).
- **Impact:** confusing IA, duplicated maintenance surface, placeholder features presented as real in the admin nav.
- **Fix:** collapse aliases; either implement or remove the four placeholder admin pages from the nav.

### S-3 · Marketing copy materially conflicts with the compliance notice (reinforces P0-11)
- `/` hero: *"Clean solar energy. **Simple daily returns.**"*, *"receive real daily USDT earnings"*, *"**Fixed costs, predictable daily returns**, active for 43 working days"* (`app/page.tsx:51,55,134,150`); footer repeats *"collect daily returns directly in USDT"* (`ui/footer.tsx:23`).
- Dashboard compliance card says the opposite: *"No guaranteed daily returns, fixed yields, or passive investment contracts are offered."*
- This is the exact regulatory red-flag combination for a fixed-ROI recruitment scheme with contradictory disclosures.

### S-4 · Verified "green" items (so you know what is actually fine)
- `tsc --noEmit` passes on the frontend (EXIT 0) and `tsc` (build) passes on the backend (EXIT 0) — caveat `strict: false`.
- No hardcoded `href` points to a non-existent route (all 35 static hrefs in UI/glass/app resolve to a real page) — no dead links.
- All public static pages (FAQ, Terms, Privacy, Rules, How-It-Works, About, Contact, Income-Disclosure, Projects, Plans, Products, Community, Leadership, Rewards) exist and render; Contact writes an audit log (but sends no email).
- Payment webhook has constant-time HMAC comparison (`webhook-signature.ts`) — good design, just unusable in prod (see P1-5).
- Withdrawal/KYC ownership checks and MLM downline gating on network/genealogy endpoints are present and correct.
- `bcryptjs` used with salt rounds 10 for passwords and PINs; PIN lockout after 5 failed attempts with a 15-minute `locked_until` is implemented on the PIN path.
- Transaction PIN `SET` requires auth (but not the current PIN — see P0-3), and wallet-address changes require PIN verification.

### S-5 · Test-suite reality check (supersedes stale audit claims)
The older `AUDIT_REPORT_FULL_2026-09-08.md` claims "62/64 vitest tests pass" and lists vitest as part of the stack. The current tree has **no vitest/jest/mocha anywhere** (`package.json` scripts are only `dev/build/start/seed-neon`; no dev deps for any runner). Seven `*.test.ts` files sit unused in `backend/tests/`. Any statement about a passing test suite is unverifiable in this revision. No frontend tests exist at all.

---

*End of audit. 11 P0 · 18 P1 · 24 P2 · ~20 P3 + 5 supplementary integrity findings (S-1…S-5).*