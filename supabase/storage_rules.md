-- ============================================================
-- STORAGE BUCKET RULES
-- Execute these rules in Supabase Storage UI or via SQL
-- ============================================================

-- Create bucket if it doesn't exist (done via UI typically)
-- Bucket name: property-photos
-- Path pattern: org/{org_id}/property/{property_id}/{uuid}.jpg

-- ============================================================
-- PUBLIC READ POLICY (anyone can read)
-- ============================================================
-- Policy name: "Public read"
-- Allowed operations: SELECT
-- Target paths: org/*/property/*/*
-- Authenticated: No

-- ============================================================
-- ADMIN UPLOAD POLICY
-- ============================================================
-- Policy name: "Authenticated admin upload"
-- Allowed operations: INSERT
-- Target paths: org/*/property/*/*
-- Authenticated: Yes
-- Condition: User is admin for the org_id in path

-- TODO: Implement via RLS check on auth.uid() against org_members table
-- Example condition pseudocode:
--   auth.uid() must be in org_members table with role = 'admin'
--   AND org_members.org_id must match the {org_id} in the path

-- ============================================================
-- ADMIN DELETE POLICY
-- ============================================================
-- Policy name: "Authenticated admin delete"
-- Allowed operations: DELETE
-- Target paths: org/*/property/*/*
-- Authenticated: Yes
-- Condition: Same as upload (user is admin for the org)

-- TODO: Implement via RLS check

-- ============================================================
-- NOTES
-- ============================================================
-- Path extraction in storage policies:
-- bucket_path will contain: org/{org_id}/property/{property_id}/{uuid}.jpg
-- Extract org_id from path segments for validation

-- This ensures:
-- 1. Anyone can view published property photos (via public read)
-- 2. Only org admins can upload/delete photos (via auth + org check)
-- 3. Photos are organized by org and property for easy management
