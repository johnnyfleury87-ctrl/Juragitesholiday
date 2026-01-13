-- ============================================================
-- MIGRATION 002: CLEANING SESSIONS MANAGEMENT
-- Purpose: Add cleaning task tracking tables
-- ============================================================

-- cleaning_sessions table
CREATE TABLE IF NOT EXISTS cleaning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  cleaning_type TEXT NOT NULL CHECK (cleaning_type IN ('standard', 'approfondi')) DEFAULT 'standard',
  duration_hours DECIMAL(5, 2) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cleaning_sessions_property_id ON cleaning_sessions(property_id);
CREATE INDEX idx_cleaning_sessions_booking_id ON cleaning_sessions(booking_id);
CREATE INDEX idx_cleaning_sessions_scheduled_date ON cleaning_sessions(scheduled_date);
CREATE INDEX idx_cleaning_sessions_is_completed ON cleaning_sessions(is_completed);

-- Enable RLS
ALTER TABLE cleaning_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can read cleaning sessions for their org properties
CREATE POLICY "CleaningSessions: Admin read for own org properties" ON cleaning_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = cleaning_sessions.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can manage cleaning sessions for their org properties
CREATE POLICY "CleaningSessions: Admin manage for own org properties" ON cleaning_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = cleaning_sessions.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );
