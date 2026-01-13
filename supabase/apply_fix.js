#!/usr/bin/env node
/**
 * ============================================================
 * APPLY FIX: Execute fix_infinite_recursion.sql migration
 * ============================================================
 * This script applies the critical RLS fix directly
 */

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // ignore
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Need service key, not anon key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL =', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_KEY =', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  console.error('\n   Add these to your .env.local file');
  process.exit(1);
}

async function applyFix() {
  console.log('\n🔧 Applying RLS Infinite Recursion Fix...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Read the migration SQL
    const sqlPath = path.join(__dirname, 'migrations', 'fix_infinite_recursion.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('1️⃣  Executing migration SQL...\n');
    const { data, error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      console.error('❌ SQL Error:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!\n');
    
    // Test: Try fetching properties now
    console.log('2️⃣  Testing properties fetch...\n');
    const { data: props, error: testError } = await supabase
      .from('properties')
      .select('id, slug, title, is_published');
    
    if (testError) {
      console.error('❌ Still erroring:', testError.message);
      process.exit(1);
    }
    
    console.log(`✅ Properties fetch successful! Found ${props?.length || 0} properties\n`);
    
    if (props && props.length > 0) {
      props.forEach(p => console.log(`   - ${p.slug} (published: ${p.is_published})`));
    }
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyFix().then(() => {
  console.log('\n✅ FIX COMPLETE! Properties should now appear on the website.\n');
  process.exit(0);
});
