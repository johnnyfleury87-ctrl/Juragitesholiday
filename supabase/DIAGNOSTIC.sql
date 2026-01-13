-- ============================================================
-- DIAGNOSTIC SCRIPT - Check data and RLS status
-- ============================================================
-- Copy & paste this entire script into Supabase SQL Editor and execute
-- This will help diagnose why properties aren't showing

-- 1. Check if RLS is enabled on properties table
SELECT
  tablename,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = 'properties') as policies_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'properties';

-- 2. Check all RLS policies on properties table
SELECT
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- 3. Check organization exists
SELECT id, name, created_at FROM orgs;

-- 4. Check ALL properties (including unpublished)
SELECT
  id,
  org_id,
  slug,
  title,
  location,
  price_per_night,
  is_published,
  created_at
FROM properties
ORDER BY created_at DESC;

-- 5. Count properties by published status
SELECT
  is_published,
  COUNT(*) as count
FROM properties
GROUP BY is_published;

-- 6. Check availability blocks
SELECT
  COUNT(*) as total_blocks,
  COUNT(DISTINCT property_id) as properties_with_blocks
FROM availability_blocks;

-- 7. Try fetching published properties (simulating frontend query)
-- This is what the frontend should see:
SELECT
  *
FROM properties
WHERE is_published = TRUE
ORDER BY created_at DESC
LIMIT 3;

-- 8. Check for any policies that might block access
-- If you see policies with "NOT (is_published = TRUE)" or USING (FALSE),
-- that's blocking access
SELECT
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'properties'
  AND (qual ILIKE '%false%' OR with_check ILIKE '%false%');
