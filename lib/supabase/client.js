import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Singleton instance - créé une seule fois
let supabaseClientInstance = null;

export const createClient = () => {
  // Si l'instance existe déjà, la retourner (singleton)
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  // Créer l'instance une seule fois
  supabaseClientInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return supabaseClientInstance;
};

// Exporter le client directement aussi (pour imports directs)
export const supabase = createClient();
