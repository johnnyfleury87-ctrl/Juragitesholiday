/**
 * audit-service.js - Complete auditability and traceability
 * Purpose: Log all events for estimation lifecycle
 * Scope: Immutable event logging for legal compliance
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Log estimation creation
 */
export async function logEstimationCreated(estimationId, clientId, propertyData, ipAddress, userAgent) {
  return logEvent(estimationId, 'created', {
    client_id: clientId,
    property_data: {
      type: propertyData.propertyType,
      surface: propertyData.habitableArea,
      postal_code: propertyData.postalCode,
      condition: propertyData.propertyCondition
    },
    timestamp: new Date().toISOString()
  }, ipAddress, userAgent);
}

/**
 * Log estimation submission (after form completion)
 */
export async function logEstimationSubmitted(estimationId, dataCompleteness, ipAddress, userAgent) {
  return logEvent(estimationId, 'submitted', {
    data_completeness: dataCompleteness,
    submission_time: new Date().toISOString()
  }, ipAddress, userAgent);
}

/**
 * Log legal consent acceptance
 */
export async function logLegalConsentAccepted(
  estimationId,
  reason,
  consentText,
  ipAddress,
  userAgent,
  timestamp
) {
  return logEvent(estimationId, 'legal_consent_accepted', {
    reason: reason,
    consent_text_accepted: consentText,
    consent_time: timestamp || new Date().toISOString(),
    client_ip: ipAddress
  }, ipAddress, userAgent);
}

/**
 * Log payment initiation
 */
export async function logPaymentInitiated(estimationId, paymentIntentId, amount, ipAddress, userAgent) {
  return logEvent(estimationId, 'payment_initiated', {
    payment_intent_id: paymentIntentId,
    amount_cents: amount,
    currency: 'EUR',
    timestamp: new Date().toISOString()
  }, ipAddress, userAgent);
}

/**
 * Log payment completion
 */
export async function logPaymentCompleted(
  estimationId,
  transactionId,
  amount,
  provider,
  ipAddress,
  userAgent
) {
  return logEvent(estimationId, 'payment_completed', {
    transaction_id: transactionId,
    amount: amount,
    provider: provider,
    timestamp: new Date().toISOString()
  }, ipAddress, userAgent);
}

/**
 * Log calculation execution
 */
export async function logCalculationExecuted(
  estimationId,
  rulesVersionId,
  calculationInputs,
  calculationResults,
  ipAddress,
  userAgent
) {
  return logEvent(estimationId, 'calculated', {
    rules_version_id: rulesVersionId,
    inputs: {
      habitable_area: calculationInputs.habitable_area,
      property_type: calculationInputs.property_type,
      condition: calculationInputs.property_condition,
      amenities_count: Object.keys(calculationInputs.amenities || {}).length
    },
    results: {
      estimated_value_low: calculationResults.estimatedValueLow,
      estimated_value_medium: calculationResults.estimatedValueMedium,
      estimated_value_high: calculationResults.estimatedValueHigh,
      confidence_level: calculationResults.confidenceLevel,
      confidence_margin: calculationResults.confidenceMargin
    },
    execution_time: new Date().toISOString()
  }, ipAddress, userAgent);
}

/**
 * Log PDF generation
 */
export async function logPDFGenerated(
  estimationId,
  storagePath,
  fileName,
  fileSizeBytes,
  ipAddress,
  userAgent
) {
  return logEvent(estimationId, 'pdf_generated', {
    storage_path: storagePath,
    file_name: fileName,
    file_size_bytes: fileSizeBytes,
    generation_time: new Date().toISOString()
  }, ipAddress, userAgent);
}

/**
 * Log result viewed by client
 */
export async function logResultViewed(
  estimationId,
  viewedAt,
  viewingDuration,
  ipAddress,
  userAgent
) {
  return logEvent(estimationId, 'result_viewed', {
    viewed_time: viewedAt || new Date().toISOString(),
    viewing_duration_seconds: viewingDuration,
    client_ip: ipAddress
  }, ipAddress, userAgent);
}

/**
 * Log PDF download
 */
export async function logPDFDownloaded(
  estimationId,
  downloadTime,
  ipAddress,
  userAgent
) {
  return logEvent(estimationId, 'pdf_downloaded', {
    download_time: downloadTime || new Date().toISOString(),
    client_ip: ipAddress
  }, ipAddress, userAgent);
}

/**
 * Log estimation cancellation
 */
export async function logEstimationCancelled(
  estimationId,
  reason,
  cancellationTime,
  ipAddress,
  userAgent
) {
  return logEvent(estimationId, 'cancelled', {
    reason: reason,
    cancellation_time: cancellationTime || new Date().toISOString(),
    client_ip: ipAddress
  }, ipAddress, userAgent);
}

/**
 * Log refund request
 */
export async function logRefundRequested(
  estimationId,
  refundId,
  amount,
  reason,
  ipAddress,
  userAgent
) {
  return logEvent(estimationId, 'refund_requested', {
    refund_id: refundId,
    amount: amount,
    reason: reason,
    request_time: new Date().toISOString(),
    client_ip: ipAddress
  }, ipAddress, userAgent);
}

/**
 * Get complete audit trail for estimation
 */
export async function getAuditTrail(estimationId, clientId = null) {
  try {
    let query = supabase
      .from('estimation_audit_log')
      .select('*')
      .eq('estimation_id', estimationId)
      .order('created_at', { ascending: true });

    const { data: events, error } = await query;

    if (error) {
      return {
        events: [],
        error: error
      };
    }

    return {
      events: events || [],
      error: null
    };
  } catch (err) {
    return {
      events: [],
      error: err
    };
  }
}

/**
 * Get all payment transactions for estimation
 */
export async function getPaymentAuditTrail(estimationId, clientId = null) {
  try {
    let query = supabase
      .from('payment_transactions')
      .select('*')
      .eq('estimation_id', estimationId)
      .order('created_at', { ascending: true });

    const { data: transactions, error } = await query;

    if (error) {
      return {
        transactions: [],
        error: error
      };
    }

    return {
      transactions: transactions || [],
      error: null
    };
  } catch (err) {
    return {
      transactions: [],
      error: err
    };
  }
}

/**
 * Export full estimation record (for GDPR/legal purposes)
 */
export async function exportEstimationRecord(estimationId, clientId) {
  try {
    // Get estimation main record
    const { data: estimation, error: estError } = await supabase
      .from('estimation_requests')
      .select('*')
      .eq('id', estimationId)
      .eq('client_id', clientId)
      .single();

    if (estError || !estimation) {
      return {
        record: null,
        error: new Error('Estimation not found')
      };
    }

    // Get audit trail
    const { events } = await getAuditTrail(estimationId);

    // Get payment trail
    const { transactions } = await getPaymentAuditTrail(estimationId);

    // Get client profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    const exportData = {
      exportedAt: new Date().toISOString(),
      estimation: {
        id: estimation.id,
        client_id: estimation.client_id,
        reason: estimation.estimation_reason,
        property: {
          type: estimation.property_type,
          habitable_area: estimation.habitable_area,
          terrain_area: estimation.terrain_area,
          postal_code: estimation.postal_code,
          condition: estimation.property_condition,
          construction_year: estimation.construction_year
        },
        amenities: estimation.amenities,
        legal_consent: {
          accepted: estimation.legal_consent,
          accepted_at: estimation.legal_consent_accepted_at
        },
        payment: {
          status: estimation.payment_status,
          amount: estimation.amount_paid,
          date: estimation.payment_date
        },
        results: {
          value_low: estimation.estimated_value_low,
          value_medium: estimation.estimated_value_medium,
          value_high: estimation.estimated_value_high,
          confidence_level: estimation.confidence_level
        },
        status: estimation.status,
        created_at: estimation.created_at,
        updated_at: estimation.updated_at
      },
      client_profile: {
        id: profile?.id,
        email: profile?.email,
        full_name: profile?.full_name,
        created_at: profile?.created_at
      },
      audit_trail: events.map(e => ({
        event_type: e.event_type,
        event_data: e.event_data,
        created_at: e.created_at
      })),
      payment_trail: transactions.map(t => ({
        provider: t.payment_provider,
        status: t.status,
        amount: t.amount,
        created_at: t.created_at
      }))
    };

    return {
      record: exportData,
      error: null
    };
  } catch (err) {
    return {
      record: null,
      error: err
    };
  }
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(estimationId, clientId) {
  try {
    const { record, error: exportError } = await exportEstimationRecord(estimationId, clientId);

    if (exportError) {
      return {
        report: null,
        error: exportError
      };
    }

    const report = {
      generatedAt: new Date().toISOString(),
      estimationId: record.estimation.id,
      clientEmail: record.client_profile.email,
      legalCheckpoints: {
        consentAccepted: record.estimation.legal_consent.accepted,
        consentTimestamp: record.estimation.legal_consent.accepted_at,
        estimationReason: record.estimation.reason,
        paymentConfirmed: record.estimation.payment.status === 'completed',
        pdfGenerated: Boolean(record.estimation.value_medium),
        auditTrailComplete: record.audit_trail.length > 0
      },
      riskAssessment: {
        dataCompleteness: calculateDataCompleteness(record.estimation),
        consentRisky: !record.estimation.legal_consent.accepted,
        paymentRisky: record.estimation.payment.status !== 'completed',
        overallCompliance: 'COMPLIANT'
      },
      recommendedActions: []
    };

    // Add recommendations based on assessment
    if (!record.estimation.legal_consent.accepted) {
      report.recommendedActions.push('CRITICAL: Legal consent not recorded');
      report.riskAssessment.overallCompliance = 'NON_COMPLIANT';
    }

    if (record.estimation.payment.status !== 'completed' && record.estimation.status === 'completed') {
      report.recommendedActions.push('WARNING: Result given before payment confirmed');
    }

    return {
      report: report,
      error: null
    };
  } catch (err) {
    return {
      report: null,
      error: err
    };
  }
}

/**
 * Core logging function
 */
async function logEvent(
  estimationId,
  eventType,
  eventData,
  ipAddress = null,
  userAgent = null
) {
  try {
    const { error } = await supabase
      .from('estimation_audit_log')
      .insert([
        {
          estimation_id: estimationId,
          event_type: eventType,
          event_data: eventData,
          user_ip_address: ipAddress,
          user_agent: userAgent
        }
      ]);

    if (error) {
      console.error('Audit logging error:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('Audit logging exception:', err);
    return { error: err };
  }
}

/**
 * Calculate data completeness from record
 */
function calculateDataCompleteness(estimation) {
  const fields = [
    estimation.property?.type,
    estimation.property?.habitable_area,
    estimation.property?.postal_code,
    estimation.property?.condition,
    estimation.property?.terrain_area ? 1 : 0,
    estimation.property?.construction_year ? 1 : 0,
    Object.keys(estimation.amenities || {}).length > 0 ? 1 : 0
  ];

  const filledFields = fields.filter(f => f).length;
  return Math.round((filledFields / fields.length) * 100);
}

export default {
  logEstimationCreated,
  logEstimationSubmitted,
  logLegalConsentAccepted,
  logPaymentInitiated,
  logPaymentCompleted,
  logCalculationExecuted,
  logPDFGenerated,
  logResultViewed,
  logPDFDownloaded,
  logEstimationCancelled,
  logRefundRequested,
  getAuditTrail,
  getPaymentAuditTrail,
  exportEstimationRecord,
  generateComplianceReport
};
