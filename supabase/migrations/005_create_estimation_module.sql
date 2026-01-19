-- ============================================================
-- MIGRATION 005: ESTIMATION IMMOBILIÈRE MODULE
-- Purpose: Complete real estate valuation system
-- Features: Pricing, rules versioning, auditing, PDF generation
-- ============================================================

-- ============================================================
-- 1) PRICING CONFIGURATION TABLES
-- ============================================================

-- communes table (Jura communes)
CREATE TABLE IF NOT EXISTS communes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  postal_code TEXT NOT NULL,
  zone_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- zones table (geographic regions)
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- price_per_m2 table (base prices by commune/zone)
CREATE TABLE IF NOT EXISTS price_per_m2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_id UUID REFERENCES communes(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  price_per_m2 DECIMAL(10, 2) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  version_id UUID NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- coefficients table (adjustment factors)
CREATE TABLE IF NOT EXISTS coefficients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('property_condition', 'property_type', 'terrain_size', 'location')),
  value_key TEXT NOT NULL,
  coefficient DECIMAL(5, 3) NOT NULL,
  description TEXT,
  version_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- options_values table (plusvalues/minuses for amenities)
CREATE TABLE IF NOT EXISTS options_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  option_key TEXT NOT NULL UNIQUE,
  value_type TEXT NOT NULL CHECK (value_type IN ('fixed', 'percentage')),
  value DECIMAL(12, 2) NOT NULL,
  description TEXT,
  version_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2) VERSIONING & RULES
-- ============================================================

-- calculation_rules_version table (immutable version snapshots)
CREATE TABLE IF NOT EXISTS calculation_rules_version (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_number INT NOT NULL UNIQUE,
  rule_set JSONB NOT NULL,
  description TEXT,
  legal_text_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE
);

-- legal_mentions table (versioned legal disclaimers)
CREATE TABLE IF NOT EXISTS legal_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('curiosity', 'sale', 'divorce', 'inheritance', 'notarial', 'other')),
  short_text TEXT NOT NULL,
  long_text TEXT NOT NULL,
  version_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3) CLIENT ESTIMATIONS
-- ============================================================

-- estimation_requests table (client estimation inquiries)
CREATE TABLE IF NOT EXISTS estimation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estimation_reason TEXT NOT NULL CHECK (estimation_reason IN ('curiosity', 'sale', 'divorce', 'inheritance', 'notarial', 'other')),
  other_reason TEXT,
  
  -- Property data
  property_type TEXT NOT NULL CHECK (property_type IN ('house', 'apartment', 'other')),
  habitable_area DECIMAL(10, 2) NOT NULL,
  terrain_area DECIMAL(10, 2),
  commune_id UUID REFERENCES communes(id),
  postal_code TEXT,
  construction_year INT,
  property_condition TEXT NOT NULL CHECK (property_condition IN ('to_renovate', 'correct', 'good', 'very_good')),
  
  -- Options/Amenities (stored as JSONB)
  amenities JSONB DEFAULT '{}'::JSONB,
  
  -- Legal consent
  legal_consent BOOLEAN NOT NULL DEFAULT FALSE,
  legal_consent_accepted_at TIMESTAMP WITH TIME ZONE,
  client_ip_address INET,
  
  -- Payment status
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10, 2),
  
  -- Calculation & Result
  calculation_rules_version_id UUID REFERENCES calculation_rules_version(id),
  estimated_value_low DECIMAL(12, 2),
  estimated_value_medium DECIMAL(12, 2),
  estimated_value_high DECIMAL(12, 2),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  confidence_margin DECIMAL(5, 2),
  calculation_data JSONB,
  
  -- PDF & Result
  pdf_storage_path TEXT,
  result_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'pending_payment', 'paid', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4) AUDIT & TRACEABILITY
-- ============================================================

-- estimation_audit_log table (complete traceability)
CREATE TABLE IF NOT EXISTS estimation_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimation_id UUID NOT NULL REFERENCES estimation_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'submitted', 'payment_initiated', 'payment_completed', 'calculated', 'pdf_generated', 'viewed', 'cancelled')),
  event_data JSONB,
  user_ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- payment_transactions table (detailed payment audit)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimation_id UUID NOT NULL REFERENCES estimation_requests(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'paypal')),
  provider_transaction_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5) INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_communes_zone_id ON communes(zone_id);
CREATE INDEX idx_communes_is_active ON communes(is_active);

CREATE INDEX idx_price_per_m2_commune_id ON price_per_m2(commune_id);
CREATE INDEX idx_price_per_m2_zone_id ON price_per_m2(zone_id);
CREATE INDEX idx_price_per_m2_version_id ON price_per_m2(version_id);

CREATE INDEX idx_coefficients_category ON coefficients(category);
CREATE INDEX idx_coefficients_version_id ON coefficients(version_id);

CREATE INDEX idx_options_values_version_id ON options_values(version_id);

