-- ============================================================
-- JURAGITESHOLIDAY V1 - SUPABASE SCHEMA + RLS
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- orgs table (organization/tenant)
CREATE TABLE IF NOT EXISTS orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- org_members table (admin/staff users per org)
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, user_id)
);

-- profiles table (clients + org users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  is_client BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- properties table (rental units)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price_per_night DECIMAL(10, 2),
  max_guests INT,
  bedrooms INT,
  bathrooms INT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, slug)
);

-- property_photos table
CREATE TABLE IF NOT EXISTS property_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- availability_blocks table (booking windows)
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- booking_requests table (client requests)
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_guests INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- bookings table (confirmed bookings)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_guests INT NOT NULL,
  total_price DECIMAL(10, 2),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- loyalty_accounts table (client loyalty points)
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- loyalty_ledger table (audit trail for points)
CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loyalty_account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  points_delta INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Disable default RLS for tables initially, enable selectively
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORG POLICIES
-- ============================================================
-- Admins can read their org; clients cannot
CREATE POLICY "Orgs: Admin read own org" ON orgs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = orgs.id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- ORG_MEMBERS POLICIES
-- ============================================================
-- Admins can read their own org members
CREATE POLICY "OrgMembers: Admin read own org members" ON org_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
-- Everyone can read their own profile
CREATE POLICY "Profiles: Users read own profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Authenticated users can insert their own profile
CREATE POLICY "Profiles: Users insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Authenticated users can update their own profile
CREATE POLICY "Profiles: Users update own profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- PROPERTIES POLICIES
-- ============================================================
-- Public can read published properties
CREATE POLICY "Properties: Public read published" ON properties
  FOR SELECT
  USING (is_published = TRUE);

-- Admins can read all properties in their org
CREATE POLICY "Properties: Admin read own org properties" ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = properties.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can insert properties for their org (requires org_id context)
CREATE POLICY "Properties: Admin insert for own org" ON properties
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = properties.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can update their org properties
CREATE POLICY "Properties: Admin update own org properties" ON properties
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = properties.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = properties.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can delete their org properties
CREATE POLICY "Properties: Admin delete own org properties" ON properties
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = properties.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- PROPERTY_PHOTOS POLICIES
-- ============================================================
-- Public can read photos for published properties
CREATE POLICY "PropertyPhotos: Public read for published properties" ON property_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_photos.property_id
        AND p.is_published = TRUE
    )
  );

-- Admins can read photos for their org properties
CREATE POLICY "PropertyPhotos: Admin read for own org properties" ON property_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = property_photos.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can insert photos for their org properties
CREATE POLICY "PropertyPhotos: Admin insert for own org properties" ON property_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = property_photos.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can delete photos for their org properties
CREATE POLICY "PropertyPhotos: Admin delete for own org properties" ON property_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = property_photos.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- AVAILABILITY_BLOCKS POLICIES
-- ============================================================
-- Public can read availability for published properties
CREATE POLICY "AvailabilityBlocks: Public read for published properties" ON availability_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = availability_blocks.property_id
        AND p.is_published = TRUE
    )
  );

-- Admins can manage availability for their org properties
CREATE POLICY "AvailabilityBlocks: Admin manage for own org" ON availability_blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = availability_blocks.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- BOOKING_REQUESTS POLICIES
-- ============================================================
-- Clients can read their own booking requests
CREATE POLICY "BookingRequests: Clients read own requests" ON booking_requests
  FOR SELECT
  USING (client_id = auth.uid());

-- Clients can insert their own booking requests
CREATE POLICY "BookingRequests: Clients create requests" ON booking_requests
  FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Admins can read booking requests for their org properties
CREATE POLICY "BookingRequests: Admin read for own org properties" ON booking_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = booking_requests.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can update booking requests for their org
CREATE POLICY "BookingRequests: Admin update for own org" ON booking_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = booking_requests.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- BOOKINGS POLICIES
-- ============================================================
-- Clients can read their own bookings
CREATE POLICY "Bookings: Clients read own bookings" ON bookings
  FOR SELECT
  USING (client_id = auth.uid());

-- Admins can read bookings for their org properties
CREATE POLICY "Bookings: Admin read for own org properties" ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = bookings.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can insert bookings for their org properties
CREATE POLICY "Bookings: Admin create for own org" ON bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = bookings.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can update bookings for their org properties
CREATE POLICY "Bookings: Admin update for own org" ON bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = bookings.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================
-- Clients can read payments for their own bookings
CREATE POLICY "Payments: Clients read own booking payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = payments.booking_id
        AND b.client_id = auth.uid()
    )
  );

-- Admins can read payments for their org
CREATE POLICY "Payments: Admin read for own org" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN org_members om ON p.org_id = om.org_id
      WHERE b.id = payments.booking_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can create/update payments for their org
CREATE POLICY "Payments: Admin create/update for own org" ON payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN org_members om ON p.org_id = om.org_id
      WHERE b.id = payments.booking_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "Payments: Admin update for own org" ON payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN org_members om ON p.org_id = om.org_id
      WHERE b.id = payments.booking_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- LOYALTY_ACCOUNTS POLICIES
-- ============================================================
-- Clients can read their own loyalty account
CREATE POLICY "LoyaltyAccounts: Clients read own account" ON loyalty_accounts
  FOR SELECT
  USING (client_id = auth.uid());

-- Admins cannot directly manage (managed by bookings logic)
-- TODO: Add server-side function for admin loyalty operations if needed in v2

-- ============================================================
-- LOYALTY_LEDGER POLICIES
-- ============================================================
-- Clients can read their own loyalty ledger
CREATE POLICY "LoyaltyLedger: Clients read own ledger" ON loyalty_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM loyalty_accounts la
      WHERE la.id = loyalty_ledger.loyalty_account_id
        AND la.client_id = auth.uid()
    )
  );

-- Admins cannot directly insert (managed by bookings logic)
-- TODO: Add server-side function for audit trail if needed

-- ============================================================
-- INDEXES (for performance)
-- ============================================================
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_properties_org_id ON properties(org_id);
CREATE INDEX idx_properties_is_published ON properties(is_published);
CREATE INDEX idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX idx_availability_blocks_property_id ON availability_blocks(property_id);
CREATE INDEX idx_booking_requests_property_id ON booking_requests(property_id);
CREATE INDEX idx_booking_requests_client_id ON booking_requests(client_id);
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_loyalty_accounts_client_id ON loyalty_accounts(client_id);
CREATE INDEX idx_loyalty_ledger_loyalty_account_id ON loyalty_ledger(loyalty_account_id);
