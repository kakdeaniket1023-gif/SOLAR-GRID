def generate_section_4():
    return """# 4. EVERY API ROUTE (ALL 33 ROUTES UNDER `app/api/`)

This section provides an exhaustive contract, security, database interaction, and idempotency audit for all 33 API routes in the SolarGrid platform.

---

## 4.1 Administrative API Routes (`app/api/admin/*`)

### 4.1.1 `POST /api/admin/broadcast`
- **HTTP Method:** `POST`
- **File Location:** `app/api/admin/broadcast/route.ts`
- **Request Contract:**
  - Headers: `Content-Type: application/json`, Supabase Session Cookie.
  - Body: `{ title: string (required), message: string (required), targetAudience?: 'ALL_USERS' | 'ACTIVE_PLAN_HOLDERS' | 'LEADERS_ONLY' }`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string, count: number }`
  - `400 Bad Request`: `{ success: false, message: 'Title and message are required' }`
  - `401 / 403`: `{ success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`. Rejects anonymous requests with `401` and non-super-admin users with `403`.
- **Rate Limiting:** Not applied. Should apply `RATE_LIMIT_CONFIGS.adminMutation`.
- **DB Operations:** Queries `users` and `solar_units`; performs bulk inserts into `notifications`; inserts audit record into `audit_logs`.
- **Idempotency & Concurrency:** Repeated calls dispatch multiple notifications.
- **Flow:**
  ```mermaid
  sequenceDiagram
    Admin ->> API: POST /api/admin/broadcast
    API ->> Guards: requireSuperAdmin()
    Guards -->> API: Authorized SuperAdmin
    API ->> DB: Query matching users by targetAudience
    API ->> DB: Insert notifications for each user
    API ->> DB: Log to audit_logs
    API -->> Admin: 200 OK (count)
  ```

---

### 4.1.2 `GET /api/admin/ledger`
- **HTTP Method:** `GET`
- **File Location:** `app/api/admin/ledger/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:**
  - `200 OK`: `{ success: true, ledger: EarningsLedgerEntry[] }`
  - `401 / 403`: `{ success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **Rate Limiting:** None.
- **DB Operations:** Reads all records from `earnings_ledger` ordered by `created_at DESC`.
- **Finding:** Lacks server-side pagination; querying entire ledger in a large production system will exhaust memory.

---

### 4.1.3 `GET / POST /api/admin/panel-images`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/admin/panel-images/route.ts`
- **Request Contract:**
  - `GET`: Returns list of configured panel images.
  - `POST`: `{ planCode: string (required), imageUrl: string (required), caption?: string }`
- **Response Contract:**
  - `GET 200`: `{ success: true, images: PanelImageConfig[] }`
  - `POST 200`: `{ success: true, message: string, image: PanelImageConfig }`
  - `400 Bad Request`: `{ success: false, message: 'planCode and imageUrl are required' }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Updates `solar_plans.image_url` where `code = planCode`.

---

### 4.1.4 `GET / POST /api/admin/recharges`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/admin/recharges/route.ts`
- **Request Contract:**
  - `GET`: Query params: `?status=PENDING|APPROVED|REJECTED`
  - `POST`: `{ rechargeId: string (required), action: 'APPROVE' | 'REJECT' (required), adminNotes?: string }`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string, record: RechargeRecord }`
  - `400 Bad Request`: `{ success: false, message: 'rechargeId and valid action are required' }`
  - `401 / 403`: Forbidden / Unauthorized.
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations & Financial Atomicity:**
  - On `APPROVE`: Fetches `recharge_requests`, checks `status === 'PENDING'`, updates `users.available_balance += amountUsdt`, writes CREDIT entry to `earnings_ledger`, updates `recharge_requests.status = 'APPROVED'`, inserts user notification.
  - **Critical Financial Vulnerability:** Balance update, ledger insertion, and recharge status update are executed in separate async calls rather than a single atomic PostgreSQL transaction. If one call fails, balance could be credited without status update.

---

### 4.1.5 `GET / POST /api/admin/rules`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/admin/rules/route.ts`
- **Request Contract:**
  - `GET`: Returns system dynamic business rules.
  - `POST`: `{ key: string (required), value: any (required) }`
- **Response Contract:**
  - `GET 200`: `{ success: true, rules: BusinessRule[] }`
  - `POST 200`: `{ success: true, message: 'Rule updated successfully' }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Updates `business_rules.value` and inserts into `audit_logs`.

---

### 4.1.6 `GET /api/admin/search`
- **HTTP Method:** `GET`
- **File Location:** `app/api/admin/search/route.ts`
- **Request Contract:** Query params: `?q=search_term`
- **Response Contract:** `200 OK`: `{ success: true, results: { users, withdrawals, recharges } }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Reads users, withdrawals, recharges from Supabase and filters in-memory.

---

### 4.1.7 `GET /api/admin/stats`
- **HTTP Method:** `GET`
- **File Location:** `app/api/admin/stats/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:** `200 OK`: `{ success: true, stats: { totalUsers, totalUnits, totalEarningsUsdt, pendingRecharges, pendingWithdrawals, auditLogs, ... } }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Aggregates statistics across `users`, `solar_units`, `earnings_ledger`, `recharge_requests`, `withdrawal_requests`, and `audit_logs`.

---

### 4.1.8 `GET /api/admin/units`
- **HTTP Method:** `GET`
- **File Location:** `app/api/admin/units/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:** `200 OK`: `{ success: true, units: SolarUnit[] }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Reads all records from `solar_units`.

---

### 4.1.9 `GET / POST /api/admin/users`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/admin/users/route.ts`
- **Request Contract:**
  - `GET`: Query params: `?id=userId` (returns single user) or empty (returns all users).
  - `POST`: `{ userId: string (required), role?: 'USER' | 'SUPER_ADMIN', status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED', availableBalance?: number, points?: number, reason?: string }`
- **Response Contract:**
  - `GET 200`: `{ success: true, users: User[] }` or `{ success: true, user: User }`
  - `POST 200`: `{ success: true, message: string, user: User }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Updates `users` table; logs changes to `audit_logs`.

---

### 4.1.10 `GET / POST /api/admin/withdrawals`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/admin/withdrawals/route.ts`
- **Request Contract:**
  - `GET`: Returns all platform withdrawal requests.
  - `POST`: `{ withdrawalId: string (required), action: 'APPROVE' | 'PROCESS' | 'COMPLETE' | 'REJECT', txHash?: string, adminNotes?: string }`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string, request: WithdrawalRequest }`
  - `400 Bad Request`: `{ success: false, message: string }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Invokes `WithdrawalService.processAdminAction()`.

---

## 4.2 Authentication & User API Routes (`app/api/auth/*`)

### 4.2.1 `POST /api/auth/login`
- **HTTP Method:** `POST`
- **File Location:** `app/api/auth/login/route.ts`
- **Request Contract:**
  - Schema: `z.object({ email: z.string().email(), password: z.string().min(6) })`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: 'Login successful', user, profile }`
  - `400 Bad Request`: `{ success: false, error: 'VALIDATION_ERROR', message: string }`
  - `401 Unauthorized`: `{ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }`
  - `429 Too Many Requests`: `{ success: false, error: 'RATE_LIMITED', message: string }`
- **Auth & RBAC:** Public. Uses `checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.login)`.
- **DB Operations:** Calls `supabase.auth.signInWithPassword({ email, password })`; logs active session.

---

### 4.2.2 `POST /api/auth/logout`
- **HTTP Method:** `POST`
- **File Location:** `app/api/auth/logout/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:** `200 OK`: `{ success: true, message: 'Logged out successfully' }`
- **DB Operations:** Calls `supabase.auth.signOut()`.

---

### 4.2.3 `GET / PATCH /api/auth/me`
- **HTTP Methods:** `GET`, `PATCH`
- **File Location:** `app/api/auth/me/route.ts`
- **Request Contract:**
  - `GET`: Returns authenticated user and profile.
  - `PATCH`: `{ name?: string, phone?: string, bio?: string, walletAddress?: string, walletNetwork?: string, twoFactorEnabled?: boolean }`
- **Response Contract:**
  - `200 OK`: `{ success: true, user: User, profile: Profile }`
  - `401 Unauthorized`: `{ success: false, error: 'UNAUTHORIZED', message: string }`
- **Auth & RBAC:** Protected by `requireUser()`. IDOR prevented by deriving identity strictly from session.
- **DB Operations:** Reads/updates `users` and `profiles` tables.

---

### 4.2.4 `POST /api/auth/password`
- **HTTP Method:** `POST`
- **File Location:** `app/api/auth/password/route.ts`
- **Request Contract:**
  - Schema: `z.object({ currentPassword: z.string().min(6).optional(), newPassword: z.string().min(6) })`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: 'Password updated successfully' }`
  - `400 / 401`: Validation / Auth error.
- **Auth & RBAC:** Protected by `requireUser()` and rate-limited.
- **DB Operations:** Calls `supabase.auth.updateUser({ password: newPassword })` and inserts `audit_logs` record.

---

### 4.2.5 `GET / POST /api/auth/sessions`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/auth/sessions/route.ts`
- **Request Contract:**
  - `GET`: Returns user active sessions.
  - `POST`: `{ sessionId: string (required), action: 'REVOKE' | 'REVOKE_ALL' }`
- **Response Contract:** `200 OK`: `{ success: true, sessions: UserSession[] }`
- **Auth & RBAC:** Protected by `requireUser()`.

---

### 4.2.6 `POST /api/auth/signup`
- **HTTP Method:** `POST`
- **File Location:** `app/api/auth/signup/route.ts`
- **Request Contract:**
  - Schema: `z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6), referralCode: z.string().optional() })`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: 'Account created successfully', user: User }`
  - `400 Bad Request`: Validation failure or existing email.
- **Auth & RBAC:** Public. Rate-limited via `RATE_LIMIT_CONFIGS.signup`.
- **DB Operations:**
  1. Checks if email already exists.
  2. Resolves sponsor if referral code provided.
  3. Creates user in `users` table with 70 starting points.
  4. Creates default profile in `profiles` table.
  5. Inserts initial entry in `points_ledger`.
  6. Creates user in Supabase Auth.

---

### 4.2.7 `POST /api/auth/transaction-password`
- **HTTP Method:** `POST`
- **File Location:** `app/api/auth/transaction-password/route.ts`
- **Request Contract:**
  - Schema: `z.object({ action: z.enum(['SET', 'VERIFY']), pin: z.string().min(4).max(8) })`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string }`
  - `401 / 423`: Incorrect PIN / Account Locked.
- **Auth & RBAC:** Protected by `requireAuthenticatedUser()`.
- **DB Operations:** Invokes `verifyUserTransactionPin` or `setUserTransactionPin` with Bcrypt hashing and lockout tracking.

---

## 4.3 Dashboard & Leadership API Routes

### 4.3.1 `GET /api/dashboard/overview`
- **HTTP Method:** `GET`
- **File Location:** `app/api/dashboard/overview/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:** `200 OK`: `{ success: true, user, profile, units, recentLogs, ledger, unreadNotificationsCount, schedule, serverTime }`
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Reads user profile, active solar units, generation logs, earnings ledger, and unread notification count.

---

### 4.3.2 `GET /api/leadership/progress`
- **HTTP Method:** `GET`
- **File Location:** `app/api/leadership/progress/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:** `200 OK`: `{ success: true, progress: UserLeadershipProgress }`
- **Auth & RBAC:** Protected by `requireUser()`. IDOR safe.
- **DB Operations:** Invokes `LeadershipService.evaluateProgress(auth.user.id)`.

---

### 4.3.3 `POST /api/leadership/promote`
- **HTTP Method:** `POST`
- **File Location:** `app/api/leadership/promote/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie. Optional `{ userId?: string }` for SuperAdmin override.
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string, newLevel: LeadershipTier, user: User }`
  - `400 Bad Request`: Requirements not met.
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Invokes `LeadershipService.promoteUser()`.

---

## 4.4 MLM & Points API Routes

### 4.4.1 `GET /api/mlm/stats`
- **HTTP Method:** `GET`
- **File Location:** `app/api/mlm/stats/route.ts`
- **Request Contract:** Query params: `?userId=userId`
- **Response Contract:** `200 OK`: `{ success: true, stats: ... }`
- **CRITICAL SECURITY VULNERABILITY:**
  1. **UNPROTECTED ENDPOINT:** Missing `requireUser()` guard completely.
  2. **MISSING AWAIT BUG:** `MLMService.getNetworkStats(userId)` is async but called without `await`. Returns an unresolved Promise object `{}` in JSON.
  3. **INFORMATION DISCLOSURE:** Any anonymous actor can pass any user's ID and query their downline hierarchy.

---

### 4.4.2 `GET /api/mlm/tree`
- **HTTP Method:** `GET`
- **File Location:** `app/api/mlm/tree/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:** `200 OK`: `{ success: true, tree: MLMNode }`
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Reads user downlines up to 3 levels deep and builds nested tree structure.

---

### 4.4.3 `POST /api/points/adjust`
- **HTTP Method:** `POST`
- **File Location:** `app/api/points/adjust/route.ts`
- **Request Contract:** `{ userId: string (required), pointsDelta: number (required), reason: string (required, min 5 chars) }`
- **Response Contract:** `200 OK`: `{ success: true, message: string, entry: PointsLedgerEntry }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Invokes `PointsService.adjustPoints()`, writes to `points_ledger` and `audit_logs`.

---

### 4.4.4 `POST /api/points/redeem`
- **HTTP Method:** `POST`
- **File Location:** `app/api/points/redeem/route.ts`
- **Request Contract:** `{ rewardId: string (required) }`
- **Response Contract:** `200 OK`: `{ success: true, message: string }`
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Invokes `PointsService.redeemReward()`.

---

## 4.5 Recharge & Solar API Routes

### 4.5.1 `GET /api/recharge/list`
- **HTTP Method:** `GET`
- **File Location:** `app/api/recharge/list/route.ts`
- **Request Contract:** Headers: Supabase Session Cookie.
- **Response Contract:** `200 OK`: `{ success: true, recharges: RechargeRecord[] }`
- **Auth & RBAC:** Protected by `requireUser()`. Returns authenticated user's records.

---

### 4.5.2 `POST /api/recharge/submit`
- **HTTP Method:** `POST`
- **File Location:** `app/api/recharge/submit/route.ts`
- **Request Contract:**
  - Schema: `z.object({ amountUsdt: z.number().min(10), currency: z.string().optional(), destinationAddress: z.string().min(10), txReference: z.string().min(8), proofImageUrl: z.string().optional() })`
- **Response Contract:** `200 OK`: `{ success: true, message: 'Recharge request submitted successfully', recharge: RechargeRecord }`
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Inserts record into `recharge_requests` with `status: 'PENDING'`.

---

### 4.5.3 `GET / POST /api/solar/operate`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/solar/operate/route.ts`
- **Request Contract:**
  - `GET`: Returns schedule status (`isOperatingDay`, `status`, `progressPercent`).
  - `POST`: `{ unitId: string (required), action: 'START' | 'RECEIVE' | 'SETTLE' (required) }`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string, creditedAmount?: number, balanceAfter?: number }`
  - `400 Bad Request`: Unit not found, weekend, or already settled.
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Updates `generation_logs`, `solar_units`, writes CREDIT entry to `earnings_ledger`, updates `users.available_balance`. Triggers `MLMService.distributeCommissions()`.

---

### 4.5.4 `GET / POST /api/solar/plans`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/solar/plans/route.ts`
- **Request Contract:**
  - `GET`: Public. Returns active solar plans.
  - `POST`: SuperAdmin only. Updates solar plan parameters.
- **Response Contract:**
  - `GET 200`: `{ success: true, plans: SolarPlan[] }`
  - `POST 200`: `{ success: true, message: string, plan: SolarPlan }`
- **Auth & RBAC:** `GET` is public; `POST` is protected by `requireSuperAdmin()`.

---

### 4.5.5 `POST /api/solar/purchase`
- **HTTP Method:** `POST`
- **File Location:** `app/api/solar/purchase/route.ts`
- **Request Contract:** Schema: `z.object({ planCode: z.string().min(2) })`
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string, unit: SolarUnit }`
  - `400 Bad Request`: Insufficient balance or invalid plan.
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Invokes `SolarGenerationService.purchasePlan()`. Debits `available_balance`, writes DEBIT entry to `earnings_ledger`, inserts new record into `solar_units`.

---

### 4.5.6 `POST /api/solar/upgrade`
- **HTTP Method:** `POST`
- **File Location:** `app/api/solar/upgrade/route.ts`
- **Request Contract:** `{ unitId: string (required), targetPlanCode: string (required) }`
- **Response Contract:** `200 OK`: `{ success: true, message: string, unit: SolarUnit, topUpCostUsdt: number }`
- **Auth & RBAC:** Protected by `requireUser()`.
- **DB Operations:** Invokes `SolarUpgradeService.executeUpgrade()`.

---

## 4.6 Support & Withdrawal API Routes

### 4.6.1 `GET / POST /api/support/tickets`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/support/tickets/route.ts`
- **Request Contract:**
  - `GET`: Returns user's support tickets with messages.
  - `POST`: `{ category?: string, priority?: string, subject: string (required), message: string (required) }`
- **Response Contract:** `200 OK`: `{ success: true, tickets: SupportTicket[] }` / `{ success: true, ticket: SupportTicket }`
- **Auth & RBAC:** Protected by `requireUser()`. Anti-IDOR enforced.
- **DB Operations:** Inserts into `support_tickets` and `support_messages`.

---

### 4.6.2 `POST /api/withdrawals/process`
- **HTTP Method:** `POST`
- **File Location:** `app/api/withdrawals/process/route.ts`
- **Request Contract:** `{ withdrawalId: string (required), action: 'APPROVE' | 'PROCESS' | 'COMPLETE' | 'REJECT' (required), txHash?: string, adminNotes?: string }`
- **Response Contract:** `200 OK`: `{ success: true, message: string, request: WithdrawalRequest }`
- **Auth & RBAC:** Protected by `requireSuperAdmin()`.
- **DB Operations:** Invokes `WithdrawalService.processAdminAction()`. On `REJECT`, automatically executes balance refund and writes ledger entry.

---

### 4.6.3 `GET / POST /api/withdrawals/request`
- **HTTP Methods:** `GET`, `POST`
- **File Location:** `app/api/withdrawals/request/route.ts`
- **Request Contract:**
  - `GET`: Returns user's historical withdrawal requests.
  - `POST`: Schema:
    ```typescript
    z.object({
      amountUsdt: z.number().min(10),
      walletAddress: z.string().min(10),
      network: z.string().default('USDT-TRC20'),
      transactionPin: z.string().min(4),
    })
    ```
- **Response Contract:**
  - `200 OK`: `{ success: true, message: string, request: WithdrawalRequest }`
  - `400 Bad Request`: Validation failure or insufficient balance.
  - `401 Unauthorized`: Invalid transaction PIN.
  - `423 Locked`: Account temporarily locked due to failed PIN attempts.
  - `429 Too Many Requests`: Rate limit exceeded.
- **Auth & RBAC:** Protected by `requireAuthenticatedUser()`. Rate-limited.
- **DB Operations:** Verifies PIN via Bcrypt, debits `users.available_balance`, writes DEBIT entry to `earnings_ledger`, inserts record into `withdrawal_requests`.

"""