CREATE INDEX idx_estimation_requests_client_id ON estimation_requests(client_id);
CREATE INDEX idx_estimation_requests_status ON estimation_requests(status);
CREATE INDEX idx_estimation_requests_payment_status ON estimation_requests(payment_status);
CREATE INDEX idx_estimation_requests_created_at ON estimation_requests(created_at);
CREATE INDEX idx_estimation_requests_commune_id ON estimation_requests(commune_id);

CREATE INDEX idx_estimation_audit_log_estimation_id ON estimation_audit_log(estimation_id);
CREATE INDEX idx_estimation_audit_log_event_type ON estimation_audit_log(event_type);

CREATE INDEX idx_payment_transactions_estimation_id ON payment_transactions(estimation_id);
CREATE INDEX idx_payment_transactions_client_id ON payment_transactions(client_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- ============================================================
-- 6) ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_per_m2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coefficients ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_rules_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Communes: Public read, admin write
CREATE POLICY "Communes: Public read" ON communes
  FOR SELECT USING (true);

CREATE POLICY "Communes: Admin write" ON communes
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

CREATE POLICY "Communes: Admin update" ON communes
  FOR UPDATE USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

-- Zones: Public read, admin write
CREATE POLICY "Zones: Public read" ON zones
  FOR SELECT USING (true);

CREATE POLICY "Zones: Admin write" ON zones
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

CREATE POLICY "Zones: Admin update" ON zones
  FOR UPDATE USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

-- Price per m2: Public read, admin write
CREATE POLICY "Price per m2: Public read" ON price_per_m2
  FOR SELECT USING (true);

CREATE POLICY "Price per m2: Admin write" ON price_per_m2
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

-- Coefficients: Public read, admin write
CREATE POLICY "Coefficients: Public read" ON coefficients
  FOR SELECT USING (true);

CREATE POLICY "Coefficients: Admin write" ON coefficients
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

-- Options values: Public read, admin write
CREATE POLICY "Options values: Public read" ON options_values
  FOR SELECT USING (true);

CREATE POLICY "Options values: Admin write" ON options_values
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

-- Calculation rules version: Public read, admin write
CREATE POLICY "Calculation rules: Public read" ON calculation_rules_version
  FOR SELECT USING (true);

CREATE POLICY "Calculation rules: Admin write" ON calculation_rules_version
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

-- Legal mentions: Public read, admin write
CREATE POLICY "Legal mentions: Public read" ON legal_mentions
  FOR SELECT USING (true);

CREATE POLICY "Legal mentions: Admin write" ON legal_mentions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND role = 'admin'));

-- Estimation requests: Client read own, admin read all, client insert
CREATE POLICY "Estimation requests: Client read own" ON estimation_requests
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Estimation requests: Admin read all" ON estimation_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.user_id = auth.uid()
    AND org_members.role = 'admin'
  ));

CREATE POLICY "Estimation requests: Client insert" ON estimation_requests
  FOR INSERT
  WITH CHECK (auth.uid() = client_id AND is_client = TRUE);

CREATE POLICY "Estimation requests: Client update own" ON estimation_requests
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Estimation audit log: Admin read only
CREATE POLICY "Estimation audit: Admin read" ON estimation_audit_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.user_id = auth.uid()
    AND org_members.role = 'admin'
  ));

-- Payment transactions: Client read own, admin read all
CREATE POLICY "Payment transactions: Client read own" ON payment_transactions
  FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Payment transactions: Admin read all" ON payment_transactions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.user_id = auth.uid()
    AND org_members.role = 'admin'
  ));

-- ============================================================
-- 7) HELPER FUNCTIONS
-- ============================================================

-- Get active calculation rules version
CREATE OR REPLACE FUNCTION get_active_calculation_rules()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM calculation_rules_version
    WHERE is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current legal mentions
CREATE OR REPLACE FUNCTION get_legal_mention(reason TEXT)
RETURNS TABLE (id UUID, short_text TEXT, long_text TEXT, version INT) AS $$
BEGIN
  RETURN QUERY
  SELECT lm.id, lm.short_text, lm.long_text, lm.version
  FROM legal_mentions lm
  JOIN calculation_rules_version crv ON lm.version_id = crv.id
  WHERE lm.reason = $1
    AND crv.is_active = TRUE
  ORDER BY crv.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Log audit event
CREATE OR REPLACE FUNCTION log_estimation_event(
  est_id UUID,
  event_type TEXT,
  event_data JSONB,
  ip_addr INET DEFAULT NULL,
  agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO estimation_audit_log (
    estimation_id,
    event_type,
    event_data,
    user_ip_address,
    user_agent
  ) VALUES (est_id, event_type, event_data, ip_addr, agent);
END;
$$ LANGUAGE plpgsql;

-- Update estimation status
CREATE OR REPLACE FUNCTION update_estimation_status(
  est_id UUID,
  new_status TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE estimation_requests
  SET status = new_status, updated_at = CURRENT_TIMESTAMP
  WHERE id = est_id;
  
  PERFORM log_estimation_event(est_id, 'status_changed', jsonb_build_object('new_status', new_status));
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8) CREATED_BY UPDATE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculation_rules_version_set_created_by
BEFORE INSERT ON calculation_rules_version
FOR EACH ROW
EXECUTE FUNCTION set_created_by();
