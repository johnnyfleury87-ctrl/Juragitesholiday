#!/usr/bin/env node

/**
 * Seed Script for Supabase Demo Data
 * 
 * Usage: node seed.js
 * 
 * This script populates the database with 5 demo properties:
 * - 3 existing properties
 * - 2 new premium properties (Chalet + House with hot tub)
 * 
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL in .env.local
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * - OR pass them as environment variables
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '550e8400-e29b-41d4-a716-446655440001';
const ORG_NAME = 'JuraGites Inc';

const PROPERTIES = [
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    slug: 'gite-montagne-vue',
    title: 'Gîte de Montagne avec Vue',
    description: 'Charmant gîte en pierre avec vue panoramique sur les montagnes. Idéal pour une retraite tranquille.',
    location: 'Saint-Claude, Jura',
    price_per_night: 150.00,
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    is_published: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    slug: 'maison-lac-proximite',
    title: 'Maison à Proximité du Lac',
    description: 'Maison moderne avec accès direct aux pistes de ski. Confortable et bien équipée.',
    location: 'Lac de Chalain',
    price_per_night: 120.00,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    is_published: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    slug: 'studio-cosy-centre-ville',
    title: 'Studio Cosy en Centre-Ville',
    description: 'Petit studio parfait pour un couple. Situé au cœur du village avec accès aux commerces.',
    location: 'Oyonnax',
    price_per_night: 80.00,
    max_guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    is_published: false,
  },
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

const AVAILABILITY_BLOCKS = [
  // Gîte montagne
  { property_id: '550e8400-e29b-41d4-a716-446655440002', start_date: '2026-01-15', end_date: '2026-01-31', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440002', start_date: '2026-02-01', end_date: '2026-02-28', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440002', start_date: '2026-03-01', end_date: '2026-04-30', is_available: true },
  // Maison lac
  { property_id: '550e8400-e29b-41d4-a716-446655440003', start_date: '2026-01-20', end_date: '2026-02-20', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440003', start_date: '2026-03-01', end_date: '2026-04-30', is_available: true },
  // Chalet new
  { property_id: '550e8400-e29b-41d4-a716-446655440005', start_date: '2026-01-13', end_date: '2026-02-20', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440005', start_date: '2026-02-21', end_date: '2026-04-30', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440005', start_date: '2026-05-01', end_date: '2026-08-31', is_available: true },
  // Maison lac new
  { property_id: '550e8400-e29b-41d4-a716-446655440006', start_date: '2026-01-13', end_date: '2026-02-28', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440006', start_date: '2026-03-01', end_date: '2026-05-31', is_available: true },
  { property_id: '550e8400-e29b-41d4-a716-446655440006', start_date: '2026-06-01', end_date: '2026-09-30', is_available: true },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...\n');

    // 1. Create organization
    console.log('1️⃣  Creating organization...');
    const { error: orgError } = await supabase
      .from('orgs')
      .insert([{ id: ORG_ID, name: ORG_NAME }])
      .select();

    if (orgError && orgError.code !== '23505') { // 23505 = duplicate key
      throw new Error(`Failed to create org: ${orgError.message}`);
    }
    console.log('   ✅ Organization ready\n');

    // 2. Create properties
    console.log('2️⃣  Creating properties...');
    const propsWithOrg = PROPERTIES.map(p => ({ ...p, org_id: ORG_ID }));
    
    const { error: propsError } = await supabase
      .from('properties')
      .insert(propsWithOrg)
      .select();

    if (propsError && propsError.code !== '23505') {
      throw new Error(`Failed to create properties: ${propsError.message}`);
    }
    console.log(`   ✅ ${PROPERTIES.length} properties created/updated\n`);

    // 3. Create availability blocks
    console.log('3️⃣  Creating availability blocks...');
    const { error: availError } = await supabase
      .from('availability_blocks')
      .insert(AVAILABILITY_BLOCKS)
      .select();

    if (availError && availError.code !== '23505') {
      throw new Error(`Failed to create availability: ${availError.message}`);
    }
    console.log(`   ✅ ${AVAILABILITY_BLOCKS.length} availability blocks created\n`);

    // 4. Verify
    console.log('4️⃣  Verifying data...');
    const { data: props } = await supabase
      .from('properties')
      .select('id, slug, title, price_per_night, is_published')
      .eq('org_id', ORG_ID);

    const { data: avail } = await supabase
      .from('availability_blocks')
      .select('id')
      .in('property_id', PROPERTIES.map(p => p.id));

    console.log(`   ✅ Found ${props?.length || 0} properties`);
    console.log(`   ✅ Found ${avail?.length || 0} availability blocks\n`);

    console.log('🎉 Seed completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Organization: ${ORG_NAME}`);
    console.log(`   - Properties: ${props?.length || 0}`);
    console.log(`   - Availability periods: ${avail?.length || 0}`);
    console.log('\n🔗 View data at: https://app.supabase.com');
    console.log('🌐 Test at: http://localhost:3000/logements\n');

  } catch (error) {
    console.error('❌ Error during seed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
