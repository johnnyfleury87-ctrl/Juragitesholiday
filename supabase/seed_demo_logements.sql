-- ============================================================
-- DEMO DATA: 2 PREMIUM PROPERTIES FOR TESTING
-- ============================================================
-- This script adds demo data ONLY - it must be run AFTER schema.sql
-- and the main seed.sql (which creates the organization).
--
-- IMPORTANT: This seed is SEPARATE from seed.sql to maintain
-- clean migration management. It is purely for demo/testing.
--
-- Usage:
--   Via Supabase SQL Editor: Copy & paste entire content, execute
--   Via Supabase CLI: supabase db push && supabase seed run
--   Via custom script: psql -h <host> -U <user> -d <db> -f seed_demo_logements.sql

-- ============================================================
-- VERIFY ORG EXISTS (created by main seed.sql)
-- ============================================================
-- The organization should already exist from seed.sql:
-- INSERT INTO orgs (id, name) VALUES
--   ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'JuraGites Inc')


-- ============================================================
-- ADD 2 PREMIUM DEMO PROPERTIES
-- ============================================================

INSERT INTO properties 
  (id, org_id, slug, title, description, location, price_per_night, max_guests, bedrooms, bathrooms, is_published)
VALUES
  -- DEMO 1: LUXURY CHALET WITH POOL & SAUNA
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
  -- DEMO 2: COMFORTABLE HOUSE WITH HOT TUB
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


-- ============================================================
-- ADD AVAILABILITY PERIODS FOR DEMO PROPERTIES
-- ============================================================

INSERT INTO availability_blocks (property_id, start_date, end_date, is_available) VALUES
  -- CHALET (3 periods - winter/spring/summer 2026)
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '2026-01-13', '2026-02-20', true),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '2026-02-21', '2026-04-30', true),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '2026-05-01', '2026-08-31', true),
  
  -- MAISON (3 periods - full coverage 2026)
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, '2026-01-13', '2026-02-28', true),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, '2026-03-01', '2026-05-31', true),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, '2026-06-01', '2026-09-30', true)
ON CONFLICT DO NOTHING;


-- ============================================================
-- NOTES
-- ============================================================
-- 1. Demo properties use fixed UUIDs ending in 05 & 06
-- 2. Both properties are published (is_published = true)
-- 3. Availability covers Jan-Sep 2026
-- 4. These are demo fixtures - safe to delete if needed
-- 5. Original seed.sql (3 properties) remains untouched
-- 6. Total: 5 properties (3 original + 2 demo)

