-- ============================================================
-- SEED: OPERATIONAL MANAGEMENT DATA
-- Purpose: Add fictional data for testing operational features
-- ============================================================

-- Get org and properties IDs for seeding (assumes existing data from seed_demo_logements)
-- This script assumes at least one org and properties exist

-- Insert inventory items for each property
INSERT INTO inventory_items (property_id, item_name, category, quantity, condition, notes, last_checked_at)
SELECT 
  p.id,
  item_name,
  category,
  quantity,
  condition,
  notes,
  NOW() - INTERVAL '5 days'
FROM properties p
CROSS JOIN (
  VALUES
    ('Service de vaisselle 12 pièces', 'Vaisselle', 1, 'ok', 'Assiettes, bols, tasses'),
    ('Couteaux et fourchettes', 'Vaisselle', 24, 'ok', 'Ensemble couverts'),
    ('Casseroles', 'Électroménager', 3, 'ok', 'Différentes tailles'),
    ('Poêles antiadhésives', 'Électroménager', 2, 'ok', 'Bien entretenues'),
    ('Micro-ondes', 'Électroménager', 1, 'ok', 'Fonctionnel'),
    ('Cafetière', 'Électroménager', 1, 'à remplacer', 'Filtre usé'),
    ('Table de salle à manger', 'Mobilier', 1, 'ok', '6 places'),
    ('Canapé', 'Mobilier', 1, 'ok', 'Bien entretenu'),
    ('Lits', 'Mobilier', 3, 'ok', 'Sommiers et matelas'),
    ('Télévision 55"', 'Équipements', 1, 'ok', 'Smart TV'),
    ('Barbecue', 'Équipements', 1, 'HS', 'À réparer ou remplacer'),
    ('Lit bébé', 'Équipements', 1, 'ok', 'Avec matelas'),
    ('Chaises de jardin', 'Mobilier', 6, 'ok', 'En bon état')
) AS items(item_name, category, quantity, condition, notes)
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

-- Insert cleaning sessions scheduled around checkout dates
INSERT INTO cleaning_sessions (property_id, booking_id, scheduled_date, cleaning_type, duration_hours, is_completed, notes)
SELECT 
  p.id,
  b.id,
  b.check_out::DATE,
  'standard',
  3,
  FALSE,
  'Ménage standard après départ du client'
FROM properties p
LEFT JOIN bookings b ON p.id = b.property_id AND b.check_out > NOW()::DATE
WHERE p.is_published = TRUE
  AND b.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert historical cleaning sessions (completed)
INSERT INTO cleaning_sessions (property_id, booking_id, scheduled_date, cleaning_type, duration_hours, is_completed, completed_at, notes)
SELECT 
  p.id,
  b.id,
  b.check_out::DATE,
  CASE WHEN RANDOM() < 0.3 THEN 'approfondi' ELSE 'standard' END,
  CASE WHEN RANDOM() < 0.3 THEN 4.5 ELSE 3 END,
  TRUE,
  NOW() - INTERVAL '2 days',
  'Ménage complété'
FROM properties p
LEFT JOIN bookings b ON p.id = b.property_id AND b.check_out < NOW()::DATE AND b.check_out > (NOW() - INTERVAL '30 days')::DATE
WHERE p.is_published = TRUE
  AND b.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert linens inventory
INSERT INTO linens (property_id, linen_type, quantity, status, last_status_change_at)
SELECT 
  p.id,
  linen_type,
  quantity,
  'Disponible',
  NOW()
FROM properties p
CROSS JOIN (
  VALUES
    ('Draps', 4),
    ('Draps', 3),
    ('Draps', 2),
    ('Serviettes', 8),
    ('Serviettes', 6),
    ('Housses de couette', 3),
    ('Taies d''oreiller', 6),
    ('Taies d''oreiller', 4)
) AS linens_data(linen_type, quantity)
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

-- Update some linens to different statuses for variety
UPDATE linens
SET status = 'Sale',
    last_status_change_at = NOW()
WHERE property_id IN (
  SELECT id FROM properties WHERE is_published = TRUE LIMIT 1
)
  AND linen_type = 'Serviettes'
  AND RANDOM() < 0.5;

UPDATE linens
SET status = 'En lavage',
    last_status_change_at = NOW()
WHERE property_id IN (
  SELECT id FROM properties WHERE is_published = TRUE OFFSET 1 LIMIT 1
)
  AND linen_type = 'Draps'
  AND RANDOM() < 0.3;
