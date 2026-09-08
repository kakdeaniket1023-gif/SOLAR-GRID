# SolarGrid — Full Software Audit Report

**Date:** 2026-09-08 · **Auditor:** Independent full-stack code audit (Cline)
**Repo:** `/Users/aniketsanjaykakde/Downloads/app` (github.com/kakdeaniket1023-gif/SOLAR-GRID, branch `main`)
**Stack:** Next.js 14.2 (App Router) · React 18 · TypeScript 5.7 · Neon PostgreSQL (`@neondatabase/serverless`) · Tailwind 3.4 · jose (JWT) · bcryptjs · zod · vitest

---

## 0. Scope & Methodology

Every source file outside `node_modules` was inventoried (306 files, ≈43,000 LOC). The audit covered, exhaustively:

| Layer | Items reviewed |
|---|---|
| Backend API | **All 50** route handlers under `app/api/**` (read line-by-line) |
| Business engines | `lib/db` (4,196 LOC), `lib/solar-engine`, `lib/mlm-engine`, `lib/points-engine`, `lib/tree-engine`, `lib/leadership-engine`, `lib/withdrawal-engine`, `lib/commission-engine`, `lib/ml/*`, `lib/auth/*`, `lib/security/*`, `lib/neon/*`, `lib/realtime` |
| Frontend | Root layout, home, login, signup/register, dashboard layout + core pages (overview, withdrawal, recharge, wallet, invite, start-panel), admin layout + console, all glass/ UI components, navigation/footer |
| Database | `database/schema.sql`, `database/migrations/0001_init.sql`, `0002_direct_selling.sql`, `scripts/migrate-neon.ts` (the schema actually provisioned) |
| Config/infra | `next.config.mjs` (security headers), `middleware.ts`, `tsconfig.json`, `.env` / `.env.example`, `.gitignore`, `package.json` |
| Tests | All 7 vitest suites executed; e2e scripts reviewed |
| Dynamic verification | App booted locally (`next dev`), live HTTP exploit tests executed against real endpoints |

**Tool results:**
- `tsc --noEmit`: ✅ 0 errors (note: `scripts/` excluded from typecheck)
- `vitest run`: ❌ **62 / 64 pass — 2 failing security tests**
- `npm audit --omit=dev`: ❌ **2 high-severity vulnerabilities** (postcss via next@14.2.23; fix requires Next 16, breaking)
- **Live exploit tests: 3 of 3 attacks SUCCEEDED (see §2)**

> Note: the repo already contains `FULL_SOFTWARE_AUDIT_2026-09-08.md` produced by in-repo generator scripts (`scripts/audit_generators/*`). This report is an independent audit and contradicts several of that document's rosy conclusions.

**Severity key:** P0 = exploitable now / money at risk · P1 = serious, fix before any launch · P2 = significant defect or legal exposure · P3 = quality/hygiene.

---

## 1. Executive Summary

SolarGrid is a **multi-level-marketing (MLM) platform selling "solar panel plans" that pay fixed daily USDT returns**, with manual USDT recharges, admin-approved deposits/withdrawals, a 2-level referral commission engine, points, ranks, KYC, support, and a full admin console.

**Verdict: NOT SAFE TO LAUNCH.** The audit found:

- 🔴 **5 P0 security vulnerabilities — two of which were confirmed live by actually exploiting a running instance**: (a) **complete account takeover** of any user with a single forged cookie, and (b) **full admin takeover** with two forged cookies — no password, no JWT, no exploit tooling beyond `curl`.
- 🔴 **A hardcoded SUPER_ADMIN backdoor** (3 plaintext admin passwords committed to a public GitHub repo).
- 🔴 **Multiple money-printing exploits** (order payment simulation endpoint, points-voucher race condition, daily-earnings double-credit race).
- 🔴 **Systemic data-integrity flaw:** every database operation silently falls back to **in-memory Maps** on any DB error — balances, commissions and deposits can be "written" to volatile memory and vanish, or diverge per server instance. 75 empty `catch {}` blocks hide this.
- 🔴 **A live production database credential** stored in `.env` (owner role, full read/write) — must be rotated immediately.
- 🟠 **Severe legal/compliance exposure:** the product is functionally a fixed-daily-ROI + recruitment-commission scheme, while its own UI claims "no guaranteed daily returns… no passive investment contracts are offered." Three different, mutually contradictory commission structures are advertised across pages. Payout "generation" data is fabricated (random kWh, hardcoded performance ratio).

Counts: **12 P0 · 18 P1 · 24 P2 · ~15 P3** findings, each with file/line references below.

---

## 2. CRITICAL — P0 Findings

### P0-1 · Complete account takeover via forged `solargrid_auth_user_id` cookie ✅ CONFIRMED LIVE
- **Where:** `lib/auth/guards.ts:41-43` (`getAuthenticatedUser`), consumed by every guard and route.
- **Detail:** When no JWT is present, the guard **trusts a plain cookie** `solargrid_auth_user_id` and loads whatever user ID it names. That cookie is not a credential — it's an ID. Any attacker sets it (via `document.cookie`, a proxy, or any HTTP client) to a victim's user ID and *becomes* that user on every endpoint: balances, withdrawals, PIN changes, everything.
- **User IDs are leakable:** referral trees and genealogy APIs return member IDs to uplines/downlines (`/api/network/tree`, `/api/network/genealogy/[userId]`), and the ID format `usr-<timestamp>-<5 base36 chars>` (`app/api/auth/signup/route.ts:71`) is low-entropy.
- **Live proof (executed during this audit):**
  ```
  curl /api/auth/me -H 'Cookie: solargrid_auth_user_id=usr-sarah-jenkins'
  → 200 {"success":true,"user":{"id":"usr-sarah-jenkins",...,"availableBalance":145.6,...}}
  ```
  Full profile, balance and financial data returned with **no password, no JWT**.
- **Fix:** Delete the fallback entirely — authentication must be *only* the verified JWT. Stop setting `solargrid_auth_user_id` at login/signup (`app/api/auth/login/route.ts:133-139`, `signup/route.ts:121-127`).

### P0-2 · Full admin bypass via two forged cookies ✅ CONFIRMED LIVE
- **Where:** `middleware.ts:7-8,19-22` — when no JWT, middleware sets `isAuthenticated = true` and takes the role from the **client-settable** cookie `solargrid_auth_role` (set non-httpOnly at login, `login/route.ts:141-147`). Route-level `requireSuperAdmin` re-uses the same user-id fallback, so a valid admin's ID (`usr-admin-marcus`, seeded by `scripts/migrate-neon.ts`) unlocks everything.
- **Live proof (executed during this audit):**
  ```
  curl /admin           -H 'Cookie: solargrid_auth_user_id=usr-admin-marcus; solargrid_auth_role=SUPER_ADMIN' → 200
  curl /api/admin/stats -H 'Cookie: ...same...'  → 200 with full platform financials
  curl /api/admin/stats (no cookies)             → 401  (proves the fallback is the hole)
  ```
- **Impact:** Total admin control — approve/reject all recharges & withdrawals (money movement), ban users, change business rules, read all KYC documents.
- **Fix:** Same as P0-1; in `middleware.ts` never derive identity/role from any cookie except the verified JWT.

### P0-3 · Hardcoded SUPER_ADMIN backdoor credentials (public repo)
- **Where:** `app/api/auth/login/route.ts:48-59`:
  ```ts
  const isAdminEmail = cleanEmail === 'admin@gmail.com' || cleanEmail === 'marcus.vance@solargrid.io';
  if (!user && isAdminEmail && (password === 'password-admin123@' || password === 'adminPass123' || password === 'SolarGrid2026!')) { ... }
  ```
  Lines 73-75 additionally **force-promote** any account with those emails to `SUPER_ADMIN` at login. Same secrets also in `scripts/e2e-browser-test.ts:139`, `scripts/live-e2e-suite.ts:376`, `scripts/migrate-neon.ts:411`.
- **Impact:** The repo is on GitHub — anyone can log in as SUPER_ADMIN with `admin@gmail.com` / `SolarGrid2026!`. This alone is platform death.
- **Fix:** Remove the block; seed admins via one-time CLI only; rotate all admin credentials.

### P0-4 · Hardcoded JWT secret fallback
- **Where:** `lib/auth/jwt.ts:5` — `process.env.JWT_SECRET || 'solargrid-neon-jwt-crypto-secret-key-2026-secure-production'`.
- **Impact:** `JWT_SECRET` is not in the committed `.env`; if unset anywhere, tokens are signed with a public constant → forge any identity/role. No rotation possible.
- **Fix:** `if (!process.env.JWT_SECRET) throw` at boot; provision the secret.

### P0-5 · "PAY" endpoint converts fake payments into real money
- **Where:** `app/api/orders/[id]/route.ts:92-108` — `POST /api/orders/{id} {"action":"PAY"}` is an in-app **payment simulator**: marks any of the caller's PENDING orders `PAID` (fake `sim_...` ref) then calls `MLMService.distributeOrderCommissions`, **crediting real USDT balances** (10% L1 + 5% L2 of order PV) up the tree.
- **Impact:** Free-money loop: create order → PAY → upline gets real withdrawable balance; no payment ever occurs; the HMAC-verified webhook (`/api/payments/webhook`) is rendered pointless by this bypass. Clawback only triggers on refunds.
- **Fix:** Delete the `PAY` action or gate behind dev-env + admin-only; in production only the signature-verified webhook may transition orders to `PAID`.

### P0-6 · Live production database credentials exposed
- **Where:** `.env` — `DATABASE_URL` contains the **owner-role password for the live Neon instance** (pooled + unpooled). `.env` is gitignored, but the secret has left the machine with this workspace and must be treated as compromised.
- **Fix:** Rotate the Neon role password **today**; move secrets to the hosting platform's secret store; review Neon access logs for foreign IPs.

### P0-7 · Silent in-memory database fallback corrupts financial state
- **Where:** `lib/db/index.ts` — *every* `DatabaseService` method wraps the Postgres call in `try { ... } catch {}` and falls back to module-level `Map`s (`fallbackUsers`, `fallbackUnits`, `fallbackOrders`, `fallbackCommissions`, …). **75 empty `catch {}` blocks** exist across `lib/` + `app/`.
- **Impact:**
  1. Any transient Neon failure (cold start, timeout) makes writes "succeed" **only in RAM of that server instance** — balances, recharges, withdrawals, commissions silently vanish on restart and diverge between instances.
  2. Read/write paths can mix DB and memory for the same entity → phantom balances, double payouts after failed-then-recovered DB.
  3. Errors are never surfaced: the platform can be fully broken while every API returns `success: true`.
- **Fix:** Remove fallback maps for all financial/user tables; fail loudly (5xx). If a demo mode is wanted, make it explicit, flagged, and non-financial.

### P0-8 · Daily-earnings double-credit race (free money)
- **Where:** `lib/solar-engine/index.ts:217-235` — `settleDailyOperation` implements idempotency by **reading** logs/ledger then crediting. Two concurrent `POST /api/solar/operate {action:'SETTLE'}` both pass the check and both call `atomicCreditBalance`; the ledger idempotency key is inserted **after** the credit, so any unique guard fires too late.
- **Impact:** N parallel requests ⇒ up to N× daily yield per unit per day. Trivially scriptable; the in-memory fallback (P0-7) has no constraints at all.
- **Fix:** Single atomic SQL settlement (e.g., `INSERT ... ON CONFLICT (unit_id, generation_date) DO NOTHING` + credit in one transaction) or `SELECT ... FOR UPDATE` on the unit row.

### P0-9 · Points→voucher redemption race + ordering bug (money printing)
- **Where:** `lib/points-engine/index.ts:56-114` (`redeemReward`):
  - Balance check and deduction are **non-atomic** (read → compare → later `updateUser`); concurrent redemptions both pass.
  - The USDT voucher credit (lines 87-103) executes **before** the points deduction (line 114) — a crash between them grants money without deducting points.
  - Reward `stock` is never decremented; `rew-vip-pass`/booster redeemable infinitely.
  - Points convert 1:1 to cash (`rew-5usdt`: 50 pts → $5), so this is a direct balance-printing exploit.
- **Fix:** Atomic conditional decrement first (`UPDATE users SET points = points - $cost WHERE id=$id AND points >= $cost RETURNING points`), then credit; decrement stock; persist a redemption record.

### P0-10 · Clawback corrupts the ledger when beneficiary balance is insufficient
- **Where:** `lib/mlm-engine/index.ts:177-226` — computes `deficit` and raises a fraud signal, but then **ignores the failed debit**: `atomicDebitBalance` returns `success:false` for insufficient funds, yet the code unconditionally marks the commission `CLAWED_BACK` and writes a ledger DEBIT using the failed call's balances.
- **Impact:** Ledger records money that never moved; commission can never be re-clawed (terminal status); books no longer reconcile. The purpose-built `computeRecoverableAmount` (`lib/commission-engine/math.ts:99`) is never called.
- **Fix:** Debit `min(amount, balance)` (partial recovery), track remainder as debt, mark status consistent with what actually moved.

### P0-11 · Session-revocation IDOR
- **Where:** `app/api/auth/sessions/route.ts:58-71` — `REVOKE_ONE` accepts any `sessionId` with **no ownership check** (`DatabaseService.revokeSession(sessionId)` directly). `GET` is scoped correctly; `POST` is not.
- **Fix:** Verify the session belongs to `auth.user.id` unless `SUPER_ADMIN`.

### P0-12 · Logout / revocation do not invalidate JWTs
- **Where:** `app/api/auth/logout/route.ts` clears cookies only; `lib/auth/guards.ts` never consults the `user_sessions` table; JWTs live 7 days.
- **Impact:** "Terminate all sessions" (`app/admin/security/sessions/page.tsx`) is cosmetic — a stolen token works for 7 more days. With P0-1/P0-2, session control is currently meaningless.
---

## 3. HIGH — P1 Findings

### P1-1 · Withdrawals accept an arbitrary destination address (PIN control bypassed)
- **Where:** `lib/withdrawal-engine/index.ts:22-99` — `requestWithdrawal` pays to whatever `walletAddress` string the request carries (validated only as "≥10 chars"). The "wallet change requires PIN" control (`/api/auth/me` PATCH) is defeated: a user never needs to change their saved wallet — they just supply any address at withdrawal time.
- **Also:** the verified-payout-methods check only applies *if the user has configured payout methods* (lines 42-51); with none configured it's bypassed entirely.
- **Fix:** Pay **only** to the KYC-verified payout method / profile wallet; changes require PIN + cool-down + notification.

### P1-2 · Leadership self-promotion route is weaker than the engine
- **Where:** `app/api/leadership/promote/route.ts:33-45` — non-admins can promote **themselves** repeatedly (one rank per call). It checks only `directs.length` and `user.points`, skipping the KYC-qualified-team and activity requirements enforced by `LeadershipService.promoteUser` (`lib/leadership-engine/index.ts:45-48`). No audit log, no rate limit.
- **Impact:** Rank inflation; ranks gate real benefits (`dailyBonusUsdt`, `LEADERS_ONLY` broadcasts) and marketing status.
- **Fix:** Delegate to the engine's `promoteUser` as the single source of truth; add audit + cooldown.

### P1-3 · Transaction-PIN "SET" overwrites an existing PIN without the old PIN
- **Where:** `app/api/auth/transaction-password/route.ts:71-99` — `action === 'SET'` never verifies the current PIN or checks whether one exists; only `CHANGE` does. A hijacked session (see P0-1) silently replaces the victim's PIN, then passes every PIN check.
- **Fix:** `SET` must fail if a PIN already exists; require confirmation for first-time set.

### P1-4 · Password change skips current-password verification when hash is absent
- **Where:** `app/api/auth/password/route.ts:47-60` — if `getUserWithPasswordByEmail` returns no hash, the current-password check is silently skipped and the new password is set.
- **Fix:** Fail closed when the hash is missing.

### P1-5 · No account-level brute-force protection; no MFA, no email verification
- **Where:** `app/api/auth/login/route.ts` — only per-IP rate limiting (10/min, in-memory). Failed logins never touch `failed_login_attempts`/`locked_until` (used only for the transaction PIN, `lib/auth/transaction-pin.ts`). Signup has no CAPTCHA or email verification; profile flag `twoFactorEnabled` exists but is never enforced anywhere.
- **Fix:** Account lockout + notification, CAPTCHA, verified email before withdrawals, optional TOTP.

### P1-6 · Rate limiter is per-process in-memory
- **Where:** `lib/security/rate-limiter.ts:14` (module `Map`), honestly documented in-file. On serverless/multi-instance deploys (the `.env` targets Neon cloud), limits don't aggregate — every budget is multiplied by instance count. `setInterval` at module scope is a no-op on edge runtimes.
- **Fix:** Shared store (Upstash Redis) for login/signup/PIN/withdrawal/recharge buckets.

### P1-7 · No CSRF defense beyond `SameSite=Lax`
- **Where:** Cookie-based auth on all endpoints; mutating routes have **no CSRF token and no Origin check**. `SameSite=lax` blocks most cross-site POSTs, but the Bearer-token fallback exists on every route, and any future subdomain/lax-bypass exposes withdrawals and admin actions.
- **Fix:** Double-submit CSRF token or `Origin`/`Sec-Fetch-Site` validation on all non-GET endpoints; drop the Bearer fallback unless an API-client story exists.

### P1-8 · Network/genealogy exposes member PII and financials; fabricated funnel data
- **Where:** `lib/tree-engine/index.ts:4-26` — `TreeNode` carries `email`, `availableBalance`, `points`; served to any upline via `/api/network/tree` (depth ≤ requested), `/api/network/genealogy/[userId]` (also returns `stats` + `email`), `/api/mlm/stats` (`directReferrals` incl. emails/balances), `/api/mlm/tree`. `funnel.visitors` is fabricated (`lib/mlm-engine/index.ts:288`: `level1Count * 5 + 10`).
- **Impact:** Privacy/data-protection exposure (GDPR-type): users can enumerate downline emails + exact balances; fake analytics shown in a financial context.
- **Fix:** Strip emails/balances from tree payloads (or make opt-in); remove fabricated funnel data.

### P1-9 · Notification MARK_READ IDOR
- **Where:** `app/api/notifications/route.ts:47-49` — `markNotificationRead(notificationId)` with no ownership check.
- **Fix:** `UPDATE ... WHERE id = $1 AND user_id = $2`.

### P1-10 · Admin read endpoints load entire tables into memory
- **Where:** `/api/admin/stats` (fetches users+units+ledger+recharges+withdrawals+commissions+auditLogs, filters in JS), `/api/admin/search` (same), `/api/admin/users` (loads all users to paginate in JS), `app/api/leadership/progress/route.ts:27-28` (loads **all users** to count directs), `/api/mlm/tree` search.
- **Impact:** O(N) memory/latency per request; collapses at modest scale and drives Neon egress cost.
- **Fix:** SQL filtering/pagination/aggregate views + indexes.

### P1-11 · KYC data stored in plaintext; inputs unvalidated
- **Where:** `/api/kyc` POST — `docNumber`, `frontUrl`, `backUrl` accepted as arbitrary strings (no format/length limits, no proof documents are platform-hosted), stored plaintext in `kyc_submissions`.
- **Fix:** Validate inputs; object storage + signed URLs; encrypt ID numbers; retention/deletion policy (GDPR/CCPA); audit admin reads.

### P1-12 · `updateUserPv` group-PV double-counting / inconsistent semantics
- **Where:** `lib/mlm-engine/index.ts:55` gives the **buyer** `+orderPv` to personal and group PV; line 116 adds the same `orderPv` to **each upline's** group PV. `TreeEngine.getTeamStats:300` falls back to recomputing group PV from L1+L2 personal PV when the column is 0 — displayed numbers depend on which write path ran; clawback reversals (lines 173-175, 228-230) don't handle the double-count.
- **Fix:** Define group PV once (SQL view over team PV) or a single increment path with matching reversal.

### P1-13 · Admin user-status update accepts arbitrary strings
- **Where:** `app/api/admin/users/route.ts:116-118` — `status` from JSON goes straight to `updateUser` (no whitelist of `ACTIVE|PENDING|SUSPENDED|BANNED`). DB CHECK exists in the schema, but the in-memory fallback path bypasses it.
- **Fix:** Zod-validate the enum.

### P1-14 · Products API mass-assignment + inactive-product leak
- **Where:** `/api/products/[id]` PUT passes the raw body to `updateProduct` (any column updatable); `GET /api/products?all=true` is **public** and returns inactive products (`app/api/products/route.ts:10-12`).
- **Fix:** Whitelist updatable fields; require admin for `all=true`.

### P1-15 · Recharge flow: no on-chain verification, weak duplicate detection
- **Where:** `/api/recharge/submit` — amount is **user-claimed**; `currency` accepted as any string; duplicate-tx detection parses error messages (`err.message?.includes('duplicate key') || includes('unq') || includes('tx_hash')`, lines 64-73). Approval then credits real balance on manual judgement.
- **Fix:** Verify tx hash → address → amount → confirmations via an indexer before approval; enum-validate currency; detect duplicates via PG error codes (e.g. `23505`).

### P1-16 · The "atomic" RPC path is dead code — CAS loop always used
- **Where:** `lib/db/index.ts:1464-1486 / 1571-1586` — `rpc('debit_user_balance')` returns `{ data: rows[0] }` (an object) from `query-builder.ts:225`, but the code checks `Array.isArray(rpcData)` → always false → the stored procedures (`database/schema.sql:479,518`) never execute; every balance change uses the 3-attempt CAS loop. Works today, but the primary concurrency mechanism silently never runs.
- **Fix:** Correct the return-shape handling or delete the branch; add a test proving which path executes.

### P1-17 · UTC day-boundary bugs in daily earnings
- **Where:** `lib/solar-engine/index.ts:193,384` — `toISOString().split('T')[0]` defines "today" in UTC. Users near UTC-midnight can start a cycle in one UTC day and settle in the next (or hit "already settled" unexpectedly); idempotency keys span the wrong window.
- **Fix:** Explicit platform timezone for the operating calendar.

### P1-18 · Withdrawal fee depends on an arbitrary "first ACTIVE unit"
- **Where:** `lib/withdrawal-engine/index.ts:68-76` — fee `planCode` = `userUnits.find(u => u.status === 'ACTIVE')?.planCode || 'P1'`; with multiple units the % is whichever returns first (non-deterministic after upgrades). UI claims "flat 10%".
---

## 4. MEDIUM — P2 Findings

### P2-1 · Three contradictory commission structures advertised (legal exposure)
- **Where:**
  - Homepage `app/page.tsx:230-243`: **"5% L1 / 3% L2 / 2% L3"** paid on *"friends' daily generation"* (3 levels, daily-yield based).
  - Invite page `app/dashboard/invite/page.tsx:163-176`: **"L1: 10% / L2: 3% / L3: 1%"**.
  - Actual engine `lib/mlm-engine/index.ts:61-64`: **10% L1 / 5% L2, orders only, 2 levels**; daily-yield commissions explicitly disabled (`distributeCommissions` is a no-op, lines 300-307).
- **Impact:** Users are promised structures that don't exist — misrepresentation risk, support load, and regulator attention (daily-yield MLM promises are a classic pyramid red flag).
- **Fix:** One canonical commission disclosure, rendered from config, matching the engine.

### P2-2 · The platform's own compliance notice contradicts its core mechanic
- **Where:** `app/dashboard/page.tsx:406-408` claims: *"No guaranteed daily returns, fixed yields, or passive investment contracts are offered."* — while the entire product **is** a fixed daily yield: every plan has a hardcoded `dailyEarningUsdt` credited on demand (`lib/solar-engine/index.ts:257-270`), and the homepage/footer advertise "daily USDT earnings" (`app/page.tsx:51-55`, `components/ui/footer.tsx:23-33`).
- **Fix:** Legal review of the entire model (see §8); align copy with reality or change the model.

### P2-3 · Fabricated generation data presented as real output
- **Where:** `lib/solar-engine/index.ts:263,392` — `kwhGenerated = capacityKw * (5.5 + Math.random()*1.5)` (random); `performanceRatio: 99.2` hardcoded (lines 282, 405); "efficiency" is decorative. No real generation data source exists.
- **Impact:** In most jurisdictions this is misrepresentation of a financial product; even as a game it should be labelled.
- **Fix:** Label as simulated, or integrate real telemetry; never mix random numbers into financial UI.

### P2-4 · "Start code" is security theater
- **Where:** `lib/solar-engine/index.ts:374-381` — accepts any code ≥4 chars (`trimmedCode.length >= 4`); the canonical `SOLAR888` is **pre-filled in the UI** (`app/dashboard/start-panel/page.tsx:48`) and printed on-screen (line 466) and in admin settings.
- **Fix:** Remove the code gate or make it a real per-user secret if it has any purpose.

### P2-5 · Operating window (12:00–15:00) not enforced server-side
- **Where:** `getSolarOperationStatus` is display-only; `startDailyOperation`/`settleDailyOperation` never check `startMinutes`/`endMinutes` — only the Mon-Fri day check. The 3-hour "generation" hold is the only real delay (and is skipped when `unit.isReceivable` is truthy, line 243, a legacy path).
- **Fix:** Enforce the window server-side if the schedule is a real product rule.

### P2-6 · Referral-code collisions and duplicate-email races produce 500s
- **Where:** `app/api/auth/signup/route.ts:67-71` — `SG-` + 3 letters + 3 digits (≈26³×900 space shared by all users with similar name prefixes) → unique-violation retries nothing; the duplicate-email check (line 41) is check-then-insert (TOCTOU) → constraint failure surfaces as generic 500 "An error occurred during account creation".
- **Fix:** Retry loop with random suffix / longer code; handle PG `23505` with a friendly 409.

### P2-7 · Signup has no email verification; `points` start value inconsistent
- **Where:** `signup/route.ts` (no verification flow anywhere; no verification token tables in use), `migrate-neon.ts` seeds `points DEFAULT 100`, `database/schema.sql:26` says `DEFAULT 70`; `PointsService.getEfficiencyMultiplier` treats <70 as penalized — so the tier a new user lands in depends on which schema ran.
- **Fix:** Decide the canonical starting points; implement email verification before payouts.

### P2-8 · Contact form writes into `audit_logs`
- **Where:** `app/api/contact/route.ts:36-45` — public inquiries (`actorId: 'public-visitor'`) are stored as audit-log rows with message previews. Wrong store; pollutes the security trail; unbounded growth; no spam protection beyond generic IP rate limit.
- **Fix:** Dedicated `contact_messages` table + honeypot/CAPTCHA.

### P2-9 · "Extra wallets" are smuggled inside `profile.bio` as JSON
- **Where:** `app/dashboard/withdrawal/page.tsx:66-82` — the client parses `profile.bio` for `{extraWallets:[...]}` when it starts with `{`. The profile PATCH API treats bio as a plain string.
- **Impact:** Fragile hidden feature; any user-entered bio starting with `{` breaks the wallet picker; no server validation of that JSON.
- **Fix:** Proper `payout_methods` rows (the table already exists and is used by KYC) instead of JSON-in-bio.

