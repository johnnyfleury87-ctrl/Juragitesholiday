#!/usr/bin/env node
/**
 * ============================================================
 * DEBUG SCRIPT: Test Supabase Connection & Data
 * ============================================================
 * Usage: 
 *   npm run dev  (in another terminal to load .env.local)
 *   node supabase/debug_properties.js
 * 
 * Or set env vars directly:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node script.js
 */

const { createClient } = require('@supabase/supabase-js');

// Try loading from .env.local if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, that's ok - use process.env
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL =', SUPABASE_URL ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY =', SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

async function debugProperties() {
  console.log('\n🔍 DEBUG: Testing Supabase Properties Access\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Test 1: Fetch all properties (admin would see all)
    console.log('1️⃣  Fetching ALL properties (with is_published filter)...');
    const { data: allProps, error: allError } = await supabase
      .from('properties')
      .select('*');
    
    if (allError) {
      console.error('   ❌ Error:', allError.message);
    } else {
      console.log(`   ✅ Success! Found ${allProps?.length || 0} properties`);
      if (allProps && allProps.length > 0) {
        allProps.forEach(p => {
          console.log(`      - ${p.slug} (published: ${p.is_published})`);
        });
      }
    }
    
    // Test 2: Fetch published properties only
    console.log('\n2️⃣  Fetching PUBLISHED properties (is_published = true)...');
    const { data: publishedProps, error: pubError } = await supabase
      .from('properties')
      .select('id, slug, title, location, price_per_night, is_published')
      .eq('is_published', true);
    
    if (pubError) {
      console.error('   ❌ Error:', pubError.message);
      console.error('   This might be a RLS policy issue!');
    } else {
      console.log(`   ✅ Success! Found ${publishedProps?.length || 0} published properties`);
      if (publishedProps && publishedProps.length > 0) {
        publishedProps.forEach(p => {
          console.log(`      - ${p.title} (€${p.price_per_night}/night, ${p.location})`);
        });
      } else {
        console.log('   ⚠️  WARNING: No published properties found!');
        console.log('      Check if seed.sql was executed');
        console.log('      Or if all properties have is_published = false');
      }
    }
    
    // Test 3: Fetch limited (like homepage)
    console.log('\n3️⃣  Fetching LATEST 3 published properties (homepage query)...');
    const { data: latestProps, error: latestError } = await supabase
      .from('properties')
      .select('*')
      .eq('is_published', true)
      .limit(3)
      .order('created_at', { ascending: false });
    
    if (latestError) {
      console.error('   ❌ Error:', latestError.message);
    } else {
      console.log(`   ✅ Success! Found ${latestProps?.length || 0} latest properties`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY:\n');
    console.log(`✅ Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`);
    console.log(`✅ Using ANON key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    console.log(`📍 Published properties count: ${publishedProps?.length || 0}`);
    console.log(`📍 Total properties count: ${allProps?.length || 0}`);
    
    if (publishedProps && publishedProps.length > 0) {
      console.log('\n✅ SUCCESS! Properties should appear on the website.');
    } else {
      console.log('\n❌ ISSUE DETECTED: No published properties found.');
      console.log('   Action: Execute seed.sql or seed_demo_logements.sql in Supabase Dashboard');
    }
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugProperties().then(() => {
  console.log('\n');
  process.exit(0);
});
