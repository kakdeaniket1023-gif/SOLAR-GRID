def generate_section_6():
    return """# 6. DATABASE ARCHITECTURE & RECONSTRUCTED SCHEMA

This section details the PostgreSQL database architecture, migrations, schema definitions, constraints, indexes, Row-Level Security (RLS) policies, and the complete Entity-Relationship diagram.

---

## 6.1 Database Migrations Audit
- **Directory:** `database/migrations/`
- **Audit Finding:** The `database/migrations/` directory is currently **empty**. The entire database DDL is maintained in a single monolithic initialization script: `database/schema.sql`.
- **Production Risk:** Lack of an incremental migration management tool (such as Supabase CLI migrations, Prisma, or Flyway) prevents automated, repeatable schema updates in CI/CD pipelines and increases deployment downtime risk.

---

## 6.2 Reconstructed Full Database Schema (19 Tables)

### Table 1: `users`
- **Purpose:** Primary account entity storing credentials, role, sponsor link, points, and wallet balances.
- **Columns:**
  - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `email` VARCHAR(255) UNIQUE NOT NULL
  - `name` VARCHAR(255) NOT NULL
  - `phone` VARCHAR(50)
  - `country` VARCHAR(100) DEFAULT `'United States'`
  - `avatar_url` TEXT
  - `role` VARCHAR(20) NOT NULL DEFAULT `'USER'` CHECK (`role IN ('USER', 'SUPER_ADMIN')`)
  - `status` VARCHAR(20) NOT NULL DEFAULT `'ACTIVE'` CHECK (`status IN ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED')`)
  - `referral_code` VARCHAR(30) UNIQUE NOT NULL
  - `sponsor_id` UUID REFERENCES `users(id)` ON DELETE SET NULL
  - `leadership_level` VARCHAR(50) NOT NULL DEFAULT `'SOLAR_MEMBER'`
  - `points` INTEGER NOT NULL DEFAULT 70 CHECK (`points >= 0`)
  - `available_balance` NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (`available_balance >= 0`)
  - `total_earned` NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (`total_earned >= 0`)
  - `password_hash` TEXT NOT NULL
  - `transaction_password_hash` TEXT
  - `failed_login_attempts` INTEGER NOT NULL DEFAULT 0
  - `locked_until` TIMESTAMPTZ
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
- **Indexes:** `idx_users_email`, `idx_users_referral_code`, `idx_users_sponsor_id`, `idx_users_role`, `idx_users_status`.

### Table 2: `profiles`
- **Purpose:** Extended member settings, external crypto wallet binding, and notification preferences.
- **Columns:**
  - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `user_id` UUID UNIQUE NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
  - `bio` TEXT
  - `wallet_address` VARCHAR(255)
  - `wallet_network` VARCHAR(20) DEFAULT `'USDT-TRC20'`
  - `wallet_verified` BOOLEAN NOT NULL DEFAULT FALSE
  - `preferred_currency` VARCHAR(10) NOT NULL DEFAULT `'USDT'`
  - `two_factor_enabled` BOOLEAN NOT NULL DEFAULT FALSE
  - `email_notifications` BOOLEAN NOT NULL DEFAULT TRUE
  - `push_notifications` BOOLEAN NOT NULL DEFAULT TRUE
  - `telegram_handle` VARCHAR(100)
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
- **Indexes:** `idx_profiles_user_id`.

### Table 3: `user_sessions`
- **Purpose:** Device tracking, IP audit, and session revocation registry.
- **Columns:**
  - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `session_token` VARCHAR(255) UNIQUE NOT NULL
  - `user_id` UUID NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
  - `user_name` VARCHAR(255) NOT NULL
  - `user_email` VARCHAR(255) NOT NULL
  - `role` VARCHAR(20) NOT NULL DEFAULT `'USER'`
  - `login_time` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
  - `last_activity` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
  - `logout_time` TIMESTAMPTZ
  - `ip_address` VARCHAR(50) NOT NULL DEFAULT `'127.0.0.1'`
  - `device_type` VARCHAR(50) NOT NULL DEFAULT `'Desktop'`
  - `operating_system` VARCHAR(100) NOT NULL DEFAULT `'Windows'`
  - `browser` VARCHAR(100) NOT NULL DEFAULT `'Chrome'`
  - `user_agent` TEXT NOT NULL DEFAULT `''`
  - `location` VARCHAR(150) NOT NULL DEFAULT `'Unknown'`
  - `session_status` VARCHAR(20) NOT NULL DEFAULT `'ACTIVE'` CHECK (`session_status IN ('ACTIVE', 'REVOKED', 'EXPIRED')`)
  - `risk_score` VARCHAR(20) NOT NULL DEFAULT `'LOW'` CHECK (`risk_score IN ('LOW', 'MEDIUM', 'HIGH')`)
  - `login_method` VARCHAR(50) NOT NULL DEFAULT `'PASSWORD'`
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
- **Indexes:** `idx_user_sessions_token`, `idx_user_sessions_user_id`, `idx_user_sessions_status`.

### Table 4: `solar_projects`
- **Purpose:** Physical utility-scale photovoltaic farm infrastructure specifications.
- **Columns:** `id`, `name`, `description`, `location`, `total_capacity_mw`, `current_output_mw`, `efficiency_percent`, `operational_status`, `grid_connection`, `image_url`, `commissioned_date`, `co2_offset_tonnes`, `active_investors_count`, `display_order`, `created_at`.

### Table 5: `solar_plans`
- **Purpose:** Commercial investment plans catalog (P1, P2, P3).
- **Columns:** `id`, `code` (UNIQUE), `name`, `description`, `price_usdt`, `validity_days`, `working_days_total`, `daily_earning_usdt`, `gross_earning_usdt`, `withdrawal_fee_percent`, `net_after_fee_usdt`, `capacity_kw`, `image_url`, `features` (JSONB), `status`, `project_location`, `display_order`, `created_at`.
- **Indexes:** `idx_solar_plans_code`.

### Table 6: `solar_units`
- **Purpose:** User-owned solar hardware instances tracking lifecycle, working days, and today's yield status.
- **Columns:**
  - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `user_id` UUID NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
  - `plan_id` UUID NOT NULL REFERENCES `solar_plans(id)`
  - `plan_code` VARCHAR(20) NOT NULL
  - `plan_name` VARCHAR(255) NOT NULL
  - `project_id` UUID NOT NULL REFERENCES `solar_projects(id)`
  - `project_name` VARCHAR(255) NOT NULL
  - `location` VARCHAR(255) NOT NULL
  - `capacity_kw` NUMERIC(10, 2) NOT NULL
  - `purchase_date` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
  - `expiry_date` TIMESTAMPTZ NOT NULL
  - `purchase_price_usdt` NUMERIC(14, 4) NOT NULL
  - `status` VARCHAR(20) NOT NULL DEFAULT `'ACTIVE'` CHECK (`status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'UPGRADED', 'MAINTENANCE')`)
  - `working_days_completed` INTEGER NOT NULL DEFAULT 0
  - `working_days_total` INTEGER NOT NULL DEFAULT 43
  - `total_earned_usdt` NUMERIC(14, 4) NOT NULL DEFAULT 0.0000
  - `today_earned_usdt` NUMERIC(14, 4) NOT NULL DEFAULT 0.0000
  - `last_operated_date` VARCHAR(20)
  - `is_receivable` BOOLEAN NOT NULL DEFAULT FALSE
  - `receivable_amount_usdt` NUMERIC(14, 4) NOT NULL DEFAULT 0.0000
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
- **Indexes:** `idx_solar_units_user_id`, `idx_solar_units_status`.

### Table 7: `generation_logs`
- **Purpose:** Daily solar energy generation records and efficiency logs.
- **Columns:** `id`, `unit_id` (FK), `user_id` (FK), `plan_code`, `generation_date`, `kwh_generated`, `performance_ratio`, `base_earning_usdt`, `points_multiplier`, `actual_earning_usdt`, `operational_status`, `status`, `started_at`, `received_at`.
- **Constraints:** `CONSTRAINT unq_unit_generation_date UNIQUE (unit_id, generation_date)`.
- **Indexes:** `idx_generation_logs_user_id`, `idx_generation_logs_date`.

### Table 8: `earnings_ledger`
- **Purpose:** Immutable double-entry financial ledger recording all balance modifications.
- **Columns:**
  - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `transaction_id` VARCHAR(100) UNIQUE NOT NULL
  - `idempotency_key` VARCHAR(255) UNIQUE
  - `user_id` UUID NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
  - `type` VARCHAR(50) NOT NULL
  - `amount` NUMERIC(14, 4) NOT NULL
  - `direction` VARCHAR(10) NOT NULL CHECK (`direction IN ('CREDIT', 'DEBIT')`)
  - `balance_before` NUMERIC(14, 4) NOT NULL
  - `balance_after` NUMERIC(14, 4) NOT NULL
  - `source_event` VARCHAR(100) NOT NULL
  - `reference_id` VARCHAR(100) NOT NULL
  - `description` TEXT NOT NULL
  - `actor` VARCHAR(255) NOT NULL DEFAULT `'SYSTEM'`
  - `status` VARCHAR(20) NOT NULL DEFAULT `'COMPLETED'`
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT `NOW()`
- **Indexes:** `idx_earnings_ledger_user_id`, `idx_earnings_ledger_created_at`, `idx_earnings_ledger_type`.

### Table 9: `recharge_requests`
- **Purpose:** Crypto deposit requests and admin verification queue.
- **Columns:** `id`, `recharge_id` (UNIQUE), `user_id` (FK), `user_name`, `user_email`, `amount_usdt`, `network`, `deposit_address`, `tx_hash` (UNIQUE), `status`, `proof_image_url`, `reviewer_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`.
- **Indexes:** `idx_recharge_requests_user_id`, `idx_recharge_requests_status`, `idx_recharge_requests_tx_hash`.

### Table 10: `withdrawal_requests`
- **Purpose:** Member withdrawal requests, fee deductions, and payout fulfillment queue.
- **Columns:** `id`, `withdrawal_id` (UNIQUE), `user_id` (FK), `user_name`, `user_email`, `amount_usdt`, `fee_percent`, `fee_amount_usdt`, `net_amount_usdt`, `wallet_address`, `network`, `status`, `tx_hash`, `rejection_reason`, `refunded`, `reviewer_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`.
- **Indexes:** `idx_withdrawal_requests_user_id`, `idx_withdrawal_requests_status`.

### Tables 11–19: Supporting Entities
- `points_ledger` (Points credit/debit audit trail)
- `referral_relationships` (Direct and multi-tier upline mapping)
- `referral_commissions` (Commission distribution log with idempotency keys)
- `leadership_levels` (Rank configuration and thresholds)
- `notifications` (User in-app notifications and alerts)
- `support_tickets` & `support_messages` (Customer support ticketing threads)
- `audit_logs` (System security and administrative audit trail)
- `business_rules` (Dynamic system parameters stored in JSONB)
- `rewards` & `reward_redemptions` (Milestone rewards catalog and physical redemption records)

---

## 6.3 Row-Level Security (RLS) Policy Audit

| Table Name | RLS Enabled? | Policies Defined | Security Evaluation |
| :--- | :---: | :--- | :--- |
| `users` | Yes | Missing user-facing select policy in `schema.sql` | **RISK:** Relies on server-side Supabase client with service role key. |
| `profiles` | Yes | `Users can view own profile`, `Users can update own profile` | Properly isolated by `auth.uid() = user_id`. |
| `user_sessions` | Yes | No user-facing select policy | Secure server-side isolation. |
| `solar_projects` | Yes | `Public can view active solar projects` | Safe public read. |
| `solar_plans` | Yes | `Public can view active solar plans` | Safe public read. |
| `solar_units` | Yes | `Users can view own units` | Properly isolated by `auth.uid() = user_id`. |
| `generation_logs` | Yes | `Users can view own logs` | Properly isolated by `auth.uid() = user_id`. |
| `earnings_ledger` | Yes | `Users can view own ledger` | Properly isolated by `auth.uid() = user_id`. |
| `recharge_requests` | Yes | `Users can view own recharges` | Properly isolated by `auth.uid() = user_id`. |
| `withdrawal_requests` | Yes | `Users can view own withdrawals` | Properly isolated by `auth.uid() = user_id`. |
| `points_ledger` | Yes | `Users can view own points` | Properly isolated by `auth.uid() = user_id`. |
| `notifications` | Yes | `Users can view own notifications`, `Users can update own notifications` | Properly isolated by `auth.uid() = user_id`. |
| `support_tickets` | Yes | `Users can view own tickets` | Properly isolated by `auth.uid() = user_id`. |
| `reward_redemptions`| Yes | `Users can view own redemptions` | Properly isolated by `auth.uid() = user_id`. |

---

## 6.4 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ profiles : "has profile"
    users ||--o{ user_sessions : "creates sessions"
    users ||--o{ solar_units : "owns hardware"
    users ||--o{ earnings_ledger : "has ledger entries"
    users ||--o{ recharge_requests : "submits recharges"
    users ||--o{ withdrawal_requests : "requests withdrawals"
    users ||--o{ points_ledger : "earns/spends points"
    users ||--o{ notifications : "receives alerts"
    users ||--o{ support_tickets : "opens tickets"
    users ||--o{ reward_redemptions : "redeems rewards"
    users ||--o{ users : "sponsors (upline/downline)"

    solar_plans ||--o{ solar_units : "instantiates"
    solar_projects ||--o{ solar_units : "hosts array"

    solar_units ||--o{ generation_logs : "records daily yield"
    support_tickets ||--o{ support_messages : "contains messages"
    rewards ||--o{ reward_redemptions : "redeemed in"

    users {
        uuid id PK
        string email UK
        string name
        string role
        string status
        string referral_code UK
        uuid sponsor_id FK
        string leadership_level
        int points
        numeric available_balance
        numeric total_earned
        text password_hash
        text transaction_password_hash
    }

    solar_units {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        string plan_code
        uuid project_id FK
        numeric capacity_kw
        numeric purchase_price_usdt
        string status
        int working_days_completed
        numeric total_earned_usdt
        boolean is_receivable
    }

    earnings_ledger {
        uuid id PK
        string transaction_id UK
        string idempotency_key UK
        uuid user_id FK
        string type
        numeric amount
        string direction
        numeric balance_before
        numeric balance_after
    }

    withdrawal_requests {
        uuid id PK
        string withdrawal_id UK
        uuid user_id FK
        numeric amount_usdt
        numeric fee_percent
        numeric net_amount_usdt
        string wallet_address
        string status
        string tx_hash
    }

    recharge_requests {
        uuid id PK
        string recharge_id UK
        uuid user_id FK
        numeric amount_usdt
        string tx_hash UK
        string status
    }
```

"""
