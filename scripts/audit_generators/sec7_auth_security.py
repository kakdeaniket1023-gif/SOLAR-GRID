def generate_section_7():
    return """# 7. AUTHENTICATION & SECURITY AUDIT

This section provides a rigorous security review across authentication mechanisms, password management, role privilege separation, OWASP Top 10 vulnerabilities, and hardcoded secret detection.

---

## 7.1 Authentication Architecture & Session Lifecycle

### 7.1.1 Session Management
- **Mechanisms:** Dual-layer authentication utilizing `@supabase/ssr` cookie-based JWT sessions alongside application-level `user_sessions` tracking.
- **Middleware Flow (`middleware.ts` & `lib/supabase/middleware.ts`):**
  1. Requests intercept Edge middleware.
  2. `supabase.auth.getUser()` verifies JWT validity from request cookies.
  3. If invalid/missing and route starts with `/dashboard` or `/admin`, redirects to `/login?redirect=...`.
- **CRITICAL EDGE MIDDLEWARE DEFECT:**
  - `lib/supabase/middleware.ts` checks:
    ```typescript
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (!user) {
        // redirects to login
      }
    }
    ```
  - **The middleware checks ONLY for existence of ANY authenticated user session, NOT whether `user.role === 'SUPER_ADMIN'`!**
  - While server-side API handlers (`/api/admin/*`) perform a secondary check using `requireSuperAdmin()`, the Edge router permits any normal logged-in user to navigate to `/admin` pages in the browser.

---

## 7.2 Password Handling & Transaction PIN Security

### 7.2.1 Login Passwords
- **Algorithm:** Supabase Auth manages primary user passwords with industry-standard Bcrypt/Argon2 hashing.
- **Client Transmission:** Passwords sent over HTTPS in JSON payload; no client-side plaintext storage.
- **Validation:** Minimum 6 characters enforced server-side with Zod.

### 7.2.2 6-Digit Transaction PIN
- **Algorithm:** Uses `bcryptjs` with 10 salt rounds (`bcrypt.hash(pin, 10)`).
- **Enforcement:** Mandatory on `/api/withdrawals/request` and `/api/auth/transaction-password`.
- **Lockout Mechanism:** Tracks `failed_login_attempts`. After 5 consecutive failures, sets `locked_until = now + 15 minutes` and returns HTTP `423 Locked`. Resets counter upon successful verification.

---

## 7.3 Privilege Separation (Admin vs Regular User)

| Resource / Action | Regular User Access | Super Admin Access | Protection Mechanism | Security Verdict |
| :--- | :---: | :---: | :--- | :--- |
| View `/dashboard/*` | Allowed | Allowed | `requireUser()` | ✅ PASS |
| View `/admin/*` Pages | Bypasses Middleware! | Allowed | Edge Middleware lacks role check | ⚠️ HIGH RISK |
| Call `/api/admin/*` APIs | Blocked (403) | Allowed | `requireSuperAdmin()` | ✅ PASS |
| Call `/api/mlm/stats` | **OPEN (Public)** | Allowed | **NO GUARD APPLIED** | ❌ CRITICAL FAIL |
| Query Another User's Records | Blocked (403) | Allowed | `enforceUserOwnership()` | ✅ PASS |
| Manual Points/Balance Adjustment | Blocked (403) | Allowed | `requireSuperAdmin()` | ✅ PASS |

---

## 7.4 OWASP Top 10 (2021/2026) Vulnerability Assessment

| Vulnerability Category | Status | Evidence from Codebase | Risk & Recommendation |
| :--- | :---: | :--- | :--- |
| **A01: Broken Access Control** | **FAIL** | 1. `lib/supabase/middleware.ts` allows any authenticated user into `/admin` UI.<br>2. `app/api/mlm/stats/route.ts` is unauthenticated and exposes any user's downline tree via `?userId=`. | Fix middleware to check `user.role === 'SUPER_ADMIN'`; add `requireUser()` to `/api/mlm/stats`. |
| **A02: Cryptographic Failures** | **FAIL** | 1. Full Supabase Service Role Key is hardcoded/committed in `.env`.<br>2. Live Anon Key is hardcoded as fallback in `lib/supabase/server.ts` and `lib/supabase/middleware.ts`. | Rotate keys immediately in Supabase; remove all hardcoded JWT fallback strings. |
| **A03: Injection (SQL / NoSQL / Command)** | **PASS** | Supabase JS client utilizes parameterized PostgreSQL queries via PostgREST. No raw string interpolation into SQL queries. | Safe. Continue using parameterized ORM methods. |
| **A04: Insecure Design** | **WARNING** | Recharge deposits rely on manual TX hash entry without automated on-chain webhook/oracle verification (e.g., TRONGrid/Alchemy). | Add automated blockchain verification to eliminate fraudulent submission spam. |
| **A05: Security Misconfiguration** | **FAIL** | 1. `next.config.mjs` has wildcard image remote pattern `hostname: "**"` (SSRF risk).<br>2. Missing all standard security headers (CSP, HSTS, X-Frame-Options). | Configure explicit image domains and add HTTP security headers in `next.config.mjs`. |
| **A06: Vulnerable & Outdated Components** | **WARNING** | Vitest test runner has startup incompatibility with Node.js ESM modules (`ERR_REQUIRE_ESM`). | Upgrade Vitest/Vite configuration. |
| **A07: Identification & Auth Failures** | **PASS** | Passwordless login eliminated; bcrypt transaction PIN with 5-attempt / 15-minute lockout enforced. | Compliant. |
| **A08: Software & Data Integrity Failures** | **PASS** | Subresource integrity and npm lockfile `package-lock.json` present. | Compliant. |
| **A09: Security Logging & Monitoring** | **PASS** | `audit_logs` table records all admin actions, IP addresses, targets, and reasons. | Compliant. |
| **A10: Server-Side Request Forgery (SSRF)** | **WARNING** | `next.config.mjs` allows Next.js image proxy to fetch from any external URL. | Restrict allowed image origins. |

---

## 7.5 Hardcoded Secrets & Repository Exposure Audit

| Secret / Identifier | Location | Exposure Type | Severity | Remediation Required |
| :--- | :--- | :--- | :---: | :--- |
| **Supabase Service Role Key** | `/.env` line 6 | Plaintext in local environment file | **P0 CRITICAL** | Rotate in Supabase Console; ensure `.env` is in `.gitignore`. |
| **Supabase Anon Key Fallback** | `/lib/supabase/middleware.ts:5`, `/lib/supabase/server.ts:5` | Hardcoded plaintext string in code | **P0 CRITICAL** | Remove hardcoded strings; fail loudly if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is undefined. |
| **Supabase Project URL** | `/lib/supabase/middleware.ts:4`, `/lib/supabase/server.ts:4` | Hardcoded fallback URL in code | **MEDIUM** | Remove hardcoded fallback; read strictly from environment. |
| **Demo User Passwords** | `/scripts/seed-demo-users.ts:64,110` | Hardcoded demo credentials (`adminPass123`, `password123`) | **LOW** | Ensure demo seed scripts are excluded from production builds. |

"""
