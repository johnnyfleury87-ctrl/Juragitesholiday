/**
 * estim-auth.js - Authentication service for estimation module clients
 * Purpose: User registration, login, profile management
 * Scope: Clients ONLY (non-admin users)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Register a new client user
 * @param {string} email - User email
 * @param {string} password - User password (min 8 chars recommended)
 * @param {Object} profileData - { firstName, lastName, phone? }
 * @returns {Promise<{user, error}>}
 */
export async function registerClient(email, password, profileData) {
  if (!email || !password || !profileData.firstName || !profileData.lastName) {
    return {
      user: null,
      error: new Error('Email, mot de passe, nom et prénom sont obligatoires')
    };
  }

  if (password.length < 8) {
    return {
      user: null,
      error: new Error('Le mot de passe doit contenir au moins 8 caractères')
    };
  }

  try {
    // 1) Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone || null
        }
      }
    });

    if (authError) {
      return { user: null, error: authError };
    }

    // 2) Create profile record
    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: `${profileData.firstName} ${profileData.lastName}`,
          phone: profileData.phone || null,
          is_client: true
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return { user: authData.user, error: profileError };
    }

    return {
      user: {
        ...authData.user,
        profile: profileResult
      },
      error: null
    };
  } catch (err) {
    return { user: null, error: err };
  }
}

/**
 * Login existing client user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, error}>}
 */
export async function loginClient(email, password) {
  if (!email || !password) {
    return {
      user: null,
      error: new Error('Email et mot de passe requis')
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { user: null, error };
    }

    // Fetch client profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    return {
      user: {
        ...data.user,
        profile: profile || null
      },
      error: null
    };
  } catch (err) {
    return { user: null, error: err };
  }
}

/**
 * Logout current user
 * @returns {Promise<{error}>}
 */
export async function logoutClient() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current authenticated user
 * @returns {Promise<{user, error}>}
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: error || new Error('Not authenticated') };
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      user: {
        ...user,
        profile: profile || null
      },
      error: null
    };
  } catch (err) {
    return { user: null, error: err };
  }
}

/**
 * Update client profile
 * @param {string} userId - User ID
 * @param {Object} updates - { firstName?, lastName?, phone? }
 * @returns {Promise<{profile, error}>}
 */
export async function updateClientProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.firstName && updates.lastName 
          ? `${updates.firstName} ${updates.lastName}`
          : undefined,
        phone: updates.phone
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (err) {
    return { profile: null, error: err };
  }
}

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<{error}>}
 */
export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 8) {
    return { error: new Error('Nouveau mot de passe: minimum 8 caractères') };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<{error}>}
 */
export async function requestPasswordReset(email) {
  if (!email) {
    return { error: new Error('Email requis') };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/estimation/reset-password`
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Reset password with token
 * @param {string} newPassword - New password
 * @returns {Promise<{error}>}
 */
export async function confirmPasswordReset(newPassword) {
  if (!newPassword || newPassword.length < 8) {
    return { error: new Error('Minimum 8 caractères requis') };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Check if email is already registered
 * @param {string} email - Email to check
 * @returns {Promise<{exists, error}>}
 */
export async function checkEmailExists(email) {
  if (!email) {
    return { exists: false, error: new Error('Email requis') };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('email', email);

    if (error) {
      return { exists: false, error };
    }

    return {
      exists: (data?.length || 0) > 0,
      error: null
    };
  } catch (err) {
    return { exists: false, error: err };
  }
}

/**
 * Get user estimation history
 * @param {string} userId - User ID
 * @param {Object} options - { limit?, offset?, status? }
 * @returns {Promise<{estimations, total, error}>}
 */
export async function getUserEstimations(userId, options = {}) {
  const { limit = 20, offset = 0, status = null } = options;

  try {
    let query = supabase
      .from('estimation_requests')
      .select('*', { count: 'exact' })
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      return { estimations: [], total: 0, error };
    }

    return {
      estimations: data || [],
      total: count || 0,
      error: null
    };
  } catch (err) {
    return { estimations: [], total: 0, error: err };
  }
}

export default {
  registerClient,
  loginClient,
  logoutClient,
  getCurrentUser,
  updateClientProfile,
  updatePassword,
  requestPasswordReset,
  confirmPasswordReset,
  checkEmailExists,
  getUserEstimations
};
