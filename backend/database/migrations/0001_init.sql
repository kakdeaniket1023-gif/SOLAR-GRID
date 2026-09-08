-- ============================================================================
-- SOLARGRID PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- ============================================================================
-- ARCHITECTURAL SECURITY DECISION: Option A (Service-Role Admin Client Model)
-- All server-side data mutations (INSERT, UPDATE, DELETE) and financial transactions
-- are routed exclusively through backend Next.js API route handlers that execute
-- strict authentication/authorization guards (requireUser / requireSuperAdmin)
-- and use the secure service-role client (getSupabaseAdminClient).
-- Direct client-side queries via browser supabase-js are restricted by RLS to read-only
-- access to public catalog tables and isolated user-owned rows.
-- ============================================================================

-- 1. Users & Accounts
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(100) DEFAULT 'United States',
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'SUPER_ADMIN')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED')),
  referral_code VARCHAR(30) UNIQUE NOT NULL,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  leadership_level VARCHAR(50) NOT NULL DEFAULT 'SOLAR_MEMBER',
  points INTEGER NOT NULL DEFAULT 70 CHECK (points >= 0),
  available_balance NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (available_balance >= 0),
  total_earned NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (total_earned >= 0),
  password_hash TEXT NOT NULL,
  transaction_password_hash TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_sponsor_id ON users(sponsor_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 2. User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  wallet_address VARCHAR(255),
  wallet_network VARCHAR(20) DEFAULT 'USDT-TRC20',
  wallet_verified BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_currency VARCHAR(10) NOT NULL DEFAULT 'USDT',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  telegram_handle VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- 3. Authenticated Sessions & Device Tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'SUPER_ADMIN')),
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMPTZ,
  ip_address VARCHAR(50) NOT NULL DEFAULT '127.0.0.1',
  device_type VARCHAR(50) NOT NULL DEFAULT 'Desktop',
  operating_system VARCHAR(100) NOT NULL DEFAULT 'Windows',
  browser VARCHAR(100) NOT NULL DEFAULT 'Chrome',
  user_agent TEXT NOT NULL DEFAULT '',
  location VARCHAR(150) NOT NULL DEFAULT 'Unknown',
  session_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (session_status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  risk_score VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (risk_score IN ('LOW', 'MEDIUM', 'HIGH')),
  login_method VARCHAR(50) NOT NULL DEFAULT 'PASSWORD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(session_status);

-- 4. Solar Projects
CREATE TABLE solar_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  total_capacity_mw NUMERIC(10, 2) NOT NULL DEFAULT 10.0,
  current_output_mw NUMERIC(10, 2) NOT NULL DEFAULT 8.5,
  efficiency_percent NUMERIC(5, 2) NOT NULL DEFAULT 98.4,
  operational_status VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL',
  grid_connection VARCHAR(255) NOT NULL DEFAULT 'National Grid Tier-1',
  image_url TEXT NOT NULL,
  commissioned_date VARCHAR(50) NOT NULL DEFAULT '2024-01-15',
  co2_offset_tonnes NUMERIC(12, 2) NOT NULL DEFAULT 12500,
  active_investors_count INTEGER NOT NULL DEFAULT 1240,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Solar Plans
CREATE TABLE solar_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price_usdt NUMERIC(14, 4) NOT NULL CHECK (price_usdt >= 0),
  validity_days INTEGER NOT NULL DEFAULT 60,
  working_days_total INTEGER NOT NULL DEFAULT 43,
  daily_earning_usdt NUMERIC(14, 4) NOT NULL CHECK (daily_earning_usdt >= 0),
  gross_earning_usdt NUMERIC(14, 4) NOT NULL CHECK (gross_earning_usdt >= 0),
  withdrawal_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
  net_after_fee_usdt NUMERIC(14, 4) NOT NULL CHECK (net_after_fee_usdt >= 0),
  capacity_kw NUMERIC(10, 2) NOT NULL DEFAULT 0.5,
  image_url TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'COMING_SOON')),
  project_location VARCHAR(255) NOT NULL DEFAULT 'Texas, USA',
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solar_plans_code ON solar_plans(code);

-- 6. Solar Units (Active Hardware Purchased)
CREATE TABLE solar_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES solar_plans(id),
  plan_code VARCHAR(20) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL REFERENCES solar_projects(id),
  project_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity_kw NUMERIC(10, 2) NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  purchase_price_usdt NUMERIC(14, 4) NOT NULL CHECK (purchase_price_usdt >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'UPGRADED', 'MAINTENANCE')),
  working_days_completed INTEGER NOT NULL DEFAULT 0,
  working_days_total INTEGER NOT NULL DEFAULT 43,
  total_earned_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (total_earned_usdt >= 0),
  today_earned_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (today_earned_usdt >= 0),
  last_operated_date VARCHAR(20),
  is_receivable BOOLEAN NOT NULL DEFAULT FALSE,
  receivable_amount_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solar_units_user_id ON solar_units(user_id);
CREATE INDEX idx_solar_units_status ON solar_units(status);

