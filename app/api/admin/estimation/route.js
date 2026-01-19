/**
 * API Routes: Admin Estimation Management
 * Location: app/api/admin/estimation/
 */

// ============================================================
// GET /api/admin/estimation/config
// Purpose: Get all configuration (prices, coefficients, options)
// ============================================================
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section'); // 'pricing' | 'coefficients' | 'options' | 'all'

  try {
    // Verify admin authentication (via middleware)
    const adminCheck = await verifyAdminRole(request);
    if (!adminCheck.isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createAdminClient();
    const config = {};

    if (section === 'pricing' || section === 'all') {
      const { data: zones } = await supabase.from('zones').select('*').eq('is_active', true);
      const { data: communes } = await supabase.from('communes').select('*').eq('is_active', true);
      const { data: prices } = await supabase.from('price_per_m2').select('*');

      config.pricing = { zones, communes, prices };
    }

    if (section === 'coefficients' || section === 'all') {
      const { data: coefficients } = await supabase
        .from('coefficients')
        .select('*')
        .eq('is_active', true);

      config.coefficients = coefficients;
    }

    if (section === 'options' || section === 'all') {
      const { data: options } = await supabase
        .from('options_values')
        .select('*')
        .eq('is_active', true);

      config.options = options;
    }

    if (section === 'all') {
      const { data: rulesVersion } = await supabase
        .from('calculation_rules_version')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      config.activeRulesVersion = rulesVersion;
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Config fetch error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================================
// POST /api/admin/estimation/pricing/commune
// Purpose: Create/update commune pricing
// ============================================================
export async function POST(request) {
  const path = request.nextUrl.pathname;

  try {
    const adminCheck = await verifyAdminRole(request);
    if (!adminCheck.isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    const body = await request.json();

    if (path.includes('/pricing/commune')) {
      return handleCommunePricing(body, adminCheck.userId);
    }

    if (path.includes('/pricing/zone')) {
      return handleZonePricing(body, adminCheck.userId);
    }

    if (path.includes('/coefficients/update')) {
      return handleCoefficientUpdate(body, adminCheck.userId);
    }

    if (path.includes('/options/update')) {
      return handleOptionsUpdate(body, adminCheck.userId);
    }

    if (path.includes('/rules/version')) {
      return handleRulesVersioning(body, adminCheck.userId);
    }

    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), { status: 404 });
  } catch (err) {
    console.error('Admin endpoint error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Handle commune pricing update
 */
async function handleCommunePricing(data, userId) {
  const { communeId, pricePerM2, version } = data;

  if (!communeId || !pricePerM2 || !version) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Create new pricing record
    const { data: result, error } = await supabase
      .from('price_per_m2')
      .insert([
        {
          commune_id: communeId,
          price_per_m2: pricePerM2,
          version_id: version,
          is_default: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await logAdminAction(userId, 'commune_pricing_updated', {
      commune_id: communeId,
      new_price: pricePerM2
    });

    return new Response(JSON.stringify(result), { status: 201 });
  } catch (err) {
    console.error('Commune pricing error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Handle zone pricing update
 */
async function handleZonePricing(data, userId) {
  const { zoneId, pricePerM2, version } = data;

  if (!zoneId || !pricePerM2 || !version) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    const { data: result, error } = await supabase
      .from('price_per_m2')
      .insert([
        {
          zone_id: zoneId,
          price_per_m2: pricePerM2,
          version_id: version,
          is_default: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(userId, 'zone_pricing_updated', {
      zone_id: zoneId,
      new_price: pricePerM2
    });

    return new Response(JSON.stringify(result), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Handle coefficients update
 */
async function handleCoefficientUpdate(data, userId) {
  const { coefficientId, newValue, versionId } = data;

  if (!coefficientId || newValue === null || !versionId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Deactivate old version
    await supabase
      .from('coefficients')
      .update({ is_active: false })
      .eq('id', coefficientId);

    // Create new version
    const { data: coeff } = await supabase
      .from('coefficients')
      .select('*')
      .eq('id', coefficientId)
      .single();

    const { data: newCoeff, error } = await supabase
      .from('coefficients')
      .insert([
        {
          name: coeff.name,
          category: coeff.category,
          value_key: coeff.value_key,
          coefficient: newValue,
          description: coeff.description,
          version_id: versionId,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(userId, 'coefficient_updated', {
      old_value: coeff.coefficient,
      new_value: newValue,
      category: coeff.category
    });

    return new Response(JSON.stringify(newCoeff), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Handle options/amenities update
 */
async function handleOptionsUpdate(data, userId) {
  const { optionId, newValue, versionId } = data;

  if (!optionId || newValue === null || !versionId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Deactivate old
    await supabase
      .from('options_values')
      .update({ is_active: false })
      .eq('id', optionId);

    // Get original
    const { data: option } = await supabase
      .from('options_values')
      .select('*')
      .eq('id', optionId)
      .single();

    // Create new version
    const { data: newOption, error } = await supabase
      .from('options_values')
      .insert([
        {
          name: option.name,
          option_key: option.option_key,
          value_type: option.value_type,
          value: newValue,
          description: option.description,
          version_id: versionId,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(userId, 'option_value_updated', {
      option_name: option.name,
      old_value: option.value,
      new_value: newValue
    });

    return new Response(JSON.stringify(newOption), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Handle new calculation rules version
 */
async function handleRulesVersioning(data, userId) {
  const { ruleSet, description } = data;

  if (!ruleSet || !description) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Deactivate current version
    await supabase
      .from('calculation_rules_version')
      .update({ is_active: false })
      .eq('is_active', true);

    // Get next version number
    const { data: lastVersion } = await supabase
      .from('calculation_rules_version')
      .select('version_number')
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (lastVersion?.version_number || 0) + 1;

    // Create new version
    const { data: newVersion, error } = await supabase
      .from('calculation_rules_version')
      .insert([
        {
          version_number: nextVersion,
          rule_set: ruleSet,
          description: description,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(userId, 'rules_version_created', {
      version_number: nextVersion,
      description: description
    });

    return new Response(JSON.stringify(newVersion), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Log admin action for audit
 */
async function logAdminAction(userId, actionType, actionData) {
  try {
    const supabase = createAdminClient();
    await supabase
      .from('admin_audit_log')
      .insert([
        {
          user_id: userId,
          action_type: actionType,
          action_data: actionData,
          created_at: new Date().toISOString()
        }
      ]);
  } catch (err) {
    console.error('Admin audit logging error:', err);
  }
}

/**
 * Helper: Verify admin role
 */
async function verifyAdminRole(request) {
  // This would check authentication headers/cookies
  // For now, placeholder implementation
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { isAdmin: false, userId: null };
  }

  // In production: verify JWT token, check user role in org_members table
  return { isAdmin: true, userId: 'mock-user-id' };
}

/**
 * Helper: Create admin Supabase client
 */
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
