/**
 * estimation-calculator.js - Core valuation calculation engine
 * Purpose: Calculate property estimations with full auditability
 * Scope: Server-side ONLY - no client-side calculations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Calculate property estimation based on declared data
 * @param {Object} propertyData - Property information from client
 * @param {string} clientId - Client user ID
 * @returns {Promise<{estimation, error, logs}>}
 */
export async function calculateEstimation(propertyData, clientId) {
  const calculationLogs = [];

  try {
    // 1) Validate input data
    const validation = validatePropertyData(propertyData);
    if (!validation.valid) {
      return {
        estimation: null,
        error: new Error(validation.message),
        logs: [{ type: 'error', message: validation.message }]
      };
    }
    calculationLogs.push({ type: 'validation', message: 'Données validées' });

    // 2) Get active calculation rules
    const { data: rulesVersion, error: rulesError } = await supabase
      .from('calculation_rules_version')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (rulesError || !rulesVersion) {
      return {
        estimation: null,
        error: new Error('Règles de calcul non trouvées'),
        logs: calculationLogs
      };
    }
    calculationLogs.push({ type: 'rules', message: `Version ${rulesVersion.version_number}` });

    // 3) Fetch pricing and coefficients
    const { prices, error: priceError } = await getPricing(
      propertyData.communeId,
      propertyData.postalCode,
      rulesVersion.id
    );

    if (priceError) {
      return {
        estimation: null,
        error: priceError,
        logs: calculationLogs
      };
    }
    calculationLogs.push({ 
      type: 'pricing', 
      message: `Prix m²: ${prices.basePrice}€` 
    });

    // 4) Fetch coefficients
    const { coefficients, error: coefError } = await getCoefficients(
      propertyData.propertyType,
      propertyData.propertyCondition,
      rulesVersion.id
    );

    if (coefError) {
      return {
        estimation: null,
        error: coefError,
        logs: calculationLogs
      };
    }

    // 5) Fetch options/amenities adjustments
    const { options, error: optError } = await getOptionsAdjustments(
      propertyData.amenities,
      rulesVersion.id
    );

    if (optError) {
      return {
        estimation: null,
        error: optError,
        logs: calculationLogs
      };
    }

    // 6) Calculate step-by-step
    const calculation = performCalculation(
      propertyData,
      prices,
      coefficients,
      options,
      rulesVersion.rule_set
    );
    calculationLogs.push(...calculation.logs);

    // 7) Determine confidence level
    const dataCompleteness = calculateDataCompleteness(propertyData);
    const confidenceLevel = getConfidenceLevel(dataCompleteness, rulesVersion.rule_set);
    const margin = getConfidenceMargin(dataCompleteness, rulesVersion.rule_set);

    calculationLogs.push({
      type: 'confidence',
      message: `Complétude: ${dataCompleteness}% - Niveau: ${confidenceLevel} - Marge: ±${margin}%`
    });

    // 8) Generate valuation range
    const valuationRange = generateValuationRange(
      calculation.estimatedValue,
      margin,
      calculation.confidenceMargin
    );

    const estimation = {
      estimatedValueLow: valuationRange.low,
      estimatedValueMedium: calculation.estimatedValue,
      estimatedValueHigh: valuationRange.high,
      confidenceLevel,
      confidenceMargin: margin,
      dataCompleteness,
      calculationData: {
        baseValue: calculation.baseValue,
        coefficientsApplied: calculation.coefficientsApplied,
        amenitiesAdjustment: calculation.amenitiesAdjustment,
        terrainAdjustment: calculation.terrainAdjustment,
        finalCoefficient: calculation.finalCoefficient,
        pricing: prices
      }
    };

    calculationLogs.push({
      type: 'result',
      message: `Estimation: ${valuationRange.low}€ - ${calculation.estimatedValue}€ - ${valuationRange.high}€`
    });

    return {
      estimation,
      error: null,
      logs: calculationLogs,
      rulesVersionId: rulesVersion.id
    };
  } catch (err) {
    calculationLogs.push({ type: 'fatal_error', message: err.message });
    return {
      estimation: null,
      error: err,
      logs: calculationLogs
    };
  }
}

/**
 * Validate property data structure and values
 */