### P2-10 · Invite page binds to fields the API never returns (always shows $0.00)
- **Where:** `app/dashboard/invite/page.tsx:62-63` reads `stats.totalCommissionEarned` and `stats.teamSize`, but `/api/mlm/stats` returns `totalCommissionUsdt` and `totalTeamCount` (`lib/mlm-engine/index.ts:276-294`). "TOTAL EARNED REWARDS" permanently displays $0.00.
- **Fix:** Align field names (or type the response).

### P2-11 · Dashboard-home referral link points to `/register?ref=` which ignores `ref`
- **Where:** `app/dashboard/page.tsx:69` builds `/register?ref=<code>`, but `app/register/page.tsx` never reads the `ref` parameter (no `searchParams` usage) — referred visitors must retype the code. The invite page correctly uses `/signup?ref=`. Two different referral entry points, one broken.
- **Fix:** Single canonical referral URL that passes the code through.

### P2-12 · Duplicate/conflicting database schemas
- **Where:** `database/schema.sql` + `database/migrations/0001_init.sql` define `users.id` as **UUID**, use Supabase-specific RLS (`auth.uid()`, `auth.jwt()` — nonexistent on vanilla Postgres/Neon), and a `commissions` CHECK `level IN (1,2)`. The schema actually provisioned is `scripts/migrate-neon.ts` (VARCHAR(64) ids, no RLS, different defaults). `0002_direct_selling.sql` is a third variant.
- **Impact:** Running `schema.sql`/`0001` on Neon **fails or half-applies**; anyone following the repo docs breaks the app; drift already exists (points default 70 vs 100).
- **Fix:** Keep one migration source of truth (e.g., `migrate-neon.ts` promoted to versioned SQL migrations); delete or archive the Supabase-era files.

### P2-13 · Seed data contradicts the engine (L3 commissions, old rates)
- **Where:** `scripts/migrate-neon.ts:587-630` seeds commissions at **L1 10% / L2 3% / L3 1%** incl. a `level 3` row; the live engine pays 10/5 with `level IN (1,2)` CHECK in `schema.sql` (the seed would violate it). Admin dashboards then display legacy L3 totals.
- **Fix:** Regenerate seed data from the real rules.

