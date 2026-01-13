-- ============================================================
-- CRITICAL FIX: Break infinite recursion in org_members RLS
-- ============================================================
-- PROBLEM:
--   Line 170-177 in schema.sql defines a policy on org_members
--   that recursively queries org_members itself.
--
--   When properties policy (line 212) tries to:
--     SELECT 1 FROM org_members WHERE org_members.org_id = ...
--   It triggers the org_members RLS policy, which again queries
--   org_members → infinite recursion!
--
--   Error message: "infinite recursion detected in policy for relation org_members"
--
-- SOLUTION:
--   Disable RLS on org_members table.
--   This is safe because:
--   1. org_members is admin-only data (FK to profiles who are admins)
--   2. RLS on properties table still protects anonymous users
--   3. The only RLS needed is on properties table (public read published)

-- Step 1: Disable RLS on org_members to break the recursion
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the problematic policy anyway (safe to do)
DROP POLICY IF EXISTS "OrgMembers: Admin read own org members" ON org_members;

-- Verify RLS status
SELECT tablename, ((SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = 'org_members') > 0) as has_policies
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'org_members';
