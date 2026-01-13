-- ============================================================
-- MIGRATION 003: LINENS MANAGEMENT
-- Purpose: Add linen stock tracking with mandatory statuses
-- ============================================================

-- linens table
CREATE TABLE IF NOT EXISTS linens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  linen_type TEXT NOT NULL CHECK (linen_type IN ('Draps', 'Serviettes', 'Housses de couette', 'Taies d''oreiller', 'Autre')),
  quantity INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('Disponible', 'Propre', 'Sale', 'En lavage', 'Manquant')) DEFAULT 'Disponible',
  last_status_change_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_linens_property_id ON linens(property_id);
CREATE INDEX idx_linens_status ON linens(status);
CREATE INDEX idx_linens_linen_type ON linens(linen_type);

-- Enable RLS
ALTER TABLE linens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can read linens for their org properties
CREATE POLICY "Linens: Admin read for own org properties" ON linens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = linens.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can manage linens for their org properties
CREATE POLICY "Linens: Admin manage for own org properties" ON linens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = linens.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );
