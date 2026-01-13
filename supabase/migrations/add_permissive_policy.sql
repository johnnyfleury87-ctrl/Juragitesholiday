-- ============================================================
-- MIGRATION: Add explicit permissive policy for public read
-- ============================================================
-- This policy ensures anonymous users can read published properties
-- Execute this if the "Properties: Public read published" policy fails

-- Option 1: Add an explicit PERMISSIVE policy (most permissive)
-- This should ALWAYS allow reading published properties
CREATE POLICY "Properties: Public read published (permissive)" ON properties
  FOR SELECT
  USING (is_published = true)
  WITH CHECK (is_published = true);

-- Option 2: If you want even simpler (temporary V1 solution):
-- Comment out the policy below ONLY if Option 1 doesn't work
-- It disables RLS checking for SELECT completely
-- ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT policyname, permissive FROM pg_policies WHERE tablename = 'properties' ORDER BY policyname;

-- Test: fetch as anonymous user
-- This simulates the frontend (no auth token)
SET ROLE anon;
SELECT id, slug, title, is_published FROM properties WHERE is_published = true LIMIT 3;
RESET ROLE;
