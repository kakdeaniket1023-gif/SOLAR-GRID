import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const sql = neon(dbUrl);

async function migrate() {
  console.log('--- Initializing Neon PostgreSQL Schema ---');

  // 1. Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) DEFAULT '+1 (555) 000-0000',
      country VARCHAR(100) DEFAULT 'United States',
      avatar_url TEXT,
      role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'SUPER_ADMIN')),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED')),
      referral_code VARCHAR(30) UNIQUE NOT NULL,
      sponsor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      leadership_level VARCHAR(50) NOT NULL DEFAULT 'SOLAR_MEMBER',
      points INTEGER NOT NULL DEFAULT 100 CHECK (points >= 0),
      available_balance NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (available_balance >= 0),
      total_earned NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (total_earned >= 0),
      kyc_status VARCHAR(32) DEFAULT 'UNVERIFIED' CHECK (kyc_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
      personal_pv NUMERIC(14,2) DEFAULT 0,
      group_pv NUMERIC(14,2) DEFAULT 0,
      password_hash TEXT NOT NULL,
      transaction_password_hash TEXT,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ users table created');

  // Indexes for users
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);`;

  // 2. Profiles table
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  `;
  console.log('✓ profiles table created');

  // 3. User Sessions
  await sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id VARCHAR(64) PRIMARY KEY,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'USER',
      login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      logout_time TIMESTAMPTZ,
      ip_address VARCHAR(50) NOT NULL DEFAULT '127.0.0.1',
      device_type VARCHAR(50) NOT NULL DEFAULT 'Desktop',
      operating_system VARCHAR(100) NOT NULL DEFAULT 'MacOS',
      browser VARCHAR(100) NOT NULL DEFAULT 'Chrome',
      user_agent TEXT NOT NULL DEFAULT '',
      location VARCHAR(150) NOT NULL DEFAULT 'Local',
      session_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      risk_score VARCHAR(20) NOT NULL DEFAULT 'LOW',
      login_method VARCHAR(50) NOT NULL DEFAULT 'PASSWORD',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ user_sessions table created');

  // 4. Solar Projects
  await sql`
    CREATE TABLE IF NOT EXISTS solar_projects (
      id VARCHAR(64) PRIMARY KEY,
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
  `;
  console.log('✓ solar_projects table created');

  // 5. Solar Plans
  await sql`
    CREATE TABLE IF NOT EXISTS solar_plans (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price_usdt NUMERIC(14, 4) NOT NULL CHECK (price_usdt >= 0),
      validity_days INTEGER NOT NULL DEFAULT 60,
      working_days_total INTEGER NOT NULL DEFAULT 43,
      daily_earning_usdt NUMERIC(14, 4) NOT NULL CHECK (daily_earning_usdt >= 0),
      gross_earning_usdt NUMERIC(14, 4) NOT NULL CHECK (gross_earning_usdt >= 0),
      withdrawal_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
      net_after_fee_usdt NUMERIC(14, 4) NOT NULL CHECK (net_after_fee_usdt >= 0),
      capacity_kw NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
      image_url TEXT NOT NULL,
      features JSONB NOT NULL DEFAULT '[]'::jsonb,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'COMING_SOON')),
      project_location VARCHAR(255) NOT NULL DEFAULT 'Sonoran Clean Energy Park, AZ',
      display_order INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ solar_plans table created');

  // 6. Solar Units
  await sql`
    CREATE TABLE IF NOT EXISTS solar_units (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id VARCHAR(64) NOT NULL REFERENCES solar_plans(id),
      plan_code VARCHAR(20) NOT NULL,
      plan_name VARCHAR(255) NOT NULL,
      project_id VARCHAR(64) NOT NULL REFERENCES solar_projects(id),
      project_name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      capacity_kw NUMERIC(10, 2) NOT NULL,
      purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expiry_date TIMESTAMPTZ NOT NULL,
      purchase_price_usdt NUMERIC(14, 4) NOT NULL CHECK (purchase_price_usdt >= 0),
      daily_earning_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.8000,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'UPGRADED', 'MAINTENANCE')),
      working_days_completed INTEGER NOT NULL DEFAULT 0,
      working_days_total INTEGER NOT NULL DEFAULT 43,
      validity_days INTEGER NOT NULL DEFAULT 60,
      withdrawal_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
      total_earned_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (total_earned_usdt >= 0),
      today_earned_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (today_earned_usdt >= 0),
      today_generated_kwh NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
      lifetime_generated_kwh NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
      lifetime_earned_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
      performance_ratio NUMERIC(5, 4) NOT NULL DEFAULT 0.9850,
      last_operated_date VARCHAR(20),
      is_receivable BOOLEAN NOT NULL DEFAULT FALSE,
      receivable_amount_usdt NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ solar_units table created');

  // 7. Generation Logs
  await sql`
    CREATE TABLE IF NOT EXISTS generation_logs (
      id VARCHAR(64) PRIMARY KEY,
      unit_id VARCHAR(64) NOT NULL REFERENCES solar_units(id) ON DELETE CASCADE,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_code VARCHAR(20) NOT NULL,
      generation_date VARCHAR(20) NOT NULL,
      kwh_generated NUMERIC(10, 4) NOT NULL,
      performance_ratio NUMERIC(5, 4) NOT NULL,
      base_earning_usdt NUMERIC(14, 4) NOT NULL,
      points_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
      actual_earning_usdt NUMERIC(14, 4) NOT NULL,
      operational_status VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL',
      status VARCHAR(20) NOT NULL DEFAULT 'STARTED',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      received_at TIMESTAMPTZ
    );
  `;
  console.log('✓ generation_logs table created');

  // 8. Earnings Ledger
  await sql`
    CREATE TABLE IF NOT EXISTS earnings_ledger (
      id VARCHAR(64) PRIMARY KEY,
      transaction_id VARCHAR(100) UNIQUE NOT NULL,
      idempotency_key VARCHAR(255) UNIQUE,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  `;
  console.log('✓ earnings_ledger table created');

  // 9. Recharge Requests
  await sql`
    CREATE TABLE IF NOT EXISTS recharge_requests (
      id VARCHAR(64) PRIMARY KEY,
      recharge_id VARCHAR(100) UNIQUE NOT NULL,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  `;
  console.log('✓ recharge_requests table created');

  // 10. Withdrawal Requests
  await sql`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id VARCHAR(64) PRIMARY KEY,
      withdrawal_id VARCHAR(100) UNIQUE NOT NULL,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      plan_code VARCHAR(20) DEFAULT 'P1',
      amount_usdt NUMERIC(14, 4) NOT NULL CHECK (amount_usdt > 0),
      fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
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
  `;
  console.log('✓ withdrawal_requests table created');

  // 11. Points Ledger
  await sql`
    CREATE TABLE IF NOT EXISTS points_ledger (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL,
      points_change INTEGER NOT NULL,
      points_before INTEGER NOT NULL,
      points_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ points_ledger table created');

  // 12. Commissions (Direct Selling 3-Tier MLM)
  await sql`
    CREATE TABLE IF NOT EXISTS commissions (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64),
      order_no VARCHAR(64),
      buyer_id VARCHAR(64),
      buyer_name VARCHAR(255),
      beneficiary_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      beneficiary_name VARCHAR(255),
      level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
      rate NUMERIC(5,2) NOT NULL,
      amount NUMERIC(14,2) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'CLAWED_BACK')),
      clawback_of VARCHAR(64),
      idempotency_key VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ commissions table created');

  // 13. Audit Logs
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
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
  `;
  console.log('✓ audit_logs table created');

  // 14. Support Tickets & Messages
  await sql`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(64) PRIMARY KEY,
      ticket_number VARCHAR(50) UNIQUE NOT NULL,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
      status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ support_tickets table created');

  // 15. Platform Settings
  await sql`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ platform_settings table created');

  // 16. Notifications
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'INFO',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      link VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);`;
  console.log('✓ notifications table created');

  // 17. Support Messages
  await sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id VARCHAR(64) PRIMARY KEY,
      ticket_id VARCHAR(64) NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      sender_id VARCHAR(64) NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('USER', 'SUPER_ADMIN')),
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);`;
  console.log('✓ support_messages table created');

  // 18. Products (Direct Selling Hardware Catalog)
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      sku VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      retail_price NUMERIC(14,2) NOT NULL CHECK (retail_price > 0),
      commissionable_value NUMERIC(14,2) NOT NULL CHECK (commissionable_value >= 0),
      category VARCHAR(64) DEFAULT 'HARDWARE',
      image_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);`;
  console.log('✓ products table created');

  // 19. Orders
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      order_no VARCHAR(64) UNIQUE NOT NULL,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED')),
      total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
      total_pv NUMERIC(14,2) NOT NULL CHECK (total_pv >= 0),
      payment_gateway_ref VARCHAR(255),
      idempotency_key VARCHAR(255) UNIQUE,
      shipping_address JSONB,
      paid_at TIMESTAMPTZ,
      refunded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);`;
  console.log('✓ orders table created');

  // 20. Order Items
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
      product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
      qty INTEGER NOT NULL CHECK (qty > 0),
      unit_price NUMERIC(14,2) NOT NULL,
      pv_amount NUMERIC(14,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`;
  console.log('✓ order_items table created');

  // 21. Identity Verification (KYC) Submissions
  await sql`
    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      doc_type VARCHAR(64) NOT NULL,
      doc_number VARCHAR(128) NOT NULL,
      front_url TEXT NOT NULL,
      back_url TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
      rejection_reason TEXT,
      reviewed_by VARCHAR(64),
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_submissions(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);`;
  console.log('✓ kyc_submissions table created');

  // 22. Payout Methods
  await sql`
    CREATE TABLE IF NOT EXISTS payout_methods (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(32) NOT NULL CHECK (type IN ('USDT_TRC20', 'USDT_BEP20', 'BANK_WIRE')),
      details JSONB NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      verified_at TIMESTAMPTZ
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_payout_methods_user ON payout_methods(user_id);`;
  console.log('✓ payout_methods table created');

  // 23. Fraud Signals
  await sql`
    CREATE TABLE IF NOT EXISTS fraud_signals (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      signal_type VARCHAR(64) NOT NULL,
      severity VARCHAR(32) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_fraud_signals_user ON fraud_signals(user_id);`;
  console.log('✓ fraud_signals table created');

  // 24. Leadership Levels
  await sql`
    CREATE TABLE IF NOT EXISTS leadership_levels (
      id VARCHAR(64) PRIMARY KEY,
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
  `;
  console.log('✓ leadership_levels table created');

  // 25. Rewards Catalog
  await sql`
    CREATE TABLE IF NOT EXISTS rewards (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      points_cost INTEGER NOT NULL CHECK (points_cost > 0),
      category VARCHAR(50) NOT NULL,
      image_url TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 100,
      status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ rewards table created');

  // 26. Reward Redemptions
  await sql`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reward_id VARCHAR(64) NOT NULL REFERENCES rewards(id),
      points_spent INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      shipping_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user ON reward_redemptions(user_id);`;
  console.log('✓ reward_redemptions table created');

  // 27. Dynamic Business Rules
  await sql`
    CREATE TABLE IF NOT EXISTS business_rules (
      id VARCHAR(64) PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value JSONB NOT NULL,
      description TEXT,
      category VARCHAR(50) DEFAULT 'SYSTEM',
      label VARCHAR(255),
      updated_by VARCHAR(255) DEFAULT 'SYSTEM',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE business_rules ADD COLUMN IF NOT EXISTS id VARCHAR(64) DEFAULT md5(random()::text);`;
  await sql`ALTER TABLE business_rules ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'SYSTEM';`;
  await sql`ALTER TABLE business_rules ADD COLUMN IF NOT EXISTS label VARCHAR(255);`;
  await sql`ALTER TABLE business_rules ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) DEFAULT 'SYSTEM';`;
  console.log('✓ business_rules table created');

  // 28. Stored Procedures: debit_user_balance & credit_user_balance
  await sql`
    CREATE OR REPLACE FUNCTION debit_user_balance(p_user_id VARCHAR(64), p_amount NUMERIC)
    RETURNS TABLE (
      success BOOLEAN,
      balance_before NUMERIC,
      balance_after NUMERIC,
      message TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE
      v_current NUMERIC;
    BEGIN
      IF p_amount <= 0 THEN
        RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'Invalid debit amount'::TEXT;
        RETURN;
      END IF;

      SELECT available_balance INTO v_current
      FROM users
      WHERE id = p_user_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'User not found'::TEXT;
        RETURN;
      END IF;

      IF v_current < p_amount THEN
        RETURN QUERY SELECT false, v_current, v_current, 'Insufficient balance'::TEXT;
        RETURN;
      END IF;

      UPDATE users
      SET available_balance = ROUND((available_balance - p_amount)::NUMERIC, 4),
          updated_at = NOW()
      WHERE id = p_user_id;

      RETURN QUERY SELECT true, v_current, ROUND((v_current - p_amount)::NUMERIC, 4), 'Success'::TEXT;
    END;
    $$;
  `;
  console.log('✓ debit_user_balance function created');

  await sql`
    CREATE OR REPLACE FUNCTION credit_user_balance(p_user_id VARCHAR(64), p_amount NUMERIC, p_total_earned_delta NUMERIC DEFAULT 0)
    RETURNS TABLE (
      success BOOLEAN,
      balance_before NUMERIC,
      balance_after NUMERIC,
      message TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE
      v_current NUMERIC;
    BEGIN
      IF p_amount <= 0 THEN
        RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'Invalid credit amount'::TEXT;
        RETURN;
      END IF;

      SELECT available_balance INTO v_current
      FROM users
      WHERE id = p_user_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'User not found'::TEXT;
        RETURN;
      END IF;

      UPDATE users
      SET available_balance = ROUND((available_balance + p_amount)::NUMERIC, 4),
          total_earned = ROUND((total_earned + COALESCE(p_total_earned_delta, 0))::NUMERIC, 4),
          updated_at = NOW()
      WHERE id = p_user_id;

      RETURN QUERY SELECT true, v_current, ROUND((v_current + p_amount)::NUMERIC, 4), 'Success'::TEXT;
    END;
    $$;
  `;
  console.log('✓ credit_user_balance function created');

  // --- SEED INITIAL DATA ---
  console.log('--- Seeding Initial Data into Neon ---');

  // Initial Solar Project
  await sql`
    INSERT INTO solar_projects (
      id, name, description, location, total_capacity_mw, current_output_mw,
      efficiency_percent, operational_status, grid_connection, image_url,
      commissioned_date, co2_offset_tonnes, active_investors_count, display_order
    ) VALUES (
      'proj-sonoran-01',
      'Sonoran Clean Energy Park',
      'High-yield utility-grade solar array situated in the high-irradiance Arizona Sonoran basin.',
      'Sonoran Desert, Arizona, USA',
      50.0, 48.2, 99.1, 'OPTIMAL', 'Tier-1 High Voltage Interconnect',
      '/images/hero-solar-farm.jpg',
      '2024-03-01', 45000, 3200, 1
    ) ON CONFLICT (id) DO NOTHING;
  `;
  console.log('✓ Seeded solar project');

  // Initial Solar Plans P1–P6
  const plans = [
    { id: 'plan-p1', code: 'P1', name: 'Commercial PV Module 1KW', desc: 'Entry-level commercial solar module. 43 working days cycle with automated daily returns.', price: 35, daily: 0.80, gross: 34.40, kw: 1.0, img: '/images/panel-p1.jpg', order: 1 },
    { id: 'plan-p2', code: 'P2', name: 'Commercial PV Array 5KW', desc: 'Mid-scale solar installation designed for steady passive generation yields.', price: 150, daily: 3.40, gross: 146.20, kw: 5.0, img: '/images/panel-p2.jpg', order: 2 },
    { id: 'plan-p3', code: 'P3', name: 'Utility Solar Station 10KW', desc: 'High-performance utility-connected system with optimized bi-facial absorption.', price: 300, daily: 7.20, gross: 309.60, kw: 10.0, img: '/images/panel-p3.jpg', order: 3 },
    { id: 'plan-p4', code: 'P4', name: 'Industrial Solar Farm 20KW', desc: 'Substantial generation capacity tailored for committed network investors.', price: 600, daily: 15.00, gross: 645.00, kw: 20.0, img: '/images/panel-p4.jpg', order: 4 },
    { id: 'plan-p5', code: 'P5', name: 'Grid Infrastructure 50KW', desc: 'High-capacity industrial asset offering elevated daily revenues.', price: 1500, daily: 38.00, gross: 1634.00, kw: 50.0, img: '/images/panel-p5.jpg', order: 5 },
    { id: 'plan-p6', code: 'P6', name: 'Mega Solar Plant 100KW', desc: 'Institutional-grade generation tier with highest yield potential.', price: 3000, daily: 80.00, gross: 3440.00, kw: 100.0, img: '/images/panel-p6.jpg', order: 6 },
  ];

  for (const p of plans) {
    await sql`
      INSERT INTO solar_plans (
        id, code, name, description, price_usdt, validity_days, working_days_total,
        daily_earning_usdt, gross_earning_usdt, withdrawal_fee_percent, net_after_fee_usdt,
        capacity_kw, image_url, features, status, project_location, display_order
      ) VALUES (
        ${p.id}, ${p.code}, ${p.name}, ${p.desc}, ${p.price}, 60, 43,
        ${p.daily}, ${p.gross}, 10.0, ${p.gross * 0.9},
        ${p.kw}, ${p.img}, '["Daily 3-Hour Run Yields", "Direct Grid Feed-In", "43-Day Maturity Cycle"]'::jsonb,
        'ACTIVE', 'Sonoran Clean Energy Park, AZ', ${p.order}
      ) ON CONFLICT (code) DO UPDATE SET
        price_usdt = EXCLUDED.price_usdt,
        daily_earning_usdt = EXCLUDED.daily_earning_usdt,
        image_url = EXCLUDED.image_url;
    `;
  }
  console.log('✓ Seeded solar plans P1–P6');

  // Initial Super Admin & Core MLM Network
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('password-admin123@', adminSalt);
  const adminTxHash = await bcrypt.hash('8888', adminSalt);

  // 1. Root Super Admin
  await sql`
    INSERT INTO users (
      id, email, name, role, status, referral_code, sponsor_id,
      leadership_level, points, available_balance, total_earned,
      password_hash, transaction_password_hash
    ) VALUES (
      'usr-admin-marcus',
      'admin@gmail.com',
      'Administrator',
      'SUPER_ADMIN',
      'ACTIVE',
      'SG-ADMIN01',
      NULL,
      'SOLAR_DIRECTOR',
      100,
      5000.00,
      12500.00,
      ${adminHash},
      ${adminTxHash}
    ) ON CONFLICT (email) DO UPDATE SET
      role = 'SUPER_ADMIN',
      status = 'ACTIVE',
      password_hash = ${adminHash};
  `;

  await sql`
    INSERT INTO profiles (
      id, user_id, bio, wallet_address, wallet_network, wallet_verified
    ) VALUES (
      'prof-admin-marcus',
      'usr-admin-marcus',
      'Executive System Administrator & Founder for SolarGrid Infrastructure.',
      'TYDzsYUbTmNuWw8m5Y3vX99Y8T7s1KLa2v',
      'USDT-TRC20',
      TRUE
    ) ON CONFLICT (user_id) DO NOTHING;
  `;

  // 2. Sarah Jenkins (L1 Direct to Marcus)
  await sql`
    INSERT INTO users (
      id, email, name, role, status, referral_code, sponsor_id,
      leadership_level, points, available_balance, total_earned,
      password_hash, transaction_password_hash
    ) VALUES (
      'usr-sarah-jenkins',
      'sarah.jenkins@solargrid.io',
      'Sarah Jenkins',
      'USER',
      'ACTIVE',
      'SG-SARAH-888',
      'usr-admin-marcus',
      'SOLAR_MEMBER',
      100,
      145.60,
      38.40,
      ${adminHash},
      ${adminTxHash}
    ) ON CONFLICT (email) DO UPDATE SET
      sponsor_id = 'usr-admin-marcus';
  `;

  await sql`
    INSERT INTO profiles (
      id, user_id, bio, wallet_address, wallet_network, wallet_verified
    ) VALUES (
      'prof-sarah-jenkins',
      'usr-sarah-jenkins',
      'Renewable energy enthusiast & SolarGrid pioneer.',
      'TN9m3kLa8b71Vw93Lm8X7102LmP982Ytr',
      'USDT-TRC20',
      TRUE
    ) ON CONFLICT (user_id) DO NOTHING;
  `;

  // 3. Alex Rivera (L1 Direct to Sarah, L2 to Marcus)
  await sql`
    INSERT INTO users (
      id, email, name, role, status, referral_code, sponsor_id,
      leadership_level, points, available_balance, total_earned,
      password_hash, transaction_password_hash
    ) VALUES (
      'usr-alex-rivera',
      'alex.rivera@gmail.com',
      'Alex Rivera',
      'USER',
      'ACTIVE',
      'SG-ALEX-101',
      'usr-sarah-jenkins',
      'SOLAR_BUILDER',
      112,
      280.00,
      320.00,
      ${adminHash},
      ${adminTxHash}
    ) ON CONFLICT (email) DO UPDATE SET
      sponsor_id = 'usr-sarah-jenkins';
  `;

  // 4. Elena Rostova (L1 Direct to Sarah)
  await sql`
    INSERT INTO users (
      id, email, name, role, status, referral_code, sponsor_id,
      leadership_level, points, available_balance, total_earned,
      password_hash, transaction_password_hash
    ) VALUES (
      'usr-elena-rostova',
      'elena.rostova@gmail.com',
      'Elena Rostova',
      'USER',
      'ACTIVE',
      'SG-ELENA-202',
      'usr-sarah-jenkins',
      'SOLAR_MEMBER',
      104,
      95.50,
      48.00,
      ${adminHash},
      ${adminTxHash}
    ) ON CONFLICT (email) DO UPDATE SET
      sponsor_id = 'usr-sarah-jenkins';
  `;

  // 5. Michael Chang (L1 Direct to Alex, L2 to Sarah, L3 to Marcus)
  await sql`
    INSERT INTO users (
      id, email, name, role, status, referral_code, sponsor_id,
      leadership_level, points, available_balance, total_earned,
      password_hash, transaction_password_hash
    ) VALUES (
      'usr-michael-chang',
      'michael.chang@gmail.com',
      'Michael Chang',
      'USER',
      'ACTIVE',
      'SG-MIKE-404',
      'usr-alex-rivera',
      'SOLAR_PROMOTER',
      108,
      420.00,
      510.00,
      ${adminHash},
      ${adminTxHash}
    ) ON CONFLICT (email) DO UPDATE SET
      sponsor_id = 'usr-alex-rivera';
  `;

  // 6. Liam Chen (L1 Direct to Michael, L2 to Alex, L3 to Sarah)
  await sql`
    INSERT INTO users (
      id, email, name, role, status, referral_code, sponsor_id,
      leadership_level, points, available_balance, total_earned,
      password_hash, transaction_password_hash
    ) VALUES (
      'usr-liam-chen',
      'liam.chen@gmail.com',
      'Liam Chen',
      'USER',
      'ACTIVE',
      'SG-LIAM-606',
      'usr-michael-chang',
      'SOLAR_MEMBER',
      102,
      12.80,
      6.40,
      ${adminHash},
      ${adminTxHash}
    ) ON CONFLICT (email) DO UPDATE SET
      sponsor_id = 'usr-michael-chang';
  `;

  // Seed sample multi-tier commissions in Neon
  await sql`
    INSERT INTO commissions (
      id, order_id, order_no, buyer_id, buyer_name,
      beneficiary_id, beneficiary_name, level, rate, amount,
      status, idempotency_key, created_at
    ) VALUES 
    (
      'comm-001', 'unit-alex-p3', 'ORD-P3-ALEX', 'usr-alex-rivera', 'Alex Rivera',
      'usr-sarah-jenkins', 'Sarah Jenkins', 1, 10.0, 30.00,
      'APPROVED', 'COMM_ALEX_P3_L1_SARAH', NOW() - INTERVAL '12 days'
    ),
    (
      'comm-002', 'unit-elena-p1', 'ORD-P1-ELENA', 'usr-elena-rostova', 'Elena Rostova',
      'usr-sarah-jenkins', 'Sarah Jenkins', 1, 10.0, 3.50,
      'APPROVED', 'COMM_ELENA_P1_L1_SARAH', NOW() - INTERVAL '10 days'
    ),
    (
      'comm-003', 'unit-michael-p4', 'ORD-P4-MIKE', 'usr-michael-chang', 'Michael Chang',
      'usr-alex-rivera', 'Alex Rivera', 1, 10.0, 60.00,
      'APPROVED', 'COMM_MIKE_P4_L1_ALEX', NOW() - INTERVAL '8 days'
    ),
    (
      'comm-004', 'unit-michael-p4', 'ORD-P4-MIKE', 'usr-michael-chang', 'Michael Chang',
      'usr-sarah-jenkins', 'Sarah Jenkins', 2, 3.0, 18.00,
      'APPROVED', 'COMM_MIKE_P4_L2_SARAH', NOW() - INTERVAL '8 days'
    ),
    (
      'comm-005', 'unit-liam-p1', 'ORD-P1-LIAM', 'usr-liam-chen', 'Liam Chen',
      'usr-michael-chang', 'Michael Chang', 1, 10.0, 3.50,
      'APPROVED', 'COMM_LIAM_P1_L1_MIKE', NOW() - INTERVAL '5 days'
    ),
    (
      'comm-006', 'unit-liam-p1', 'ORD-P1-LIAM', 'usr-liam-chen', 'Liam Chen',
      'usr-alex-rivera', 'Alex Rivera', 2, 3.0, 1.05,
      'APPROVED', 'COMM_LIAM_P1_L2_ALEX', NOW() - INTERVAL '5 days'
    ),
    (
      'comm-007', 'unit-liam-p1', 'ORD-P1-LIAM', 'usr-liam-chen', 'Liam Chen',
      'usr-sarah-jenkins', 'Sarah Jenkins', 3, 1.0, 0.35,
      'APPROVED', 'COMM_LIAM_P1_L3_SARAH', NOW() - INTERVAL '5 days'
    )
    ON CONFLICT (id) DO NOTHING;
  `;
  console.log('✓ Seeded multi-tier MLM commissions (L1: 10%, L2: 3%, L3: 1%)');

  // Seed sample solar units
  await sql`
    INSERT INTO solar_units (
      id, user_id, plan_id, plan_code, plan_name,
      project_id, project_name, location, capacity_kw,
      purchase_date, expiry_date, purchase_price_usdt, daily_earning_usdt,
      status, working_days_completed, working_days_total, total_earned_usdt
    ) VALUES 
    (
      'unit-sarah-p1', 'usr-sarah-jenkins', 'plan-p1', 'P1', 'Commercial PV Module 1KW',
      'proj-sonoran-01', 'Sonoran Clean Energy Park', 'Sonoran Desert, Arizona, USA', 1.0,
      NOW() - INTERVAL '14 days', NOW() + INTERVAL '46 days', 35.0, 0.80,
      'ACTIVE', 10, 43, 8.00
    ),
    (
      'unit-alex-p3', 'usr-alex-rivera', 'plan-p3', 'P3', 'Utility Solar Station 10KW',
      'proj-sonoran-01', 'Sonoran Clean Energy Park', 'Sonoran Desert, Arizona, USA', 10.0,
      NOW() - INTERVAL '12 days', NOW() + INTERVAL '48 days', 300.0, 7.20,
      'ACTIVE', 8, 43, 57.60
    )
    ON CONFLICT (id) DO NOTHING;
  `;
  // Seed Products
  const products = [
    { id: 'prod-1', sku: 'SOL-500W-PANEL', name: 'SolarGrid 500W High-Efficiency Monocrystalline Panel', desc: 'Commercial-grade photovoltaic module with 22.8% cell efficiency and 25-year warranty.', price: 180.00, pv: 150.00, cat: 'HARDWARE', img: '/images/panel-p1.jpg' },
    { id: 'prod-2', sku: 'INV-3KW-SMART', name: 'SolarGrid 3kW Hybrid Grid-Tie Smart Inverter', desc: 'Pure sine wave inverter with dual MPPT charge controller and cloud energy tracking.', price: 450.00, pv: 400.00, cat: 'HARDWARE', img: '/images/panel-p2.jpg' },
    { id: 'prod-3', sku: 'SOL-KIT-2KWH', name: 'SolarGrid 2.4kWh LiFePO4 Energy Storage Station', desc: 'Modular lithium-iron phosphate battery backup system with 6,000+ cycle lifespan.', price: 850.00, pv: 750.00, cat: 'HARDWARE', img: '/images/panel-p3.jpg' },
    { id: 'prod-4', sku: 'IOT-MONITOR-PRO', name: 'SolarGrid Smart IoT Energy Consumption Monitor', desc: 'Real-time panel telemetry gateway with Zigbee mesh and mobile analytics connectivity.', price: 95.00, pv: 80.00, cat: 'ACCESSORIES', img: '/images/panel-p4.jpg' },
    { id: 'prod-5', sku: 'SRV-AUDIT-HOME', name: 'Professional Residential Solar Engineering Assessment', desc: 'Comprehensive on-site shade, irradiation, and structural installation engineering audit.', price: 120.00, pv: 100.00, cat: 'SERVICES', img: '/images/panel-p5.jpg' }
  ];

  for (const prod of products) {
    await sql`
      INSERT INTO products (id, sku, name, description, retail_price, commissionable_value, category, image_url, is_active)
      VALUES (${prod.id}, ${prod.sku}, ${prod.name}, ${prod.desc}, ${prod.price}, ${prod.pv}, ${prod.cat}, ${prod.img}, TRUE)
      ON CONFLICT (id) DO UPDATE SET
        retail_price = EXCLUDED.retail_price,
        commissionable_value = EXCLUDED.commissionable_value,
        name = EXCLUDED.name;
    `;
  }
  console.log('✓ Seeded products catalog');

  // Seed Leadership Levels
  const levels = [
    { id: 'll-1', tier: 'SOLAR_MEMBER', name: 'Solar Member', directs: 0, activeTeam: 0, plan: 'P1', points: 70, bonus: 0, badge: 'text-slate-400', order: 1 },
    { id: 'll-2', tier: 'SOLAR_BUILDER', name: 'Solar Builder', directs: 3, activeTeam: 5, plan: 'P1', points: 70, bonus: 1.5, badge: 'text-cyan-400', order: 2 },
    { id: 'll-3', tier: 'ENERGY_COORDINATOR', name: 'Energy Coordinator', directs: 8, activeTeam: 20, plan: 'P2', points: 80, bonus: 5.0, badge: 'text-emerald-400', order: 3 },
    { id: 'll-4', tier: 'SOLAR_LEADER', name: 'Solar Leader', directs: 15, activeTeam: 50, plan: 'P2', points: 85, bonus: 15.0, badge: 'text-purple-400', order: 4 },
  ];

  for (const l of levels) {
    await sql`
      INSERT INTO leadership_levels (id, tier, name, required_direct_members, required_active_team_members, required_min_plan, required_points, daily_bonus_usdt, badge_color, display_order)
      VALUES (${l.id}, ${l.tier}, ${l.name}, ${l.directs}, ${l.activeTeam}, ${l.plan}, ${l.points}, ${l.bonus}, ${l.badge}, ${l.order})
      ON CONFLICT (tier) DO UPDATE SET
        name = EXCLUDED.name,
        daily_bonus_usdt = EXCLUDED.daily_bonus_usdt;
    `;
  }
  console.log('✓ Seeded leadership levels');

  // Seed Rewards
  const rewards = [
    { id: 'rew-5usdt', name: '5.00 USDT Energy Voucher', desc: 'Direct cash credit deposited straight to your available balance.', cost: 50, cat: 'CREDIT', img: '/images/rewards/voucher.jpg', stock: 999 },
    { id: 'rew-20usdt', name: '20.00 USDT Energy Voucher', desc: 'High-value balance credit deposited to your account.', cost: 180, cat: 'CREDIT', img: '/images/rewards/voucher-gold.jpg', stock: 999 },
    { id: 'rew-booster', name: 'Generation Efficiency Booster', desc: 'Temporary +5% solar panel generation boost for 7 operational days.', cost: 80, cat: 'BOOST', img: '/images/rewards/booster.jpg', stock: 100 },
    { id: 'rew-vip-pass', name: 'VIP Community Ambassador Pass', desc: 'Priority withdrawal processing queue and VIP community support lounge.', cost: 250, cat: 'STATUS', img: '/images/rewards/vip.jpg', stock: 50 },
    { id: 'rw-solar-hoodie', name: 'SolarGrid Executive Tech Hoodie', desc: 'Premium heavyweight organic cotton hoodie with embroidered SolarGrid insignia.', cost: 50, cat: 'LIFESTYLE', img: '/images/rewards/hoodie.jpg', stock: 45 },
  ];

  for (const rew of rewards) {
    await sql`
      INSERT INTO rewards (id, name, description, points_cost, category, image_url, stock, status)
      VALUES (${rew.id}, ${rew.name}, ${rew.desc}, ${rew.cost}, ${rew.cat}, ${rew.img}, ${rew.stock}, 'AVAILABLE')
      ON CONFLICT (id) DO UPDATE SET
        points_cost = EXCLUDED.points_cost,
        description = EXCLUDED.description;
    `;
  }
  console.log('✓ Seeded rewards');

  // Seed Business Rules
  const rules = [
    { id: 'br-1', key: 'STARTING_POINTS', cat: 'POINTS', label: 'Baseline Starting Points', val: 70, desc: 'Default points for new signups' },
    { id: 'br-2', key: 'MINIMUM_WITHDRAWAL_USDT', cat: 'WITHDRAWAL', label: 'Minimum Withdrawal', val: 10, desc: 'Minimum allowed withdrawal amount in USDT' },
    { id: 'br-3', key: 'COMMISSION_L1_PERCENT', cat: 'MLM', label: 'Level 1 Commission', val: 10, desc: 'Level 1 direct commission percentage' },
    { id: 'br-4', key: 'COMMISSION_L2_PERCENT', cat: 'MLM', label: 'Level 2 Commission', val: 5, desc: 'Level 2 commission percentage' },
    { id: 'br-5', key: 'COMMISSION_L3_PERCENT', cat: 'MLM', label: 'Level 3 Commission', val: 2, desc: 'Level 3 commission percentage' },
    { id: 'br-6', key: 'WORKING_DAYS_PER_CYCLE', cat: 'SOLAR', label: 'Working Days per Cycle', val: 43, desc: 'Working weekdays per 60-day calendar cycle' },
  ];

  for (const r of rules) {
    const valJson = JSON.stringify({ value: r.val });
    await sql`
      INSERT INTO business_rules (id, key, value, description, category, label)
      VALUES (${r.id}, ${r.key}, ${valJson}::jsonb, ${r.desc}, ${r.cat}, ${r.label})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description;
    `;
  }
  console.log('✓ Seeded business rules');

  console.log('--- Neon Database Initialization Complete! ---');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