### P2-14 · Deposit addresses hardcoded client-side; BEP20/ERC20 share one address
- **Where:** `app/dashboard/recharge/page.tsx:37-41` — TRC20 `TYDz...a2v`, and the same `0x71C5...b2a` for both BEP20 and ERC20; not configurable from admin (`/api/admin/rules` can't touch them).
- **Impact:** Can't rotate/patch addresses without a redeploy; wrong-network deposits are user support incidents; identical EVM address across chains is legal but error-prone.
- **Fix:** Serve addresses from a DB-configured table (admin-managed), one per network, with QR + memo.

### P2-15 · Wallet page double-verifies the PIN (two lockout counters per save)
- **Where:** `app/dashboard/profile/wallet/page.tsx:66-89` — calls `/api/auth/transaction-password` VERIFY, then sends the same PIN to `/api/auth/me` PATCH which verifies again. Each failed save burns 2 of the 5 PIN attempts; two counters exist for the same purpose.
- **Fix:** Verify once server-side in the PATCH (drop the pre-VERIFY call).

### P2-16 · Points-adjustment cap inconsistency
- **Where:** `/api/points/adjust` clamps points to `[0,100]` (line 30) while `PointsService.adjustPoints` (engine) doesn't clamp; `/api/solar/operate` awards +2 without any cap check; the schema CHECK only enforces `>= 0`.
- **Fix:** One rule, one code path.

### P2-17 · Withdrawal COMPLETE skips the state machine
- **Where:** `lib/withdrawal-engine/index.ts:194-235` — `COMPLETE`/`APPROVE`/`PROCESS` use plain `updateWithdrawal` (no from-status guard); only REJECT uses `transitionWithdrawalStatus`. A PENDING withdrawal can be jumped straight to COMPLETED; double-COMPLETE is possible (re-run) and would re-write `reviewedAt` etc. (money was already debited at request time, so impact is audit-trail integrity).
- **Fix:** Use CAS transitions for every action (like the recharge desk does).

### P2-18 · Order quantity unbounded; no stock; shipping address unvalidated
- **Where:** `/api/orders` POST — `qty = parseInt(item.qty) || 1` with no upper bound; `shippingAddress` stored as raw JSON; no product stock accounting anywhere.
- **Fix:** Max qty per item, validate address fields, implement stock or state "made to order".

### P2-19 · Orphaned pages — features exist but are unreachable from navigation
- **User dashboard** (sidebar `components/glass/glass-user-sidebar.tsx` + bottom bar list 9 items; page links add a few more): the following exist as full pages but are linked from **nowhere**: `/dashboard/plans`, `/dashboard/points`, `/dashboard/rewards`, `/dashboard/referrals`, `/dashboard/team`, `/dashboard/units`, `/dashboard/leadership`, `/dashboard/withdrawals`.
- **Admin console** (`app/admin/layout.tsx:34-74` lists 14 links): these exist but are not in the nav: `/admin/kyc`, `/admin/fraud`, `/admin/security`, `/admin/security/sessions`, `/admin/analytics`, `/admin/network`, `/admin/leadership`, `/admin/panel-images`, `/admin/clawback`, `/admin/rewards`.
- **Impact:** KYC review and fraud queue — financially critical admin functions — are only reachable by typing URLs; users can't find rewards/points pages that marketing references.
- **Fix:** Add nav entries or delete dead pages.

### P2-20 · Failing security tests (suite green-washes a weakened route)
- **Where:** `tests/e2e-api-and-workflows.test.ts:62` and `tests/security-auth.test.ts:83` expect `GET /api/auth/me` unauthenticated → **401**, but the route intentionally returns **200 `{authenticated:false}`** (`app/api/auth/me/route.ts:10-16`). `vitest`: 62/64 pass.
- **Impact:** CI (there is none wired) would be red; the divergence shows auth behavior was weakened without updating tests.
- **Fix:** Decide the contract (401 is the better default for an API), update code or tests, wire vitest into CI.

### P2-21 · Fee/earnings messaging inconsistencies
- Withdrawal page: "flat 10% across all plans" vs engine per-plan `withdrawalFeePercent` (P1-18).
- Homepage hero "$35 Starting Plan / 3 Hours Daily Run Time" fine, but "Simple daily returns" vs dashboard disclaimer "no fixed yields" (P2-2).
- `workingDaysTotal` hardcoded fallback 43 in several places (`lib/solar-engine/index.ts:327`, fallback seeds) while plans define their own; changing a plan's `validityDays` mid-life strands units with mismatched counters.

### P2-22 · Super admin can operate/settle any user's unit
- **Where:** `/api/solar/operate` (line 39) and `settleDailyOperation` (`lib/solar-engine/index.ts:200-205`) allow SUPER_ADMIN to start/settle any user's panel, crediting the *owner*. Legitimate for support, but nothing in the audit log records an admin settling on behalf of a user.
- **Fix:** Add an audit log entry when `actorId !== unit.userId`.

### P2-23 · Webhook refund path does not refund the buyer
- **Where:** `/api/payments/webhook` `order.refunded` marks the order REFUNDED and claws back commissions only. If any real gateway refund happened, no ledger entry notifies the user; there's also no user-facing notification on webhook-driven refunds (contrast: commission clawback notifies beneficiaries, lines 232-238).
- **Fix:** Notify the buyer; document what a refund does to shop orders (physical goods) vs solar plans (none exists — see §8).

### P2-24 · Weak CSP and misc config gaps
- **Where:** `next.config.mjs` — CSP includes `'unsafe-eval' 'unsafe-inline'` for scripts (largely negates CSP), `poweredByHeader` not disabled, no `X-DNS-Prefetch-Control`; images allowlisted to unsplash only (fine). Security headers otherwise good (HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy). `tsconfig` excludes `scripts/` from typecheck; `skipLibCheck: true`.
---

## 5. LOW — P3 Findings

1. **75 empty `catch {}` blocks** across `lib/` + `app/` swallow every DB/validation error (grep-verified). At minimum log with structured logger + request IDs.
2. **164 `: any` usages** — types are lost at every engine boundary; `types/index.ts` duplicates fields under different names (`amount` vs `amountUsdt`, `totalPv` vs `totalAmount`), which caused P2-10.
3. **13 `console.*` statements** in app/lib (incl. `console.error('Signup error:', err)` — potential payload leakage to logs).
4. **Accessibility:** status conveyed by color only; 9-11px font sizes throughout the glass design system; no `prefers-reduced-motion` guard around Lenis smooth-scroll or confetti.
5. **No error boundaries / custom 404-500 pages**; client code does `catch(() => {})` in nearly every `loadData`, so network failures render as empty states indistinguishable from "no data" (`app/dashboard/page.tsx:59`, `wallet/page.tsx:40`).
6. **No request timeouts/retry policy** on Neon HTTP calls; single shared `neon()` client (`lib/neon/client.ts`).
7. **No cron/scheduler:** units past `expiryDate`/`workingDaysTotal` are marked `EXPIRED` only lazily when next operated; `is_receivable` legacy flag lingers.
8. **Timezone-naive dates** (`toLocaleDateString()` — server/client hydration mismatch potential).
9. **Tests hit only the in-memory fallback** — no suite exercises real SQL (constraints, CAS, RPC), so none of the P0 race conditions can be caught. `tests/live-exploit-checks.test.ts` / `scripts/live-e2e-suite.ts` hit a **live database** and contain the admin password (P0-3) — must never run in CI.
10. **Dependencies:** `npm audit` 2 high (postcss ← next@14.2.23; fixed only in Next 16 — plan a major upgrade); lockfile committed (good).
11. **Repo hygiene:** screenshots and Python audit-generator scripts live in the repo root; no README; `.gitignore` covers `*.png` but screenshots exist locally.
12. **No observability:** no error tracking/metrics/alerts; `audit_logs` unbounded, no retention job.
13. **i18n/currency:** USDT hardcoded; no localization despite global marketing copy.
14. **SEO:** metadata on root layout only; no per-page metadata, sitemap, or robots.txt.
15. **`components/ui/role-switcher.tsx`** renders `null` — dead code from the old client-role era (delete).

---

## 6. Verified Working Features (for fairness)

- **Auth core:** JWT HS256 via `jose`, HttpOnly cookie, bcrypt (cost 10), zod validation, signup→auto-login, IP rate limiting, BANNED/SUSPENDED gate, audit logging. *(The guard *implementation* is broken — P0-1/2 — but the pattern is consistently applied across all 50 routes.)*
- **Transaction PIN:** bcrypt-hashed, 5-attempt/15-min lockout, audit-logged, required for wallet changes and withdrawals.
- **KYC:** submission + payout methods, admin approve/reject cascading verification, notifications, audit logs.
- **Recharge desk:** atomic status transition before crediting, rollback to PENDING on credit failure, ledger + notification, duplicate-tx rejection.
- **Withdrawals:** KYC gate, min amount, atomic debit **before** creating the request (no negative balances possible), fee computation, ledger entry, admin state machine (P2-17 caveat), refund-on-reject with idempotency key.
- **MLM engine (as coded):** strictly 2 levels, order-PV based, per-(order,level,beneficiary) idempotency keys, PV updates, refund clawback with fraud signals + notifications.
- **Fraud tooling:** circular-sponsor-loop scanner, duplicate-payout detector, rapid-refund churn detector, explainable withdrawal risk scorer, churn predictor.
- **Admin console:** KPIs, member directory, plans/units/ledger/points/broadcast/support/audit, business rules with audit trail, panel image config.
- **Support desk:** tickets + threaded messages with ownership checks.
- **Webhook security:** HMAC-SHA256 over raw body, constant-time compare, fail-closed, idempotent paid/refunded handling, underpayment rejection.
---

## 7. Complete API Inventory (50 routes) — auth & findings cross-reference

| # | Endpoint | Methods | Auth | Notes / Findings |
|---|---|---|---|---|
| 1 | `/api/auth/login` | POST | public | **P0-3** hardcoded admins; P1-5 |
| 2 | `/api/auth/signup` | POST | public | P2-6, P2-7; no email verification |
| 3 | `/api/auth/logout` | POST | public | P0-12 |
| 4 | `/api/auth/me` | GET/PATCH | user | GET returns 200 anon (P2-20); PATCH PIN-protects wallet only |
| 5 | `/api/auth/password` | POST | user | P1-4 |
| 6 | `/api/auth/sessions` | GET/POST | user | **P0-11** IDOR; P0-12 |
| 7 | `/api/auth/transaction-password` | POST | user | **P1-3** SET overwrites |
| 8 | `/api/solar/plans` | GET/POST | public/admin | POST admin-only ✓ |
| 9 | `/api/solar/purchase` | POST | user | atomic debit ✓ |
| 10 | `/api/solar/operate` | GET/POST | user | **P0-8**; P2-4/5/22 |
| 11 | `/api/solar/upgrade` | POST | user | ownership check ✓ |
| 12 | `/api/recharge/submit` | POST | user | P1-15 |
| 13 | `/api/recharge/list` | GET | user | IDOR-guarded ✓ |
| 14 | `/api/withdrawals/request` | GET/POST | user | **P1-1**, P1-18 |
| 15 | `/api/withdrawals/process` | POST | admin | P2-17 |
| 16 | `/api/points/adjust` | POST | admin | P2-16 |
| 17 | `/api/points/redeem` | POST | user | **P0-9** via engine |
| 18 | `/api/leadership/progress` | GET | user | P1-10 |
| 19 | `/api/leadership/promote` | POST | user | **P1-2** self-promotion |
| 20 | `/api/mlm/stats` | GET | user | P1-8; no try/catch |
| 21 | `/api/mlm/tree` | GET | user | admin search ✓; depth default 4 |
| 22 | `/api/network/tree` | GET | user | P1-8; downline-only ✓ |
| 23 | `/api/network/stats` | GET | user | P1-8 |
| 24 | `/api/network/genealogy/[userId]` | GET | user | P1-8 (email exposure) |
| 25 | `/api/commissions` | GET | user | clean; limit clamped ✓ |
| 26 | `/api/orders` | GET/POST | user | P2-18; `?all=true` admin-only ✓ |
| 27 | `/api/orders/[id]` | GET/POST | user | **P0-5** PAY simulation |
| 28 | `/api/orders/[id]/refund` | POST | admin | engine clawback ✓ |
| 29 | `/api/products` | GET/POST | public/admin | **P1-14** |
| 30 | `/api/products/[id]` | GET/PUT | public/admin | **P1-14** |
| 31 | `/api/kyc` | GET/POST | user | **P1-11** |
| 32 | `/api/kyc/methods` | GET/POST | user | type whitelist ✓ |
| 33 | `/api/notifications` | GET/POST | user | **P1-9** |
| 34 | `/api/support/tickets` | GET/POST | user | ownership checks ✓ |
| 35 | `/api/contact` | POST | public | P2-8 |
| 36 | `/api/payments/webhook` | POST | HMAC | fail-closed ✓; P2-23 |
| 37 | `/api/admin/users` | GET/POST | admin | **P1-13**; P1-10 |
| 38 | `/api/admin/recharges` | GET/POST | admin | atomic transitions ✓ |
| 39 | `/api/admin/withdrawals` | GET/POST | admin | mirrors /process |
| 40 | `/api/admin/kyc` | GET/POST | admin | cascade verify ✓ |
| 41 | `/api/admin/stats` | GET | admin | **P0-2 target**; P1-10 |
| 42 | `/api/admin/search` | GET | admin | P1-10 |
| 43 | `/api/admin/broadcast` | POST | admin | `Promise.all` fan-out, no batching |
| 44 | `/api/admin/commissions` | GET | admin | ✓ |
| 45 | `/api/admin/fraud` | GET/POST | admin | SCAN/RESOLVE ✓ |
| 46 | `/api/admin/ledger` | GET | admin | in-memory pagination (P1-10) |
| 47 | `/api/admin/panel-images` | GET/POST | admin | ✓ |
| 48 | `/api/admin/rules` | GET/POST | admin | `value` accepted as any JSON type |
| 49 | `/api/admin/units` | GET | admin | ✓ |
| 50 | *(middleware gate)* `/api/admin/*` | — | cookie | **P0-2** |

Error responses are consistently shaped (`success/error/message`) and guard *usage* is uniform — the defect is in the guard *implementation* (P0-1/2), not the pattern. Two handlers lack try/catch (`/api/mlm/stats`, admin withdrawals GET).

---

## 8. Business Model & Legal/Compliance Risk Assessment

This section is not "code quality" — it is the highest-stakes finding in the report.

**What the software actually is, mechanically:**
1. Users deposit USDT manually → admin approves → balance credited (`/api/recharge/*`).
2. Balance is spent on "solar plans" (P1 $35 → P6) that credit a **fixed, hardcoded daily USDT yield** on demand (`lib/solar-engine/index.ts:257-270`), Monday–Friday, for ~43 working days. P1 economics: $35 → $0.80/day × 43 ≈ **$34.40 on $35 (~98% per 60-day cycle)** — a return level no legitimate solar investment produces; the yield is payable only from new deposits (or thin air — the code credits it from nothing).
3. Referral program pays 10%/5% of downline **purchase PV**, ranks with bonuses up to $10,000 + $150/day (`lib/db/index.ts:2528-2632`), and marketing promises multi-level daily-generation commissions (P2-1).

**Hallmark risk indicators present:** fixed guaranteed daily ROI; returns funded by deposits; MLM recruitment structure; "start code" rituals (SOLAR888) resembling engagement-theater used by yield schemes; fabricated generation telemetry (random kWh) shown as earnings basis; anonymous USDT-only deposits with KYC required only at withdrawal; no licenses, no AML/KYC on deposits, no sanctions screening, no risk disclosures beyond a contradicted disclaimer (P2-2), no refund path for plan purchases, fake social proof ("Join thousands of members").

**Exposure:** operating this for real users would, in most jurisdictions, implicate securities/investment-contract regulation, money-transmission rules, AML statutes, and consumer-protection/fraud law (misrepresentation of returns and of "real solar projects" that exist only as seeded rows).

---

## 9. Database & Data-Integrity Findings

**Schema actually provisioned** (`scripts/migrate-neon.ts` — the only script wired to `npm run seed-neon`):
- `users` VARCHAR(64) id, email unique, `points DEFAULT 100`, balances `NUMERIC(14,4) CHECK (>= 0)`, `failed_login_attempts`/`locked_until`, `kyc_status`, `personal_pv`/`group_pv`.
- 20+ tables: profiles, user_sessions, solar_projects/plans/units, generation_logs, earnings_ledger, recharge_requests, withdrawal_requests, points_ledger, leadership_levels, notifications, support_tickets/messages, audit_logs, business_rules, rewards, reward_redemptions, products, orders, order_items, commissions, kyc_submissions, payout_methods, fraud_signals.

**Good:** numeric money columns with CHECK constraints; unique keys on email, referral_code, session_token, order_no, commissions.idempotency_key; FK graph is coherent; indexes on hot lookups (email, referral_code, sponsor_id).

**Issues:**
1. **Three conflicting schema sources** (P2-12): `schema.sql`/`0001_init.sql` (UUID + Supabase RLS that cannot run on Neon) vs `0002_direct_selling.sql` vs `migrate-neon.ts`. No migration runner, no version table — schema changes are untracked.
2. **No DB-level idempotency actually reachable:** `commissions.idempotency_key` unique constraint exists, but the engine's create path catches the duplicate-violation and silently returns the *in-memory* fallback record (P0-7) — then credits anyway in older race windows (P0-8/9).
3. **Balance updates are CAS-looped, not transactional** (`lib/db/index.ts:1488-1556`): correct under low contention, but the loop runs 3 attempts then errors "Concurrent balance modification detected" — under load (P1-10 endpoints hammering), withdrawals will start failing spuriously. Stored procedures that would do it in one statement never run (P1-16).
4. **`updateUser` is a full-object overwrite race** (`db/index.ts:1422-1449`): last-writer-wins on points/balances/`totalEarned` — two concurrent +2 point awards can lose one. All point mutations should be SQL increments (`points = points + $delta`).
5. **`getLedger`/`getGenerationLogs(id)`-based idempotency** reads the user's whole history per settlement — O(n) growth per user per day.
6. **No soft-delete/retention on audit_logs, notifications, sessions** — unbounded growth.
7. **Seed data is stale/inconsistent** (L3 commissions, old rates — P2-13) and seeds financial history (balances, commissions) that any real deployment must not carry.
8. **Text search:** admin search does JS `includes` over full tables (P1-10); no pg_trgm/full-text indexes.
9. **`channel_binding=require` + pooler URL in `.env` is correct for Neon** — but the app's `neon()` HTTP client bypasses the pooler's pgbouncer session limits safely (HTTP-per-query) ✓.

---

## 10. Frontend / UI-UX Assessment (73 pages, 16 components)

**Strengths:** a single, consistent "glass + amber" design language; proper App-Router structure with server components where possible; mobile bottom-bar + desktop sidebar; toast system with stacking; optimistic updates with rollback (`lib/realtime/realtime-context.tsx`); QR/copy affordances; loading states on most money actions; compliance pages exist and are linked from the dashboard.

**Defects (beyond P2-9/10/11, P2-19, P2-21):**
1. **Auth UX contradictions:** login page routes admins by testing `email.includes('admin@gmail.com')` client-side (`app/login/page.tsx:27`) — brittle and leaks the admin addresses in bundle; the middleware redirect params (`?error=unauthorized_401`) are never displayed by the login page.
2. **Money inputs:** withdrawal/recharge pages clamp client-side (`amount < 10`) but never round to 2 decimals before submit (e.g., 60.005 accepted visually); no slip/protection against double-submit beyond `disabled={isSubmitting}` (adequate).
3. **Data-fetching:** every page does ad-hoc `fetch().then()` with `catch(() => {})` — no react-query/SWR, no revalidation, no request deduplication; the 30s `refreshUser` poll (`realtime-context.tsx:143-147`) plus per-page loads hammer `/api/auth/me` and `/api/dashboard/overview`.
4. **`/api/dashboard/overview` is fetched just for an unread-notifications count** in the dashboard layout (`app/dashboard/layout.tsx:13-18`) — heavy endpoint for a badge.
5. **Buttons without loading-state text for admins** in some admin pages; several admin tables render raw JSON via `JSON.stringify` fallbacks (acceptable for back-office).
6. **The "Solar Operations Active / System Normal" ticker** (`components/ui/navigation.tsx:24-37`) is hardcoded — always claims normal status (misleading during incidents).
7. **Confetti on withdrawal request** (`withdrawal/page.tsx` imports `canvas-confetti`) fires *before* admin approval — celebratory UX for a pending action; minor dark-pattern concern.
8. **Accessibility** as noted in P3-4; contrast of `text-slate-600` ticker text on dark background fails WCAG AA.
---

## 11. Testing, Tooling & Infrastructure

**Test suites (7 files, 64 tests — 62 pass / 2 fail):** engines well-covered at unit level (tree cycles, 2-level caps, withdrawal KYC gate, clawback math, idempotency keys, risk scorer). Gaps: zero integration tests against real SQL (constraints/CAS/transactions), zero tests for auth guards/middleware, zero tests for the P0 race windows (parallel SETTLE, parallel redeem), no CI pipeline (no GitHub Actions config in repo), e2e scripts require a **live** DB and embed credentials.

**Tooling:** `tsc` clean (excludes `scripts/`); `eslint-config-next` present but no lint script wired to a CI; no prettier; no Husky/hooks; `npm run test` = vitest (works).

**Infrastructure:** Neon serverless (HTTP driver) — appropriate choice; no staging/prod environment separation in config; no secrets manager; no cron for daily settlement (settlement is user-triggered — acceptable for the "operate" mechanic but means "daily yield" only accrues when the user clicks, which is also the fraud surface P0-8); no backup/restore strategy documented; no rate-limit/WAF in front.

---

## 12. Prioritized Remediation Roadmap

**Sprint 0 — today (stop the bleeding, ~1-2 days):**
1. Rotate Neon password; add `JWT_SECRET` (P0-6, P0-4).
2. Delete the cookie fallbacks in `lib/auth/guards.ts` + `middleware.ts`; stop setting `solargrid_auth_user_id`/`solargrid_auth_role` (P0-1, P0-2). Verify with the exact curl tests in §2 (they must return 401).
3. Remove the hardcoded admin login block; rotate admin credentials everywhere (P0-3); remove admin passwords from e2e scripts (use env vars).
4. Disable/gate `action:'PAY'` (P0-5).
5. Check Neon logs for access anomalies since any credential exposure.

**Sprint 1 — data integrity (~3-5 days):**
6. Remove in-memory fallbacks from all financial paths; return 5xx on DB error; add structured logging (P0-7, P3-1).
7. Make settlement idempotent atomically (single SQL statement or row lock) (P0-8); convert `updateUser` point/balance mutations to conditional SQL increments (§9.4).
8. Fix `redeemReward` ordering + atomic decrement + stock (P0-9); fix clawback partial-recovery + ledger (P0-10).
9. Session ownership check (P0-11); token versioning for logout/revocation (P0-12).

**Sprint 2 — hardening (~1-2 weeks):**
10. Withdrawals pay only to verified payout method (P1-1); PIN SET guard (P1-3); password-change fail-closed (P1-4); account lockout + email verification + CAPTCHA (P1-5); shared rate limiter (P1-6); CSRF origin checks (P1-7).
11. Delegate promote route to the engine (P1-2); validate admin status/products inputs (P1-13/14); on-chain verification for recharges (P1-15); fix dead RPC path (P1-16); timezone policy (P1-17); fee rule (P1-18).
12. SQL-level admin queries + pagination (P1-10); KYC storage hardening (P1-11); strip PII from tree payloads (P1-8); notification IDOR (P1-9); PV accounting (P1-12).

**Sprint 3 — product & compliance (before any real users):**
13. Legal counsel on the model (§8); reconcile all marketing claims with the engine (P2-1/2/3); remove fabricated stats; label simulation if it stays a game.
14. Single migration source of truth + CI (P2-12); consistent seed data (P2-13); admin-managed deposit addresses (P2-14); nav completion (P2-19); fix broken data bindings (P2-10/11).
15. Wire vitest + tsc + lint + npm audit into GitHub Actions; add integration tests against a Neon **branch** database (not prod); add parallel-race regression tests for SETTLE/redeem.

**Evidence appendix — executed during this audit:**
- `tsc --noEmit`: 0 errors.
- `vitest run`: 62/64 (2 auth/me 401-expectation failures).
- `npm audit --omit=dev`: 2 high (postcss/next).
- Live server tests (`next dev`, port 3111): forged-cookie account takeover → 200 with victim profile; forged-cookie admin → 200 on `/api/admin/stats` and `/admin`; unauthenticated baseline → 401. Server terminated after verification.

*End of report — 12 P0 · 18 P1 · 24 P2 · 15 P3 findings across security, correctness, data integrity, compliance, and UX.*










