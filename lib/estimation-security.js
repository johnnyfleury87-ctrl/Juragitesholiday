/**
 * estimation-security.js - Security & Compliance Configuration
 * Purpose: Centralized security policies and legal thresholds
 */

export const SECURITY_CONFIG = {
  // ============================================================
  // AUTHENTICATION
  // ============================================================
  authentication: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false, // Not mandatory, reduces UX friction
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    loginAttemptLockout: 15 * 60 * 1000, // 15 minutes
    emailVerificationRequired: false, // Optional for speed
    forceSecurePassword: false // Warning only
  },

  // ============================================================
  // PAYMENT SECURITY
  // ============================================================
  payment: {
    priceEur: 49.00,
    currency: 'EUR',
    minAmount: 10.00,
    maxAmount: 200.00,
    allowRefundDays: 30,
    requireConsentBeforeCharge: true,
    stripePubilshableKeyPattern: /^pk_(test|live)_/,
    stripeSecretKeyPattern: /^sk_(test|live)_/,
    webhookSignatureRequired: true
  },

  // ============================================================
  // ESTIMATION DATA INTEGRITY
  // ============================================================
  estimation: {
    propertyAreaMin: 1, // m²
    propertyAreaMax: 500, // m²
    terrainAreaMax: 100000, // m²
    constructionYearMin: 1800,
    constructionYearMax: new Date().getFullYear() + 1,
    maxFileUploadSizeMB: 10,
    dataImmutableAfterPayment: true, // CRITICAL: Freezes inputs
    recalculationAllowed: false, // Once paid, no recalc
    deleteEstimationDays: 365 // Auto-delete after 1 year
  },

  // ============================================================
  // LEGAL COMPLIANCE
  // ============================================================
  legal: {
    // Mandatory text variations by reason
    disclaimerTextRequired: true,
    disclaimerMustContain: [
      'indicatif',
      'non-expertise',
      'à titre informatif'
    ],
    
    // Consent thresholds
    consentRequired: true,
    consentCheckboxCannotBePrechecked: true,
    consentTextVersioningRequired: true,
    consentVersionImmutable: true,
    consentTimestampRequired: true,
    consentIPRequired: true,
    consentUserAgentRequired: true,

    // Calculation display rules
    fourchetteMandatory: true, // Never single value
    singleValueProhibited: true,
    confidenceLevelMandatory: true,
    confidenceMarginMandatory: true,
    minConfidenceMargin: 5, // ±5%
    maxConfidenceMargin: 20, // ±20%

    // Reason-specific text
    reasonSpecificTextRequired: true,
    reasons: {
      curiosity: {
        label: 'Curiosité / Information',
        disclaimerTemplate: 'Cette estimation a un caractère purement informatif...'
      },
      sale: {
        label: 'Projet de vente',
        disclaimerTemplate: 'Ce document est un pré-diagnostic destiné à faciliter...'
      },
      divorce: {
        label: 'Divorce / Séparation',
        disclaimerTemplate: 'Ce document ne constitue pas une expertise opposable devant une juridiction...',
        highlightNonOpposable: true
      },
      inheritance: {
        label: 'Succession',
        disclaimerTemplate: 'Cette estimation est un pré-diagnostic informatif...'
      },
      notarial: {
        label: 'Discussion notariale',
        disclaimerTemplate: 'Ce document prépare votre discussion avec un notaire...'
      },
      other: {
        label: 'Autre motif',
        disclaimerTemplate: 'Cette estimation a un caractère informatif...'
      }
    }
  },

  // ============================================================
  // AUDIT & TRACKING
  // ============================================================
  audit: {
    trackIPAddress: true,
    trackUserAgent: true,
    trackTimestamps: true, // millisecond precision
    trackAllCalculationInputs: true,
    trackAllCalculationOutputs: true,
    auditLogImmutable: true,
    auditLogRetention: 3650, // 10 years
    logEventsRequired: [
      'created',
      'submitted',
      'legal_consent_accepted',
      'payment_initiated',
      'payment_completed',
      'calculated',
      'pdf_generated',
      'result_viewed',
      'pdf_downloaded'
    ],
    
    // Export capability
    gdprExportAllowed: true,
    gdprExportDelay: 7, // Days to fulfill
    gdprDeleteAllowed: true, // After retention
    deleteIncludesPaymentData: true,
    deleteIncludesAuditTrail: false // Keep for legal)
  },

  // ============================================================
  // DATA PRIVACY & STORAGE
  // ============================================================
  privacy: {
    dataMinimization: true,
    onlyStoreNecessaryFields: true,
    encryptionInTransit: true, // HTTPS only
    encryptionAtRest: true, // Supabase default
    pdfStoragePrivate: true,
    pdfAccessViaSignedURL: true,
    pdfExpirationHours: 24, // URLs expire
    deleteClientDataOnRequest: true,
    anonymizationAfterDelete: true,
    
    // PII handling
    emailEncryption: 'transparent', // Handled by Supabase
    phoneOptional: true,
    noThirdPartySharing: true,
    noMarketingData: true,
    cookiesMinimal: true // Only essential
  },

  // ============================================================
  // CALCULATION SECURITY
  // ============================================================
  calculation: {
    serverSideOnly: true, // CRITICAL: No client-side calc
    noFormulaExposure: true, // Coefficients hidden
    noRawInputExposure: true,
    versioningRequired: true, // Rules immutable
    versionImmutable: true,
    multipleVersionsSupported: true,
    rollbackNotAllowed: true, // Can't change past calcs
    
    // Confidence thresholds
    confidenceLevelCalculation: {
      low: { threshold: 0.5, margin: 20 }, // ±20%
      medium: { threshold: 0.75, margin: 10 }, // ±10%
      high: { threshold: 0.9, margin: 5 } // ±5%
    },

    // Data completeness impact
    minimumDataCompleteness: 0.4, // 40% required
    warningDataCompleteness: 0.6, // Warn at 60%
    optimalDataCompleteness: 0.85 // 85%+
  },

  // ============================================================
  // PAYMENT SECURITY (Stripe)
  // ============================================================
  stripe: {
    apiVersion: '2024-01', // Latest stable
    webhookSigningRequired: true,
    webhookEventTypes: [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.refunded'
    ],
    idempotencyKeyRequired: true,
    statementDescriptor: 'ESTIMATION IMMO',
    receiptEmailAlways: true,
    savePaymentMethod: false, // One-time only
    requireCVCVerification: true,
    block3DSecureFailed: true
  },

  // ============================================================
  // API SECURITY
  // ============================================================
  api: {
    rateLimitPerIP: 100, // requests per minute
    rateLimitPerUser: 50,
    requireAuthentication: true,
    requireHTTPS: true,
    corsOrigins: ['http://localhost:3000'], // Add production URL
    corsCredentials: true,
    corsMaxAge: 3600,
    
    // Admin endpoints
    adminRequireRole: 'admin',
    adminAuditLog: true,
    adminActionApprovalRequired: false, // Could be added
    
    // Input validation
    maxRequestSizeKB: 100,
    inputSanitizationRequired: true,
    sqlInjectionPrevention: true, // Supabase handles
    xssPrevention: true
  },

  // ============================================================
  // ERROR HANDLING
  // ============================================================
  errorHandling: {
    exposeInternalErrors: false, // Generic messages to client
    logInternalErrors: true, // Full logs server-side
    alertOnCriticalErrors: true,
    disableStackTraceInProduction: true,
    gracefulDegradation: true,
    
    // Specific error handling
    paymentErrorsVerbose: true, // Help users understand failures
    calculationErrorsFallback: true, // Show last known result
    pdfGenerationRetry: true // Up to 3 times
  },

  // ============================================================
  // MONITORING & ALERTS
  // ============================================================
  monitoring: {
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    enableSecurityMonitoring: true,
    
    criticalAlerts: [
      'Payment success rate < 80%',
      'Calculation errors spike',
      'Unauthorized access attempts',
      'Database connection errors',
      'PDF generation failures > 10%',
      'API error rate > 5%'
    ],

    metricsToTrack: [
      'estimation_creation_rate',
      'payment_success_rate',
      'average_calculation_time_ms',
      'pdf_generation_time_ms',
      'storage_usage_gb',
      'active_users_count',
      'api_error_rate_percent'
    ]
  },

  // ============================================================
  // COMPLIANCE & LEGAL
  // ============================================================
  compliance: {
    // RGPD (EU)
    rgpdCompliant: true,
    privacyPolicyRequired: true,
    termsOfServiceRequired: true,
    consentManagementRequired: true,
    dataProcessingAgreementRequired: true,
    dataProtectionOfficer: 'contact@juragites.fr',

    // France specific
    frenchLawApplicable: true,
    frenchCCAPplicable: false, // Not consumer goods
    frenchACSCompliant: true, // (likely)

    // Insurance implications
    liability: {
      disclaimer: 'Non-legally binding estimation',
      maxClaimAmount: null, // Covered by liability insurance
      insurer: 'To be determined',
      policyNumber: 'TBD'
    },

    // Professional standards
    professionalGuidelines: 'FNAIM / IFRPI to review',
    expertCertification: false, // Not required for indicative
    continuingEducation: true // Recommended

  }
};

/**
 * VALIDATION FUNCTIONS
 */

export function validateEstimationData(data) {
  const errors = [];

  if (!data.propertyType) {
    errors.push('Type de bien requis');
  }

  if (!data.habitableArea || data.habitableArea < SECURITY_CONFIG.estimation.propertyAreaMin) {
    errors.push(`Surface minimum: ${SECURITY_CONFIG.estimation.propertyAreaMin}m²`);
  }

  if (data.habitableArea > SECURITY_CONFIG.estimation.propertyAreaMax) {
    errors.push(`Surface maximum: ${SECURITY_CONFIG.estimation.propertyAreaMax}m²`);
  }

  if (data.terrainArea && data.terrainArea > SECURITY_CONFIG.estimation.terrainAreaMax) {
    errors.push(`Surface terrain maximum: ${SECURITY_CONFIG.estimation.terrainAreaMax}m²`);
  }

  if (data.constructionYear) {
    if (data.constructionYear < SECURITY_CONFIG.estimation.constructionYearMin ||
        data.constructionYear > SECURITY_CONFIG.estimation.constructionYearMax) {
      errors.push(`Année entre ${SECURITY_CONFIG.estimation.constructionYearMin} et ${SECURITY_CONFIG.estimation.constructionYearMax}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check legal compliance of disclaimer text
 */
export function validateDisclaimerText(text) {
  const requiredTerms = SECURITY_CONFIG.legal.disclaimerMustContain;
  const included = requiredTerms.filter(term =>
    text.toLowerCase().includes(term.toLowerCase())
  );

  return {
    compliant: included.length === requiredTerms.length,
    included,
    missing: requiredTerms.filter(term => !included.includes(term))
  };
}

/**
 * Get confidence margin for data completeness
 */
export function getConfidenceMargin(completenessPercent) {
  const config = SECURITY_CONFIG.calculation.confidenceLevelCalculation;
  const ratio = completenessPercent / 100;

  if (ratio >= config.high.threshold) {
    return config.high.margin;
  } else if (ratio >= config.medium.threshold) {
    return config.medium.margin;
  } else {
    return config.low.margin;
  }
}

/**
 * Check if payment amount is valid
 */
export function validatePaymentAmount(amount) {
  const { minAmount, maxAmount } = SECURITY_CONFIG.payment;

  return {
    valid: amount >= minAmount && amount <= maxAmount,
    min: minAmount,
    max: maxAmount
  };
}

/**
 * Generate audit log entry
 */
export function createAuditLogEntry(estimationId, eventType, eventData, ipAddress, userAgent) {
  if (!SECURITY_CONFIG.audit.logEventsRequired.includes(eventType)) {
    console.warn(`Event type not in required list: ${eventType}`);
  }

  return {
    estimation_id: estimationId,
    event_type: eventType,
    event_data: eventData,
    user_ip_address: SECURITY_CONFIG.audit.trackIPAddress ? ipAddress : null,
    user_agent: SECURITY_CONFIG.audit.trackUserAgent ? userAgent : null,
    timestamp: new Date().toISOString()
  };
}

export default SECURITY_CONFIG;
