-- ============================================================
-- MIGRATION 004: SEED OPERATIONAL MANAGEMENT DATA
-- Purpose: Add realistic fictional data for testing operational features
-- ============================================================

-- Insert inventory items for each property (15 items per property)
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
    -- VAISSELLE
    ('Assiettes plates', 'Vaisselle', 12, 'ok', 'Service complet 12 couverts'),
    ('Bols céramique', 'Vaisselle', 8, 'ok', 'Petit-déjeuner'),
    ('Verres', 'Vaisselle', 20, 'ok', 'Différentes tailles'),
    ('Couverts (fourchettes, cuillères, couteaux)', 'Vaisselle', 30, 'ok', 'Ensemble complet'),
    ('Théières et cafetières', 'Vaisselle', 2, 'ok', 'Service à thé'),
    
    -- ÉLECTROMÉNAGER
    ('Cafetière Nespresso', 'Électroménager', 1, 'ok', 'Fonctionnelle'),
    ('Grille-pain 4 fentes', 'Électroménager', 1, 'ok', 'Avec décongélation'),
    ('Micro-ondes', 'Électroménager', 1, 'ok', 'Puissance 1000W'),
    ('Lave-vaisselle', 'Électroménager', 1, 'ok', 'Intégré, programme eco'),
    ('Réfrigérateur', 'Électroménager', 1, 'ok', '400 litres'),
    
    -- LITERIE
    ('Draps housses (140x200)', 'Literie', 8, 'ok', '100% coton'),
    ('Oreillers (65x65)', 'Literie', 8, 'ok', 'Garnissage plume'),
    ('Couettes hiver (240x260)', 'Literie', 4, 'ok', 'Couche thermique'),
    
    -- ÉQUIPEMENTS
    ('Télévision 65 pouces', 'Équipements', 1, 'ok', 'Smart TV 4K'),
    ('Barbecue gaz', 'Équipements', 1, 'à remplacer', 'Bouton thermostat cassé'),
    ('Chaises de jardin', 'Équipements', 6, 'ok', 'Bois teck'),
    ('Table de jardin', 'Équipements', 1, 'ok', 'Parasol inclus'),
    ('Lit bébé', 'Équipements', 1, 'ok', 'Avec matelas hypoallergénique'),
    ('Chaise haute', 'Équipements', 1, 'ok', 'Pliable'),
    ('Serviettes de plage', 'Équipements', 10, 'ok', 'Éponge 600g')
) AS items(item_name, category, quantity, condition, notes)
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

-- Insert cleaning sessions (historical + upcoming)
-- Past cleaning sessions (3 per property)
INSERT INTO cleaning_sessions (property_id, scheduled_date, cleaning_type, duration_hours, is_completed, completed_at, notes)
SELECT 
  p.id,
  (NOW() - INTERVAL '20 days')::DATE,
  'standard',
  3,
  TRUE,
  NOW() - INTERVAL '20 days',
  'Ménage standard après départ client'
FROM properties p
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO cleaning_sessions (property_id, scheduled_date, cleaning_type, duration_hours, is_completed, completed_at, notes)
SELECT 
  p.id,
  (NOW() - INTERVAL '13 days')::DATE,
  'approfondi',
  5,
  TRUE,
  NOW() - INTERVAL '13 days',
  'Ménage approfondi : vitres, tapis, canapé'
FROM properties p
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO cleaning_sessions (property_id, scheduled_date, cleaning_type, duration_hours, is_completed, completed_at, notes)
SELECT 
  p.id,
  (NOW() - INTERVAL '6 days')::DATE,
  'standard',
  3,
  TRUE,
  NOW() - INTERVAL '6 days',
  'Ménage standard'
FROM properties p
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

-- Upcoming cleaning sessions (2 per property)
INSERT INTO cleaning_sessions (property_id, scheduled_date, cleaning_type, duration_hours, is_completed, notes)
SELECT 
  p.id,
  (NOW() + INTERVAL '3 days')::DATE,
  'standard',
  3,
  FALSE,
  'Ménage prévu après départ client'
FROM properties p
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO cleaning_sessions (property_id, scheduled_date, cleaning_type, duration_hours, is_completed, notes)
SELECT 
  p.id,
  (NOW() + INTERVAL '10 days')::DATE,
  'standard',
  3,
  FALSE,
  'Ménage prévu après départ client'
FROM properties p
WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

-- Insert linens inventory
-- Multiple entries per type to show variety of statuses
INSERT INTO linens (property_id, linen_type, quantity, status, last_status_change_at)
SELECT p.id, 'Draps', 4, 'Disponible', NOW() FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Draps', 3, 'Propre', NOW() FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Draps', 2, 'Sale', NOW() - INTERVAL '1 day' FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Serviettes', 12, 'Disponible', NOW() FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Serviettes', 6, 'Sale', NOW() - INTERVAL '2 days' FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Serviettes', 4, 'En lavage', NOW() - INTERVAL '1 day' FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Housses de couette', 4, 'Disponible', NOW() FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Housses de couette', 2, 'Sale', NOW() - INTERVAL '1 day' FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Taies d''oreiller', 8, 'Disponible', NOW() FROM properties p WHERE p.is_published = TRUE
UNION ALL
SELECT p.id, 'Taies d''oreiller', 3, 'Sale', NOW() - INTERVAL '1 day' FROM properties p WHERE p.is_published = TRUE
ON CONFLICT DO NOTHING;

-- Insert demo bookings (if none exist)
-- This ensures we have arrivals/departures to display
INSERT INTO bookings (property_id, client_id, check_in, check_out, num_guests, total_price, status, created_at)
SELECT 
  p.id,
  (SELECT id FROM auth.users LIMIT 1),  -- Use first user if available
  (NOW() + INTERVAL '2 days')::DATE,
  (NOW() + INTERVAL '5 days')::DATE,
  4,
  900,
  'active',
  NOW()
FROM properties p
WHERE p.is_published = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.property_id = p.id 
    AND b.check_in >= NOW()::DATE
  )
ON CONFLICT DO NOTHING;

INSERT INTO bookings (property_id, client_id, check_in, check_out, num_guests, total_price, status, created_at)
SELECT 
  p.id,
  (SELECT id FROM auth.users LIMIT 1),
  (NOW() + INTERVAL '8 days')::DATE,
  (NOW() + INTERVAL '12 days')::DATE,
  6,
  1400,
  'active',
  NOW()
FROM properties p
WHERE p.is_published = TRUE
  AND (SELECT count(*) FROM bookings b WHERE b.property_id = p.id AND b.check_in >= NOW()::DATE) < 2
ON CONFLICT DO NOTHING;

