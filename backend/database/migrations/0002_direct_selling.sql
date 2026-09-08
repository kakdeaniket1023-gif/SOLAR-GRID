-- ==============================================================================
-- SOLARGRID DIRECT-SELLING & COMPLIANT MLM MIGRATION (0002_direct_selling.sql)
-- ==============================================================================

-- 1. Modify users table for Direct Selling & KYC compliance
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(32) DEFAULT 'UNVERIFIED' CHECK (kyc_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_pv NUMERIC(14,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_pv NUMERIC(14,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);

-- 2. Real Solar Products Catalog Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  retail_price NUMERIC(14,2) NOT NULL CHECK (retail_price > 0),
  commissionable_value NUMERIC(14,2) NOT NULL CHECK (commissionable_value >= 0), -- PV
  category VARCHAR(64) DEFAULT 'HARDWARE',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Seed initial compliant real products
INSERT INTO products (id, sku, name, description, retail_price, commissionable_value, category, image_url, is_active)
VALUES
  ('prod-1', 'SOL-500W-PANEL', 'SolarGrid 500W High-Efficiency Monocrystalline Panel', 'Commercial-grade photovoltaic module with 22.8% cell efficiency and 25-year warranty.', 180.00, 150.00, 'HARDWARE', '/images/panel-p1.jpg', TRUE),
  ('prod-2', 'INV-3KW-SMART', 'SolarGrid 3kW Hybrid Grid-Tie Smart Inverter', 'Pure sine wave inverter with dual MPPT charge controller and cloud energy tracking.', 450.00, 400.00, 'HARDWARE', '/images/panel-p2.jpg', TRUE),
  ('prod-3', 'SOL-KIT-2KWH', 'SolarGrid 2.4kWh LiFePO4 Energy Storage Station', 'Modular lithium-iron phosphate battery backup system with 6,000+ cycle lifespan.', 850.00, 750.00, 'HARDWARE', '/images/panel-p3.jpg', TRUE),
  ('prod-4', 'IOT-MONITOR-PRO', 'SolarGrid Smart IoT Energy Consumption Monitor', 'Real-time panel telemetry gateway with Zigbee mesh and mobile analytics connectivity.', 95.00, 80.00, 'ACCESSORIES', '/images/panel-p4.jpg', TRUE),
  ('prod-5', 'SRV-AUDIT-HOME', 'Professional Residential Solar Engineering Assessment', 'Comprehensive on-site shade, irradiation, and structural installation engineering audit.', 120.00, 100.00, 'SERVICES', '/images/panel-p5.jpg', TRUE)
ON CONFLICT (id) DO UPDATE SET
  retail_price = EXCLUDED.retail_price,
  commissionable_value = EXCLUDED.commissionable_value,
  name = EXCLUDED.name;

-- 3. Customer & Distributor Real Orders
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

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);

-- 4. Order Line Items
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(14,2) NOT NULL,
  pv_amount NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 5. Compliant 2-Level Order Direct Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
  beneficiary_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  level INTEGER NOT NULL CHECK (level IN (1, 2)),
  rate NUMERIC(5,2) NOT NULL, -- 10.00 for L1, 5.00 for L2
  amount NUMERIC(14,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'CLAWED_BACK')),
  clawback_of VARCHAR(64) REFERENCES commissions(id) ON DELETE SET NULL,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_beneficiary_id ON commissions(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- 6. Identity Verification (KYC) Submissions
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

CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);

-- 7. Verified Payout Methods Table
CREATE TABLE IF NOT EXISTS payout_methods (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL CHECK (type IN ('USDT_TRC20', 'USDT_BEP20', 'BANK_WIRE')),
  details JSONB NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payout_methods_user ON payout_methods(user_id);

-- 8. Fraud Signals (ML Anomaly Detection Layer)
CREATE TABLE IF NOT EXISTS fraud_signals (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  signal_type VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_user ON fraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_severity ON fraud_signals(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_resolved ON fraud_signals(resolved);

-- 9. Row Level Security Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read active products; Admins can manage
CREATE POLICY products_read_all ON products FOR SELECT USING (true);
CREATE POLICY products_admin_write ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'SUPER_ADMIN')
);

-- Orders: Users view own orders; Admins view all
CREATE POLICY orders_select ON orders FOR SELECT USING (
  user_id = auth.uid()::text OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'SUPER_ADMIN')
);

-- Commissions: Users view own commissions; Admins view all
CREATE POLICY commissions_select ON commissions FOR SELECT USING (
  beneficiary_id = auth.uid()::text OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'SUPER_ADMIN')
);

-- KYC: Users manage own KYC; Admins review all
CREATE POLICY kyc_user_access ON kyc_submissions FOR SELECT USING (
  user_id = auth.uid()::text OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'SUPER_ADMIN')
);

-- Payout Methods: Users view own payout methods
CREATE POLICY payout_methods_user ON payout_methods FOR ALL USING (
  user_id = auth.uid()::text OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'SUPER_ADMIN')
);

-- Fraud Signals: Admins only
CREATE POLICY fraud_signals_admin ON fraud_signals FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'SUPER_ADMIN')
);
