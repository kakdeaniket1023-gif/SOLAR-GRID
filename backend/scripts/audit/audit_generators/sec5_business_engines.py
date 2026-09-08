def generate_section_5():
    return """# 5. BUSINESS LOGIC ENGINES — DEEP DIVE

This section performs an exhaustive analysis of the core IP and mathematical engines powering SolarGrid under `lib/`.

---

## 5.1 MLM & Referral Commission Engine (`lib/mlm-engine/index.ts`)

### 5.1.1 Exported Functions & Signatures
1. `getUplineChain(userId: string): Promise<{ l1?: User, l2?: User, l3?: User }>`
   - *Inputs:* `userId` (string)
   - *Outputs:* Object containing optional `l1`, `l2`, `l3` User models.
   - *Logic:* Traverses the sponsor hierarchy up to 3 tiers. Employs a `visited: Set<string>` to detect and terminate cyclic referral loops.
2. `distributeCommissions(downlineUserId: string, earningAmountUsdt: number, unitId: string): Promise<void>`
   - *Inputs:* `downlineUserId` (string), `earningAmountUsdt` (number), `unitId` (string)
   - *Outputs:* None (`void`)
   - *Side Effects:*
     - Calculates: L1 = 10.0%, L2 = 5.0%, L3 = 2.0% of `earningAmountUsdt`.
     - Writes CREDIT entries to `earnings_ledger` for active upline sponsors.
     - Increments `users.available_balance` and `users.total_earned`.
     - Dispatches in-app notifications.
3. `getNetworkStats(userId: string): Promise<NetworkStats>`
   - *Inputs:* `userId` (string)
   - *Outputs:* Aggregated count of L1 directs, L2 team, L3 team, qualified members, and total earned commissions.

### 5.1.2 Business Rules in Plain English
- **Multi-Tier Overrides:** Whenever a downline member generates solar energy yield on a weekday, their upline sponsors receive automated matching overrides:
  - **Level 1 (Direct Sponsor):** 10% of generated yield (e.g., on P3 earning $9.30, L1 receives $0.93/day).
  - **Level 2 (Secondary Team):** 5% of generated yield (e.g., on P3, L2 receives $0.465/day).
  - **Level 3 (Tertiary Network):** 2% of generated yield (e.g., on P3, L3 receives $0.186/day).
- **Active Sponsor Requirement:** Inactive (`SUSPENDED` or `BANNED`) sponsors are skipped without breaking the chain.

### 5.1.3 Edge Cases & Vulnerabilities
- **Referral Loops & Self-Referral:** `getUplineChain` initializes `visited.add(userId)` preventing self-referral loops. However, on user registration (`signup`), no check prevents a user from entering their own referral code or creating circular referral chains across multiple accounts before generation occurs.
- **Orphaned Nodes:** If an intermediate sponsor (`L1`) is deleted from the database, `l1.sponsorId` lookup fails gracefully, but `L2` and `L3` rewards for that branch are lost.
- **Precision Handling:** Uses `Math.round(amount * (percent / 100) * 10000) / 10000` (4 decimal places). While 4 decimal places matches PostgreSQL `NUMERIC(14, 4)`, JavaScript floating-point arithmetic can introduce micro-rounding errors over millions of transactions.
- **Atomicity Risk:** If commission distribution fails midway (e.g., L1 succeeds, network error on L2), there is no database transaction rollback; L1 is credited while L2/L3 are skipped.

---

## 5.2 Solar Generation & Upgrade Engine (`lib/solar-engine/*`)

### 5.2.1 Exported Functions & Signatures
1. `getSolarOperationSchedule(): SolarOperationSchedule`
   - Returns fixed schedule: `startTime: '12:00 PM'`, `endTime: '3:00 PM'`, `operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']`.
2. `getSolarOperationStatus(date?: Date): OperationStatusResult`
   - Evaluates whether the current moment falls on a working weekday and determines status: `'WEEKEND'`, `'BEFORE_OPERATION'`, `'OPERATION_ACTIVE'`, or `'OPERATION_COMPLETED'`.
3. `startDailyOperation(unitId: string, userId: string): Promise<Result>`
   - Transitions unit to `isReceivable = true`, records operational status in `generation_logs`.
4. `receiveDailyEarning(unitId: string, userId: string): Promise<Result>`
   - Invokes `settleDailyOperation()`.
5. `settleDailyOperation(unitId: string, userId: string, forcedDateStr?: string): Promise<Result>`
   - Core daily settlement routine: verifies unit ownership, checks idempotency key (`DAILY-SETTLE-{unitId}-{date}`), credits user balance, increments `working_days_completed`, marks unit `EXPIRED` if 43 days reached, and writes `earnings_ledger` credit.
6. `purchasePlan(userId: string, planCode: string): Promise<Result>`
   - Validates balance >= plan price, debits user balance, inserts `solar_units` record, logs DEBIT to `earnings_ledger`.
7. `SolarUpgradeService.calculateUpgradeCost(currentPlanCode, targetPlanCode): Promise<Calculation>`
   - Verifies target plan is higher tier than current plan, calculates trade-in credit equal to original purchase price, and computes required top-up: `topUp = targetPrice - currentPrice`.
8. `SolarUpgradeService.executeUpgrade(unitId, targetPlanCode): Promise<Result>`
   - Debits top-up cost from wallet, updates unit capacity and plan code in `solar_units`, and records DEBIT to `earnings_ledger`.

### 5.2.2 Business Rules in Plain English
- **Weekday Operation Only:** Solar energy generation is credited strictly Monday through Friday. Saturday and Sunday are non-operating maintenance days.
- **43-Day Working Cycle:** Each hardware plan has a validity lifecycle of 60 calendar days, which contains exactly 43 working days. Once a unit completes 43 generation cycles, its status transitions to `EXPIRED`.
- **Plan Pricing and Yields:**
  - **P1 Starter:** Costs $30 USDT. Generates $1.20 USDT/working day. Gross yield = $51.60 USDT. Net yield after 0% fee = $51.60 USDT (172% ROI).
  - **P2 Growth:** Costs $60 USDT. Generates $3.50 USDT/working day. Gross yield = $150.50 USDT. Net yield after 20% withdrawal fee = $120.40 USDT (200.6% ROI).
  - **P3 Pro:** Costs $160 USDT. Generates $9.30 USDT/working day. Gross yield = $399.90 USDT. Net yield after 20% withdrawal fee = $319.92 USDT (199.95% ROI).
- **100% Trade-In Upgrade Value:** When upgrading from P1 ($30) to P3 ($160), the user receives full $30 credit and pays only the $130 difference.

### 5.2.3 Edge Cases & Vulnerabilities
- **Idempotency Verification:** Settle operation checks `generation_logs` for `(unitId, date, 'RECEIVED')` and checks `earnings_ledger` for `DAILY-SETTLE-{unitId}-{date}`. This effectively blocks double-settlement under sequential execution.
- **Concurrent Double-Click Race Condition:** Because balance read (`user.availableBalance`) and balance write (`updateUser`) occur in separate non-atomic SQL queries without `SELECT ... FOR UPDATE` row locks, two concurrent `POST /api/solar/operate` requests arriving simultaneously could execute in parallel before either writes, resulting in double yield credit.

---

## 5.3 Points & Reward Economy Engine (`lib/points-engine/index.ts`)

### 5.3.1 Exported Functions & Signatures
1. `getEfficiencyMultiplier(points: number): number`
   - *Formula:*
     - Points >= 70: `1.0` (100% full generation yield)
     - Points 61–69: `0.8` (80% yield)
     - Points 31–60: `0.5` (50% yield)
     - Points 0–30: `0.1` (10% penalty yield)
2. `adjustPoints(userId, pointsDelta, reason, adminId, adminName): Promise<Result>`
   - Modifies points balance, records `points_ledger` entry (`ADMIN_ADJUSTMENT`), and writes `audit_logs` record.
3. `redeemReward(userId, rewardId): Promise<Result>`
   - Verifies `user.points >= reward.pointsCost`, deducts points, resets user points to 70 baseline, and records `points_ledger` entry (`REDEMPTION`).

### 5.3.2 Business Rules in Plain English
- **70 Points Baseline:** Every new account is seeded with 70 Clean Energy Points.
- **Multiplier Penalty:** If a user's points drop below 70, their daily solar generation earnings are multiplied by the reduced efficiency factor (down to 10% if <= 30 points).
- **Redemption Reset:** Redeeming a physical reward resets user points back to the 70-point baseline.

---

## 5.4 Leadership Rank Progression Engine (`lib/leadership-engine/index.ts`)

### 5.4.1 Tiers & Progression Criteria
| Tier Order | Tier Code | Title | Min Directs | Min Qualified Team | Required Plan | Min Points | Advancement Bonus | Daily Bonus |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `SOLAR_MEMBER` | Solar Member | 0 | 0 | P1 | 70 | $0 | $0 |
| 2 | `SOLAR_BUILDER` | Solar Builder | 3 | 5 | P1 | 70 | $20 | $1.50/day |
| 3 | `ENERGY_COORDINATOR` | Energy Coordinator | 8 | 20 | P2 | 80 | $100 | $5.00/day |
| 4 | `SOLAR_LEADER` | Solar Leader | 15 | 50 | P2 | 85 | $500 | $15.00/day |
| 5 | `GRID_LEADER` | Grid Leader | 30 | 150 | P3 | 90 | $2,000 | $45.00/day |
| 6 | `ENERGY_AMBASSADOR` | Energy Ambassador | 50 | 300 | P3 | 95 | $10,000 | $150.00/day |

### 5.4.2 Exported Functions
1. `evaluateProgress(userId: string): Promise<UserLeadershipProgress | null>`
   - Calculates weighted progress: `directProgress * 0.35 + teamProgress * 0.35 + pointProgress * 0.20 + (planSatisfied ? 100 : 0) * 0.10`.
   - Returns `isEligibleForPromotion = true` if all four thresholds are satisfied.
2. `promoteUser(userId: string): Promise<Result>`
   - Updates `users.leadership_level`, credits advancement bonus (`dailyBonusUsdt * 10`) to wallet, writes CREDIT entry to `earnings_ledger`, logs to `audit_logs`, and sends notification.

---

## 5.5 Withdrawal Processing Engine (`lib/withdrawal-engine/index.ts`)

### 5.5.1 Exported Functions & State Machine
1. `calculateFee(userId, amountUsdt, planCode): Promise<{ feePercent, feeAmountUsdt, netAmountUsdt }>`
   - Looks up active plan: P1 = 0% fee; P2/P3 = 20% fee; default fallback = 10% fee.
2. `requestWithdrawal(userId, amountUsdt, walletAddress, network): Promise<Result>`
   - Validates `amountUsdt >= 10`, checks `availableBalance >= amountUsdt`, debits available balance immediately, inserts `withdrawal_requests` (`status: 'PENDING'`), logs DEBIT to `earnings_ledger`.
3. `processAdminAction(withdrawalId, action, reviewerId, reviewerName, txHash?, adminNotes?): Promise<Result>`
   - Strict State Machine:
     - `APPROVE`: Transitions `PENDING` -> `APPROVED`.
     - `PROCESS`: Transitions `APPROVED` -> `PROCESSING`.
     - `COMPLETE`: Requires `txHash`. Transitions `PROCESSING` / `APPROVED` -> `COMPLETED`.
     - `REJECT`: Blocks transition if already `REJECTED` or `COMPLETED`. Automatically executes refund: `available_balance += amountUsdt`, writes CREDIT entry to `earnings_ledger` (`sourceEvent: 'WITHDRAWAL_REJECTED'`), sets `status = 'REJECTED'`.

### 5.5.2 Vulnerability & Concurrency Analysis
- **Double-Refund Defense:** `processAdminAction` explicitly verifies `if (previousStatus === 'REJECTED' || previousStatus === 'COMPLETED') return error`. This prevents double refund exploitation.
- **Balance Lock on Submission:** Funds are debited immediately upon request submission rather than upon approval, preventing users from spending money that is pending withdrawal.

---

## 5.6 Security Rate Limiter (`lib/security/rate-limiter.ts`)
- **Implementation:** In-memory sliding-window token bucket keyed by client IP (`Map<string, RateLimitRecord>`).
- **Configuration Profiles:**
  - `login`: 10 requests / 60s
  - `signup`: 5 requests / 10m
  - `passwordReset`: 5 requests / 15m
  - `transactionPin`: 5 requests / 15m
  - `withdrawal`: 5 requests / 60s
  - `recharge`: 5 requests / 60s
  - `adminMutation`: 30 requests / 60s
  - `general`: 100 requests / 60s
- **Limitation:** Being an in-memory `Map`, rate limit counters are local to a single Node.js process and reset upon server restart or serverless container cold-starts. In a distributed multi-instance deployment (e.g., Vercel, AWS ECS), Redis (e.g., Upstash) must be used.

---

## 5.7 Authentication, Guards & Transaction PIN (`lib/auth/*`)
- **`lib/auth/guards.ts`:**
  - `getAuthenticatedUser()`: Derives user identity exclusively from Supabase SSR session token.
  - `requireAuthenticatedUser()`: Blocks unauthenticated access (`401`) and banned/suspended accounts (`403`).
  - `requireSuperAdmin()`: Checks `user.role === 'SUPER_ADMIN'`.
  - `enforceUserOwnership()`: Anti-IDOR guard verifying `user.id === resourceOwnerId` unless actor is `SUPER_ADMIN`.
- **`lib/auth/transaction-pin.ts`:**
  - Hashes 4-8 digit numeric PINs using `bcryptjs` with 10 salt rounds.
  - Tracks `failed_login_attempts` and locks account for 15 minutes (`locked_until`) after 5 consecutive failures.

---

## 5.8 Database Service Layer (`lib/supabase/db.ts`)
- **Scope:** 1,566 lines of TypeScript wrapping all Supabase PostgreSQL operations with snake_case <-> camelCase mappers.
- **Architectural Flaw:** Imports `getSupabaseServerClient` from `lib/supabase/server.ts`, which calls `cookies()` from `next/headers`. When imported directly or transitively into Client Components (e.g., `app/dashboard/page.tsx`), Next.js Webpack compilation fails during `next build`.

"""