-- 7. Daily Generation Logs
CREATE TABLE generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES solar_units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code VARCHAR(20) NOT NULL,
  generation_date VARCHAR(20) NOT NULL,
  kwh_generated NUMERIC(10, 4) NOT NULL,
  performance_ratio NUMERIC(5, 4) NOT NULL,
  base_earning_usdt NUMERIC(14, 4) NOT NULL,
  points_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
  actual_earning_usdt NUMERIC(14, 4) NOT NULL,
  operational_status VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL',
  status VARCHAR(20) NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED', 'RECEIVED', 'EXPIRED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ,
  CONSTRAINT unq_unit_generation_date UNIQUE (unit_id, generation_date)
);

CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_date ON generation_logs(generation_date);

-- 8. Immutable Financial Earnings Ledger
CREATE TABLE earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount NUMERIC(14, 4) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  balance_before NUMERIC(14, 4) NOT NULL,
  balance_after NUMERIC(14, 4) NOT NULL,
  source_event VARCHAR(100) NOT NULL,
  reference_id VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  actor VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_earnings_ledger_user_id ON earnings_ledger(user_id);
CREATE INDEX idx_earnings_ledger_created_at ON earnings_ledger(created_at);
CREATE INDEX idx_earnings_ledger_type ON earnings_ledger(type);

-- 9. Recharge Requests
CREATE TABLE recharge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recharge_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  amount_usdt NUMERIC(14, 4) NOT NULL CHECK (amount_usdt > 0),
  network VARCHAR(50) NOT NULL DEFAULT 'USDT-TRC20',
  deposit_address VARCHAR(255) NOT NULL,
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED')),
  proof_image_url TEXT,
  reviewer_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recharge_requests_user_id ON recharge_requests(user_id);
CREATE INDEX idx_recharge_requests_status ON recharge_requests(status);
CREATE INDEX idx_recharge_requests_tx_hash ON recharge_requests(tx_hash);

-- 10. Withdrawal Requests
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  amount_usdt NUMERIC(14, 4) NOT NULL CHECK (amount_usdt > 0),
  fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
  fee_amount_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
  net_amount_usdt NUMERIC(14, 4) NOT NULL CHECK (net_amount_usdt > 0),
  wallet_address VARCHAR(255) NOT NULL,
  network VARCHAR(50) NOT NULL DEFAULT 'USDT-TRC20',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED')),
  tx_hash VARCHAR(255),
  rejection_reason TEXT,
  refunded BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- 11. Points Ledger
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  points_change INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_ledger_user_id ON points_ledger(user_id);

-- 12. Referral Relationships & Multi-Tier Hierarchy
CREATE TABLE referral_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  level_1_sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  level_2_sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  level_3_sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_user ON referral_relationships(user_id);
CREATE INDEX idx_referral_sponsor ON referral_relationships(sponsor_id);

-- 13. Referral Commissions
CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beneficiary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  percentage NUMERIC(5, 2) NOT NULL,
  base_amount_usdt NUMERIC(14, 4) NOT NULL,
  commission_amount_usdt NUMERIC(14, 4) NOT NULL,
  generation_log_id UUID REFERENCES generation_logs(id),
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_commissions_beneficiary ON referral_commissions(beneficiary_user_id);

-- 14. Leadership Levels & Configurations
CREATE TABLE leadership_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  required_direct_members INTEGER NOT NULL DEFAULT 0,
  required_active_team_members INTEGER NOT NULL DEFAULT 0,
  required_min_plan VARCHAR(20) NOT NULL DEFAULT 'P1',
  required_points INTEGER NOT NULL DEFAULT 70,
  daily_bonus_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
  badge_color VARCHAR(50) NOT NULL DEFAULT 'text-amber-400',
  display_order INTEGER NOT NULL DEFAULT 1
);

-- 15. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- 16. Support Tickets & Messaging
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('USER', 'SUPER_ADMIN')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);

-- 17. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id VARCHAR(255) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50) NOT NULL DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- 18. Dynamic Business Rules
CREATE TABLE business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Rewards Catalog & Redemptions
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  category VARCHAR(50) NOT NULL,
  image_url TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  shipping_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reward_redemptions_user ON reward_redemptions(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Public read for catalog data
CREATE POLICY "Public can view active solar projects" ON solar_projects FOR SELECT USING (true);
CREATE POLICY "Public can view active solar plans" ON solar_plans FOR SELECT USING (true);
CREATE POLICY "Public can view leadership levels" ON leadership_levels FOR SELECT USING (true);
CREATE POLICY "Public can view rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Public can view business rules" ON business_rules FOR SELECT USING (true);

-- User Isolation Policies
CREATE POLICY "Users can view own user record" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  auth.jwt() ->> 'role' = 'service_role' OR 
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
);
CREATE POLICY "Users can view direct upline sponsor" ON users FOR SELECT USING (
  id = (SELECT sponsor_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own units" ON solar_units FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own logs" ON generation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own ledger" ON earnings_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own recharges" ON recharge_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own points" ON points_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own redemptions" ON reward_redemptions FOR SELECT USING (auth.uid() = user_id);
