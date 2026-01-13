#!/usr/bin/env node

/**
 * SEED SCRIPT: Operational Management Data
 * Run this to populate operational data in Supabase
 * 
 * Usage: node supabase/seed_operations.js
 * Environment: needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const INVENTORY_TEMPLATE = [
  // VAISSELLE
  { name: 'Assiettes plates', category: 'Vaisselle', quantity: 12, condition: 'ok', notes: 'Service complet 12 couverts' },
  { name: 'Bols céramique', category: 'Vaisselle', quantity: 8, condition: 'ok', notes: 'Petit-déjeuner' },
  { name: 'Verres', category: 'Vaisselle', quantity: 20, condition: 'ok', notes: 'Différentes tailles' },
  { name: 'Couverts (fourchettes, cuillères, couteaux)', category: 'Vaisselle', quantity: 30, condition: 'ok', notes: 'Ensemble complet' },
  { name: 'Théières et cafetières', category: 'Vaisselle', quantity: 2, condition: 'ok', notes: 'Service à thé' },

  // ÉLECTROMÉNAGER
  { name: 'Cafetière Nespresso', category: 'Électroménager', quantity: 1, condition: 'ok', notes: 'Fonctionnelle' },
  { name: 'Grille-pain 4 fentes', category: 'Électroménager', quantity: 1, condition: 'ok', notes: 'Avec décongélation' },
  { name: 'Micro-ondes', category: 'Électroménager', quantity: 1, condition: 'ok', notes: 'Puissance 1000W' },
  { name: 'Lave-vaisselle', category: 'Électroménager', quantity: 1, condition: 'ok', notes: 'Intégré, programme eco' },
  { name: 'Réfrigérateur', category: 'Électroménager', quantity: 1, condition: 'ok', notes: '400 litres' },

  // LITERIE
  { name: 'Draps housses (140x200)', category: 'Literie', quantity: 8, condition: 'ok', notes: '100% coton' },
  { name: 'Oreillers (65x65)', category: 'Literie', quantity: 8, condition: 'ok', notes: 'Garnissage plume' },
  { name: 'Couettes hiver (240x260)', category: 'Literie', quantity: 4, condition: 'ok', notes: 'Couche thermique' },

  // ÉQUIPEMENTS
  { name: 'Télévision 65 pouces', category: 'Équipements', quantity: 1, condition: 'ok', notes: 'Smart TV 4K' },
  { name: 'Barbecue gaz', category: 'Équipements', quantity: 1, condition: 'à remplacer', notes: 'Bouton thermostat cassé' },
  { name: 'Chaises de jardin', category: 'Équipements', quantity: 6, condition: 'ok', notes: 'Bois teck' },
  { name: 'Table de jardin', category: 'Équipements', quantity: 1, condition: 'ok', notes: 'Parasol inclus' },
  { name: 'Lit bébé', category: 'Équipements', quantity: 1, condition: 'ok', notes: 'Avec matelas hypoallergénique' },
  { name: 'Chaise haute', category: 'Équipements', quantity: 1, condition: 'ok', notes: 'Pliable' },
  { name: 'Serviettes de plage', category: 'Équipements', quantity: 10, condition: 'ok', notes: 'Éponge 600g' },
];

async function seedOperationalData() {
  console.log('🌱 Démarrage du seed des données opérationnelles...\n');

  try {
    // Get all published properties
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id')
      .eq('is_published', true);

    if (propsError) throw propsError;

    if (!properties || properties.length === 0) {
      console.warn('⚠️  Aucun logement publié trouvé. Seed interrompu.');
      return;
    }

    console.log(`✅ ${properties.length} logement(s) publié(s) trouvé(s)\n`);

    for (const property of properties) {
      console.log(`📦 Seed pour logement: ${property.id}`);

      // 1. Inventory items
      const inventoryData = INVENTORY_TEMPLATE.map(item => ({
        property_id: property.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        condition: item.condition,
        notes: item.notes,
        last_checked_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { error: invError } = await supabase
        .from('inventory_items')
        .insert(inventoryData);

      if (!invError) {
        console.log(`   ✓ ${inventoryData.length} items d'inventaire`);
      } else if (invError.code !== 'PGRST116') { // Ignore duplicate key errors
        console.warn(`   ⚠️  Inventaire: ${invError.message}`);
      }

      // 2. Cleaning sessions (historical + upcoming)
      const now = new Date();
      const cleaningSessions = [
        {
          property_id: property.id,
          scheduled_date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cleaning_type: 'standard',
          duration_hours: 3,
          is_completed: true,
          completed_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Ménage standard après départ client',
        },
        {
          property_id: property.id,
          scheduled_date: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cleaning_type: 'approfondi',
          duration_hours: 5,
          is_completed: true,
          completed_at: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Ménage approfondi: vitres, tapis, canapé',
        },
        {
          property_id: property.id,
          scheduled_date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cleaning_type: 'standard',
          duration_hours: 3,
          is_completed: true,
          completed_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Ménage standard',
        },
        {
          property_id: property.id,
          scheduled_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cleaning_type: 'standard',
          duration_hours: 3,
          is_completed: false,
          notes: 'Ménage prévu après départ client',
        },
        {
          property_id: property.id,
          scheduled_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cleaning_type: 'standard',
          duration_hours: 3,
          is_completed: false,
          notes: 'Ménage prévu après départ client',
        },
      ];

      const { error: cleanError } = await supabase
        .from('cleaning_sessions')
        .insert(cleaningSessions);

      if (!cleanError) {
        console.log(`   ✓ ${cleaningSessions.length} sessions de ménage`);
      } else if (cleanError.code !== 'PGRST116') {
        console.warn(`   ⚠️  Ménage: ${cleanError.message}`);
      }

      // 3. Linens
      const linensData = [
        { property_id: property.id, linen_type: 'Draps', quantity: 4, status: 'Disponible' },
        { property_id: property.id, linen_type: 'Draps', quantity: 3, status: 'Propre' },
        { property_id: property.id, linen_type: 'Draps', quantity: 2, status: 'Sale' },
        { property_id: property.id, linen_type: 'Serviettes', quantity: 12, status: 'Disponible' },
        { property_id: property.id, linen_type: 'Serviettes', quantity: 6, status: 'Sale' },
        { property_id: property.id, linen_type: 'Serviettes', quantity: 4, status: 'En lavage' },
        { property_id: property.id, linen_type: 'Housses de couette', quantity: 4, status: 'Disponible' },
        { property_id: property.id, linen_type: 'Housses de couette', quantity: 2, status: 'Sale' },
        { property_id: property.id, linen_type: 'Taies d\'oreiller', quantity: 8, status: 'Disponible' },
        { property_id: property.id, linen_type: 'Taies d\'oreiller', quantity: 3, status: 'Sale' },
      ];

      const { error: linensError } = await supabase
        .from('linens')
        .insert(linensData);

      if (!linensError) {
        console.log(`   ✓ ${linensData.length} entrées de linge`);
      } else if (linensError.code !== 'PGRST116') {
        console.warn(`   ⚠️  Linge: ${linensError.message}`);
      }

      console.log('');
    }

    console.log('✅ Seed des données opérationnelles complété!\n');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  }
}

seedOperationalData();