function validatePropertyData(data) {
  const required = ['propertyType', 'habitableArea', 'postalCode', 'propertyCondition'];
  const missing = required.filter(f => !data[f]);

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Champs manquants: ${missing.join(', ')}`
    };
  }

  if (data.habitableArea <= 0 || data.habitableArea > 500) {
    return {
      valid: false,
      message: 'Surface habitable invalide (1-500 m²)'
    };
  }

  if (data.terrainArea && (data.terrainArea < 0 || data.terrainArea > 100000)) {
    return {
      valid: false,
      message: 'Surface terrain invalide'
    };
  }

  return { valid: true };
}

/**
 * Get base price per m² for property location
 */
async function getPricing(communeId, postalCode, rulesVersionId) {
  try {
    // Try commune-specific pricing first
    if (communeId) {
      const { data: communePrice } = await supabase
        .from('price_per_m2')
        .select('price_per_m2, zones(name)')
        .eq('commune_id', communeId)
        .eq('version_id', rulesVersionId)
        .is('valid_until', null)
        .single();

      if (communePrice) {
        return {
          prices: {
            basePrice: parseFloat(communePrice.price_per_m2),
            source: `Commune: ${communePrice.zones.name}`,
            priceType: 'commune'
          },
          error: null
        };
      }
    }

    // Fallback to zone pricing via commune postal code
    const { data: commune } = await supabase
      .from('communes')
      .select('zone_id')
      .eq('postal_code', postalCode)
      .limit(1)
      .single();

    if (commune) {
      const { data: zonePrice } = await supabase
        .from('price_per_m2')
        .select('price_per_m2')
        .eq('zone_id', commune.zone_id)
        .eq('version_id', rulesVersionId)
        .is('valid_until', null)
        .single();

      if (zonePrice) {
        return {
          prices: {
            basePrice: parseFloat(zonePrice.price_per_m2),
            source: 'Zone géographique',
            priceType: 'zone'
          },
          error: null
        };
      }
    }

    // Fallback to default
    const { data: defaultPrice } = await supabase
      .from('price_per_m2')
      .select('price_per_m2')
      .eq('is_default', true)
      .eq('version_id', rulesVersionId)
      .limit(1)
      .single();

    if (defaultPrice) {
      return {
        prices: {
          basePrice: parseFloat(defaultPrice.price_per_m2),
          source: 'Prix par défaut',
          priceType: 'default'
        },
        error: null
      };
    }

    return {
      prices: null,
      error: new Error('Aucune tarification disponible')
    };
  } catch (err) {
    return {
      prices: null,
      error: err
    };
  }
}

/**
 * Get applicable coefficients
 */
async function getCoefficients(propertyType, propertyCondition, rulesVersionId) {
  try {
    const { data: coeffs, error } = await supabase
      .from('coefficients')
      .select('*')
      .eq('version_id', rulesVersionId)
      .eq('is_active', true)
      .in('category', ['property_type', 'property_condition']);

    if (error) {
      return { coefficients: null, error };
    }

    const typeCoeff = coeffs.find(c => c.category === 'property_type' && c.value_key === propertyType);
    const conditionCoeff = coeffs.find(c => c.category === 'property_condition' && c.value_key === propertyCondition);

    return {
      coefficients: {
        type: parseFloat(typeCoeff?.coefficient || 1),
        condition: parseFloat(conditionCoeff?.coefficient || 1)
      },
      error: null
    };
  } catch (err) {
    return { coefficients: null, error: err };
  }
}

/**
 * Get options/amenities adjustments
 */
async function getOptionsAdjustments(amenities, rulesVersionId) {
  try {
    if (!amenities || Object.keys(amenities).length === 0) {
      return {
        options: {
          fixedAdjustment: 0,
          percentageAdjustment: 0,
          items: []
        },
        error: null
      };
    }

    const selectedOptions = Object.keys(amenities).filter(k => amenities[k] === true);

    if (selectedOptions.length === 0) {
      return {
        options: {
          fixedAdjustment: 0,
          percentageAdjustment: 0,
          items: []
        },
        error: null
      };
    }

    const { data: optionsData, error } = await supabase
      .from('options_values')
      .select('*')
      .eq('version_id', rulesVersionId)
      .eq('is_active', true)
      .in('option_key', selectedOptions);

    if (error) {
      return { options: null, error };
    }

    let fixedTotal = 0;
    let percentageTotal = 0;

    const items = optionsData.map(opt => {
      if (opt.value_type === 'fixed') {
        fixedTotal += parseFloat(opt.value);
      } else if (opt.value_type === 'percentage') {
        percentageTotal += parseFloat(opt.value);
      }
      return {
        name: opt.name,
        type: opt.value_type,
        value: parseFloat(opt.value)
      };
    });

    return {
      options: {
        fixedAdjustment: fixedTotal,
        percentageAdjustment: percentageTotal,
        items
      },
      error: null
    };
  } catch (err) {
    return { options: null, error: err };
  }
}

/**
 * Perform complete calculation
 */
function performCalculation(
  propertyData,
  prices,
  coefficients,
  options,
  rulesSet
) {
  const logs = [];

  // 1) Base calculation: surface × price/m²
  const baseValue = propertyData.habitableArea * prices.basePrice;
  logs.push({
    type: 'calculation',
    message: `Base: ${propertyData.habitableArea}m² × ${prices.basePrice}€/m² = ${baseValue}€`
  });

  // 2) Apply property type & condition coefficients
  let valueAfterCoeffs = baseValue * coefficients.type * coefficients.condition;
  const combinedCoeff = coefficients.type * coefficients.condition;
  logs.push({
    type: 'calculation',
    message: `Après coefficients (type: ${coefficients.type}, état: ${coefficients.condition}): ${valueAfterCoeffs.toFixed(0)}€`
  });

  // 3) Terrain adjustment (stepped)
  const terrainCoeff = getTerrainCoefficient(propertyData.terrainArea || 0, rulesSet);
  let valueAfterTerrain = valueAfterCoeffs * terrainCoeff;
  logs.push({
    type: 'calculation',
    message: `Après ajustement terrain (coef: ${terrainCoeff}): ${valueAfterTerrain.toFixed(0)}€`
  });

  // 4) Apply percentage adjustments from options
  let valueAfterPercentage = valueAfterTerrain * (1 + (options.percentageAdjustment / 100));
  logs.push({
    type: 'calculation',
    message: `Après ajustements % options (${options.percentageAdjustment}%): ${valueAfterPercentage.toFixed(0)}€`
  });

  // 5) Apply fixed adjustments from options
  const finalValue = valueAfterPercentage + options.fixedAdjustment;
  logs.push({
    type: 'calculation',
    message: `Après ajustements fixes options (+${options.fixedAdjustment}€): ${finalValue.toFixed(0)}€`
  });

  return {
    baseValue: Math.round(baseValue),
    estimatedValue: Math.round(finalValue),
    coefficientsApplied: {
      propertyType: coefficients.type,
      propertyCondition: coefficients.condition,
      terrain: terrainCoeff
    },
    amenitiesAdjustment: {
      fixed: options.fixedAdjustment,
      percentage: options.percentageAdjustment
    },
    terrainAdjustment: terrainCoeff,
    finalCoefficient: combinedCoeff,
    logs
  };
}

/**
 * Get terrain coefficient based on stepped ranges
 */
function getTerrainCoefficient(terrainArea, rulesSet) {
  if (!terrainArea || terrainArea <= 0) {
    return 1.0;
  }

  const steps = rulesSet?.rules?.terrain_adjustment?.steps || [
    { area_min: 0, area_max: 500, factor: 1.0 },
    { area_min: 500, area_max: 2000, factor: 1.1 },
    { area_min: 2000, area_max: 5000, factor: 1.2 },
    { area_min: 5000, area_max: 100000, factor: 1.3 }
  ];

  const matchingStep = steps.find(s => terrainArea >= s.area_min && terrainArea <= s.area_max);
  return matchingStep ? matchingStep.factor : steps[steps.length - 1].factor;
}

/**
 * Calculate data completeness percentage
 */
function calculateDataCompleteness(propertyData) {
  const fields = [
    propertyData.propertyType,
    propertyData.habitableArea,
    propertyData.postalCode,
    propertyData.propertyCondition,
    propertyData.terrainArea ? 1 : 0,
    propertyData.constructionYear ? 1 : 0,
    propertyData.communeId ? 1 : 0,
    Object.keys(propertyData.amenities || {}).length > 0 ? 1 : 0
  ];

  const filledFields = fields.filter(f => f).length;
  return Math.round((filledFields / fields.length) * 100);
}

/**
 * Determine confidence level based on completeness
 */
function getConfidenceLevel(completeness, rulesSet) {
  const thresholds = rulesSet?.rules?.confidence_level_thresholds || {
    low: 0.5,
    medium: 0.75,
    high: 0.9
  };

  const ratio = completeness / 100;

  if (ratio >= thresholds.high) return 'high';
  if (ratio >= thresholds.medium) return 'medium';
  return 'low';
}

/**
 * Get confidence margin based on completeness
 */
function getConfidenceMargin(completeness, rulesSet) {
  const margins = rulesSet?.rules?.confidence_margins || {
    minimal_data: { low: -20, high: 20 },
    complete_data: { low: -10, high: 10 },
    very_complete_data: { low: -5, high: 5 }
  };

  if (completeness >= 85) return 5;
  if (completeness >= 60) return 10;
  return 20;
}

/**
 * Generate valuation range (low/high bounds)
 */
function generateValuationRange(medianValue, marginPercent, confidenceMargin) {
  const adjustment = medianValue * (marginPercent / 100);

  return {
    low: Math.round(medianValue - adjustment),
    high: Math.round(medianValue + adjustment)
  };
}

export default {
  calculateEstimation,
  validatePropertyData,
  calculateDataCompleteness,
  getConfidenceLevel
};
