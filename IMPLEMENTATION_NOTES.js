// Supabase Client Setup
// This file demonstrates correct Supabase client usage

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * BROWSER CLIENT (Client Components)
 * Use this in 'use client' components
 */
export const createClientInstance = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

/**
 * SERVER CLIENT (Server Components/Functions)
 * Use this with cookie handling
 */
export const createServerInstance = (cookieStore) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
};

/**
 * KEY IMPLEMENTATION NOTES:
 * 
 * 1. AUTHENTICATION FLOW:
 *    - signUp() → creates profile + loyalty_account automatically
 *    - signIn() → checks org_members for admin role
 *    - signOut() → clears session
 * 
 * 2. AUTH GUARDS:
 *    - withAuth() → Redirects to /login if not authenticated
 *    - withAdminAuth() → Redirects to / if not admin role
 * 
 * 3. RLS SECURITY:
 *    - ALL database access is controlled by Supabase RLS policies
 *    - Frontend guards are for UX only
 *    - Never trust frontend validation for security
 * 
 * 4. BOOKING WORKFLOW:
 *    - Client creates booking_request (status: pending)
 *    - Admin accepts: creates booking, payment, updates request status
 *    - Admin marks paid: creates loyalty_ledger entry
 * 
 * 5. STORAGE:
 *    - Bucket: property-photos
 *    - Path: org/{org_id}/property/{property_id}/{uuid}.jpg
 *    - Public read via RLS policy
 * 
 * 6. ADMIN ACCESS:
 *    - Keyboard shortcut Ctrl+Shift+A on homepage
 *    - Checks if target is not input/textarea
 *    - Shows temporary button for 3 seconds
 *    - UI-only, real protection via Supabase RLS
 */
