// Auth utilities
export async function getCurrentUser(supabaseClient) {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserRole(supabaseClient, userId) {
  try {
    // Check if user is org admin
    const { data, error } = await supabaseClient
      .from('org_members')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data?.role || null;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

export async function signUp(supabaseClient, email, password, fullName) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert([{
          id: data.user.id,
          email,
          full_name: fullName,
          is_client: true,
        }]);

      if (profileError) console.error('Error creating profile:', profileError);

      // Create loyalty account for client
      const { error: loyaltyError } = await supabaseClient
        .from('loyalty_accounts')
        .insert([{
          client_id: data.user.id,
          points_balance: 0,
        }]);

      if (loyaltyError) console.error('Error creating loyalty account:', loyaltyError);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(supabaseClient, email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut(supabaseClient) {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}
