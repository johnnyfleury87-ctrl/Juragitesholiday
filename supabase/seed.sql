-- ============================================================
-- SEED DATA FOR JURAGITESHOLIDAY V1
-- ============================================================
-- Run this script after schema.sql to populate initial data

-- Create organization
INSERT INTO orgs (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'JuraGites Inc')
ON CONFLICT DO NOTHING;

-- Create admin user (requires email verification in auth.users first)
-- TODO: Create admin user via Supabase Auth UI, then link:
-- INSERT INTO org_members (org_id, user_id, role) VALUES
--   ('550e8400-e29b-41d4-a716-446655440001'::uuid, '<admin_user_id>', 'admin');

-- Create sample properties
INSERT INTO properties 
  (id, org_id, slug, title, description, location, price_per_night, max_guests, bedrooms, bathrooms, is_published)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'gite-montagne-vue',
    'Gîte de Montagne avec Vue',
    'Charmant gîte en pierre avec vue panoramique sur les montagnes. Idéal pour une retraite tranquille.',
    'Saint-Claude, Jura',
    150.00,
    6,
    3,
    2,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'maison-lac-proximite',
    'Maison à Proximité du Lac',
    'Maison moderne avec accès direct aux pistes de ski. Confortable et bien équipée.',
    'Lac de Chalain',
    120.00,
    4,
    2,
    1,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'studio-cosy-centre-ville',
    'Studio Cosy en Centre-Ville',
    'Petit studio parfait pour un couple. Situé au cœur du village avec accès aux commerces.',
    'Oyonnax',
    80.00,
    2,
    1,
    1,
    false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'chalet-des-sapins-12-personnes',
    'Chalet des Sapins – 12 pers',
    'Majestueux chalet de montagne pour 12 personnes avec piscine chauffée, sauna et équipements haut de gamme. Idéal pour les familles ou groupes d''amis cherchant le luxe et le confort. Parking pour 4 voitures, local à skis, cheminée et cuisine entièrement équipée. Wifi fibre, accès facile en voiture. Check-in 16:00 / Check-out 10:00.',
    'Les Rousses, Jura',
    320.00,
    12,
    5,
    3,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440006'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'maison-du-lac-8-personnes',
    'Maison du Lac – 8 pers',
    'Charmante maison avec vue sur la nature et jacuzzi extérieur. Terrasse spacieuse avec barbecue, cuisine équipée et jardin privé. Parfaite pour un séjour romantique ou en famille. Parking pour 2 voitures, ambiance tranquille et ressourçante. Animaux acceptés. Wifi inclus. Check-in 16:00 / Check-out 10:00.',
    'Champagnole, Jura',
    210.00,
    8,
    4,
    2,
    true
  )
ON CONFLICT DO NOTHING;

-- Create availability blocks for all published properties
INSERT INTO availability_blocks (property_id, start_date, end_date, is_available) VALUES
  -- Gîte montagne
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '2026-01-15', '2026-01-31', true),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '2026-02-01', '2026-02-28', true),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '2026-03-01', '2026-04-30', true),
  -- Maison lac
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '2026-01-20', '2026-02-20', true),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '2026-03-01', '2026-04-30', true),
  -- CHALET NEW (full winter & spring availability)
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '2026-01-13', '2026-02-20', true),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '2026-02-21', '2026-04-30', true),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '2026-05-01', '2026-08-31', true),
  -- MAISON LAC NEW (full availability)
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, '2026-01-13', '2026-02-28', true),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, '2026-03-01', '2026-05-31', true),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, '2026-06-01', '2026-09-30', true)
ON CONFLICT DO NOTHING;

-- TODO: Add property photos after implementing storage integration
-- INSERT INTO property_photos (property_id, storage_path, display_order) VALUES
--   ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'org/550e8400-e29b-41d4-a716-446655440001/property/550e8400-e29b-41d4-a716-446655440002/photo1.jpg', 0),
--   ...

-- Notes:
-- 1. Admin user must be created via Supabase Auth first
-- 2. Client profiles are created automatically on signup
-- 3. Loyalty accounts are created automatically on signup
-- 4. Property photos require storage bucket setup
-- 5. New properties (IDs 5 & 6) are premium demo properties:
--    - Chalet des Sapins (12 pers): Pool, sauna, high-end, €320/night
--    - Maison du Lac (8 pers): Hot tub, garden, cozy, €210/night
