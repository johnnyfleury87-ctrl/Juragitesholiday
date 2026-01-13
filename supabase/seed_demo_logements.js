#!/usr/bin/env node

/**
 * Seed Script: Demo Properties (Chalet + House with Hot Tub)
 * 
 * This script is SEPARATE from the main seed.sql to maintain clean
 * migration management. It adds 2 premium demo properties for testing.
 * 
 * MUST be run AFTER:
 *   1. schema.sql (tables created)
 *   2. seed.sql (organization created)
 * 
 * Usage:
 *   node supabase/seed_demo_logements.js
 * 
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing env variables in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '550e8400-e29b-41d4-a716-446655440001';

const DEMO_PROPERTIES = [
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    slug: 'chalet-des-sapins-12-personnes',
    title: 'Chalet des Sapins – 12 pers',
    description: 'Majestueux chalet de montagne pour 12 personnes avec piscine chauffée, sauna et équipements haut de gamme. Idéal pour les familles ou groupes d\'amis cherchant le luxe et le confort. Parking pour 4 voitures, local à skis, cheminée et cuisine entièrement équipée. Wifi fibre, accès facile en voiture. Check-in 16:00 / Check-out 10:00.',
    location: 'Les Rousses, Jura',
    price_per_night: 320.00,
    max_guests: 12,
    bedrooms: 5,
    bathrooms: 3,
    is_published: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    slug: 'maison-du-lac-8-personnes',
    title: 'Maison du Lac – 8 pers',
    description: 'Charmante maison avec vue sur la nature et jacuzzi extérieur. Terrasse spacieuse avec barbecue, cuisine équipée et jardin privé. Parfaite pour un séjour romantique ou en famille. Parking pour 2 voitures, ambiance tranquille et ressourçante. Animaux acceptés. Wifi inclus. Check-in 16:00 / Check-out 10:00.',
    location: 'Champagnole, Jura',
    price_per_night: 210.00,
    max_guests: 8,
    bedrooms: 4,
    bathrooms: 2,
    is_published: true,
  },
];

const DEMO_AVAILABILITY = [
  // Chalet (3 periods)
  { property_id: '550e8400-e29b-41d4-a716-446655440005', start_date: '2026-01-13', end_date: '2026-02-20', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440005', start_date: '2026-02-21', end_date: '2026-04-30', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440005', start_date: '2026-05-01', end_date: '2026-08-31', is_available: true },
  // Maison (3 periods)
  { property_id: '550e8400-e29b-41d4-a716-446655440006', start_date: '2026-01-13', end_date: '2026-02-28', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440006', start_date: '2026-03-01', end_date: '2026-05-31', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440006', start_date: '2026-06-01', end_date: '2026-09-30', is_available: true },
];

async function seedDemoProperties() {
  try {
    console.log('\n🌱 SEEDING DEMO PROPERTIES\n');
    console.log('This adds 2 premium properties for testing purposes.\n');

    // 1. Insert demo properties
    console.log('1️⃣  Inserting demo properties...');
    const propsWithOrg = DEMO_PROPERTIES.map(p => ({ ...p, org_id: ORG_ID }));
    
    const { data: insertedProps, error: propsError } = await supabase
      .from('properties')
      .insert(propsWithOrg)
      .select();

    if (propsError && propsError.code !== '23505') {
      throw new Error(`Failed to insert properties: ${propsError.message}`);
    }
    console.log(`   ✅ ${DEMO_PROPERTIES.length} demo properties inserted/skipped (if existed)\n`);

    // 2. Insert availability blocks
    console.log('2️⃣  Inserting availability periods...');
    const { data: insertedAvail, error: availError } = await supabase
      .from('availability_blocks')
      .insert(DEMO_AVAILABILITY)
      .select();

    if (availError && availError.code !== '23505') {
      throw new Error(`Failed to insert availability: ${availError.message}`);
    }
    console.log(`   ✅ ${DEMO_AVAILABILITY.length} availability periods inserted/skipped\n`);

    // 3. Verify
    console.log('3️⃣  Verifying...');
    const { data: props } = await supabase
      .from('properties')
      .select('id, slug, title, price_per_night, max_guests, is_published')
      .in('id', DEMO_PROPERTIES.map(p => p.id));

    console.log(`   ✅ Found ${props?.length || 0} demo properties in database\n`);

    console.log('🎉 Demo seed completed!\n');
    console.log('📊 Summary:');
    console.log(`   Chalet des Sapins: €320/night, 12 pers, 5 bed`);
    console.log(`   Maison du Lac: €210/night, 8 pers, 4 bed\n`);
    console.log('🌐 View at: /logements\n');

  } catch (error) {
    console.error('❌ Error during demo seed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDemoProperties();
}

module.exports = { seedDemoProperties };
