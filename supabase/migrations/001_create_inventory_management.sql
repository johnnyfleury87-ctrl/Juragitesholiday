-- ============================================================
-- MIGRATION 001: INVENTORY MANAGEMENT
-- Purpose: Add property inventory tracking tables
-- ============================================================

-- inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Vaisselle', 'Électroménager', 'Mobilier', 'Équipements', 'Autre')),
  quantity INT NOT NULL DEFAULT 1,
  condition TEXT NOT NULL CHECK (condition IN ('ok', 'à remplacer', 'HS')) DEFAULT 'ok',
  notes TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_inventory_items_property_id ON inventory_items(property_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_condition ON inventory_items(condition);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can read inventory for their org properties
CREATE POLICY "InventoryItems: Admin read for own org properties" ON inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = inventory_items.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can manage inventory for their org properties
CREATE POLICY "InventoryItems: Admin manage for own org properties" ON inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
        JOIN org_members om ON p.org_id = om.org_id
      WHERE p.id = inventory_items.property_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );
