/**
 * payment-service.js - Payment processing for estimations
 * Purpose: Stripe integration with full auditability
 * Scope: Server-side payment handling and verification
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ESTIMATION_PRICE_CENTS = 4900; // 49€ in cents

/**
 * Create payment intent for an estimation
 * @param {string} clientId - Client user ID
 * @param {string} estimationId - Estimation request ID
 * @param {string} clientEmail - Client email
 * @returns {Promise<{clientSecret, error}>}
 */
export async function createPaymentIntent(clientId, estimationId, clientEmail) {
  if (!clientId || !estimationId || !clientEmail) {
    return {
      clientSecret: null,
      error: new Error('Client ID, estimation ID, and email required')
    };
  }

  try {
    // 1) Verify estimation belongs to client
    const { data: estimation, error: estError } = await supabase
      .from('estimation_requests')
      .select('id, status, payment_status')
      .eq('id', estimationId)
      .eq('client_id', clientId)
      .single();

    if (estError || !estimation) {
      return {
        clientSecret: null,
        error: new Error('Estimation non trouvée')
      };
    }

    if (estimation.status !== 'submitted') {
      return {
        clientSecret: null,
        error: new Error('État d\'estimation invalide pour paiement')
      };
    }

    if (estimation.payment_status === 'completed') {
      return {
        clientSecret: null,
        error: new Error('Paiement déjà effectué')
      };
    }

    // 2) Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: ESTIMATION_PRICE_CENTS,
      currency: 'eur',
      receipt_email: clientEmail,
      metadata: {
        estimation_id: estimationId,
        client_id: clientId,
        type: 'property_estimation'
      },
      statement_descriptor: 'ESTIMATION IMMO'
    });

    // 3) Update estimation with payment intent ID
    await supabase
      .from('estimation_requests')
      .update({
        payment_id: paymentIntent.id,
        payment_status: 'pending'
      })
      .eq('id', estimationId);

    // 4) Log payment initiation
    await logPaymentEvent(estimationId, 'payment_initiated', {
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: ESTIMATION_PRICE_CENTS
    });

    return {
      clientSecret: paymentIntent.client_secret,
      error: null
    };
  } catch (err) {
    console.error('Payment intent creation error:', err);
    return {
      clientSecret: null,
      error: err
    };
  }
}

/**
 * Confirm payment and finalize estimation
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<{success, estimation, error}>}
 */
export async function confirmPayment(paymentIntentId) {
  if (!paymentIntentId) {
    return {
      success: false,
      estimation: null,
      error: new Error('Payment intent ID required')
    };
  }

  try {
    // 1) Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return {
        success: false,
        estimation: null,
        error: new Error('Payment intent not found')
      };
    }

    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        estimation: null,
        error: new Error(`Payment failed: ${paymentIntent.status}`)
      };
    }

    const { estimation_id: estimationId, client_id: clientId } = paymentIntent.metadata;

    // 2) Update estimation status to paid
    const { data: estimation, error: updateError } = await supabase
      .from('estimation_requests')
      .update({
        payment_status: 'completed',
        payment_date: new Date().toISOString(),
        status: 'paid',
        amount_paid: ESTIMATION_PRICE_CENTS / 100
      })
      .eq('id', estimationId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 3) Create payment transaction record
    await supabase
      .from('payment_transactions')
      .insert([
        {
          estimation_id: estimationId,
          client_id: clientId,
          payment_provider: 'stripe',
          provider_transaction_id: paymentIntentId,
          amount: ESTIMATION_PRICE_CENTS / 100,
          currency: 'EUR',
          status: 'succeeded',
          metadata: {
            stripe_payment_intent_id: paymentIntentId,
            receipt_email: paymentIntent.receipt_email,
            charges: paymentIntent.charges?.data?.map(c => ({
              id: c.id,
              amount: c.amount,
              payment_method: c.payment_method_details?.type
            }))
          }
        }
      ]);

    // 4) Log payment completion
    await logPaymentEvent(estimationId, 'payment_completed', {
      stripe_payment_intent_id: paymentIntentId,
      amount: ESTIMATION_PRICE_CENTS / 100
    });

    return {
      success: true,
      estimation,
      error: null
    };
  } catch (err) {
    console.error('Payment confirmation error:', err);
    return {
      success: false,
      estimation: null,
      error: err
    };
  }
}

/**
 * Handle failed payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {string} failureReason - Reason for failure
 * @returns {Promise<{error}>}
 */
export async function handlePaymentFailure(paymentIntentId, failureReason) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { estimation_id: estimationId } = paymentIntent.metadata;

    // Update estimation status
    await supabase
      .from('estimation_requests')
      .update({
        payment_status: 'failed',
        status: 'pending_payment'
      })
      .eq('id', estimationId);

    // Create failed transaction record
    await supabase
      .from('payment_transactions')
      .insert([
        {
          estimation_id: estimationId,
          client_id: paymentIntent.metadata.client_id,
          payment_provider: 'stripe',
          provider_transaction_id: paymentIntentId,
          amount: ESTIMATION_PRICE_CENTS / 100,
          currency: 'EUR',
          status: 'failed',
          failure_reason: failureReason
        }
      ]);

    // Log failure
    await logPaymentEvent(estimationId, 'payment_failed', {
      stripe_payment_intent_id: paymentIntentId,
      failure_reason: failureReason
    });

    return { error: null };
  } catch (err) {
    console.error('Payment failure handling error:', err);
    return { error: err };
  }
}

/**
 * Process refund request
 * @param {string} estimationId - Estimation ID
 * @param {string} clientId - Client user ID
 * @param {string} reason - Refund reason
 * @returns {Promise<{success, refundId, error}>}
 */
export async function requestRefund(estimationId, clientId, reason) {
  if (!estimationId || !clientId) {
    return {
      success: false,
      refundId: null,
      error: new Error('Estimation ID and client ID required')
    };
  }

  try {
    // 1) Verify estimation and get payment details
    const { data: estimation, error: estError } = await supabase
      .from('estimation_requests')
      .select('*')
      .eq('id', estimationId)
      .eq('client_id', clientId)
      .single();

    if (estError || !estimation) {
      return {
        success: false,
        refundId: null,
        error: new Error('Estimation not found')
      };
    }

    if (estimation.payment_status !== 'completed') {
      return {
        success: false,
        refundId: null,
        error: new Error('Only completed payments can be refunded')
      };
    }

    // 2) Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: estimation.payment_id,
      metadata: {
        estimation_id: estimationId,
        reason: reason
      }
    });

    // 3) Update estimation status
    await supabase
      .from('estimation_requests')
      .update({
        payment_status: 'refunded',
        status: 'cancelled'
      })
      .eq('id', estimationId);

    // 4) Create refund transaction record
    await supabase
      .from('payment_transactions')
      .insert([
        {
          estimation_id: estimationId,
          client_id: clientId,
          payment_provider: 'stripe',
          provider_transaction_id: refund.id,
          amount: estimation.amount_paid,
          currency: 'EUR',
          status: 'refunded',
          metadata: {
            refund_reason: reason,
            original_payment_intent: estimation.payment_id
          }
        }
      ]);

    // 5) Log refund
    await logPaymentEvent(estimationId, 'payment_refunded', {
      refund_id: refund.id,
      reason: reason,
      amount: estimation.amount_paid
    });

    return {
      success: true,
      refundId: refund.id,
      error: null
    };
  } catch (err) {
    console.error('Refund request error:', err);
    return {
      success: false,
      refundId: null,
      error: err
    };
  }
}

/**
 * Retrieve payment status
 * @param {string} estimationId - Estimation ID
 * @param {string} clientId - Client user ID
 * @returns {Promise<{status, transactionData, error}>}
 */
export async function getPaymentStatus(estimationId, clientId) {
  try {
    const { data: estimation, error: estError } = await supabase
      .from('estimation_requests')
      .select('payment_status, payment_id, amount_paid, payment_date')
      .eq('id', estimationId)
      .eq('client_id', clientId)
      .single();

    if (estError || !estimation) {
      return {
        status: null,
        transactionData: null,
        error: new Error('Estimation not found')
      };
    }

    // Fetch transaction details
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('estimation_id', estimationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      status: estimation.payment_status,
      transactionData: {
        paymentId: estimation.payment_id,
        amount: estimation.amount_paid,
        date: estimation.payment_date,
        transaction: transactions
      },
      error: null
    };
  } catch (err) {
    return {
      status: null,
      transactionData: null,
      error: err
    };
  }
}

/**
 * Log payment event for auditability
 */
async function logPaymentEvent(estimationId, eventType, eventData) {
  try {
    await supabase
      .from('estimation_audit_log')
      .insert([
        {
          estimation_id: estimationId,
          event_type: eventType,
          event_data: eventData
        }
      ]);
  } catch (err) {
    console.error('Payment event logging error:', err);
  }
}

/**
 * Handle Stripe webhook (payment.intent.succeeded)
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<{processed, error}>}
 */
export async function handleStripeWebhook(event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { estimation_id: estimationId } = paymentIntent.metadata;

        // Auto-confirm payment
        const { success } = await confirmPayment(paymentIntent.id);

        return { processed: success, error: null };
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';

        await handlePaymentFailure(paymentIntent.id, failureReason);

        return { processed: true, error: null };
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Refund processed:', charge.refund);

        return { processed: true, error: null };
      }

      default:
        return { processed: false, error: new Error(`Unhandled event type: ${event.type}`) };
    }
  } catch (err) {
    console.error('Webhook handling error:', err);
    return { processed: false, error: err };
  }
}

export default {
  createPaymentIntent,
  confirmPayment,
  handlePaymentFailure,
  requestRefund,
  getPaymentStatus,
  handleStripeWebhook,
  ESTIMATION_PRICE_CENTS
};
