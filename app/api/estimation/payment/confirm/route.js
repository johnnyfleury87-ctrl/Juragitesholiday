import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { calculateEstimation } from '@/lib/estimation-calculator';
import { generateEstimationPDF } from '@/lib/pdf-generator';
import { audit } from '@/lib/audit-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { estimationId, paymentIntentId } = await request.json();

    if (!estimationId || !paymentIntentId) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Vérifier le statut du paiement auprès de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return Response.json(
        { error: 'Payment not confirmed' },
        { status: 400 }
      );
    }

    // Charger l'estimation
    const { data: estimation, error: fetchError } = await supabase
      .from('estimation_requests')
      .select('*')
      .eq('id', estimationId)
      .single();

    if (fetchError || !estimation) {
      return Response.json(
        { error: 'Estimation not found' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut du paiement
    await supabase
      .from('estimation_requests')
      .update({
        payment_status: 'completed',
        status: 'completed',
        paid_at: new Date().toISOString()
      })
      .eq('id', estimationId);

    // Enregistrer la transaction
    await supabase
      .from('payment_transactions')
      .insert([
        {
          estimation_id: estimationId,
          payment_intent_id: paymentIntentId,
          amount_eur: 49,
          currency: 'EUR',
          status: 'completed',
          stripe_data: paymentIntent
        }
      ]);

    // Logger le paiement confirmé
    await audit.logPaymentCompleted(estimationId, estimation.client_id, {
      paymentIntentId,
      amount: 49
    });

    // Calculer l'estimation
    try {
      const calculationResult = await calculateEstimation(
        estimation.data,
        estimation.client_id,
        estimation.reason
      );

      // Logger le calcul
      await audit.logCalculationExecuted(estimationId, estimation.client_id, {
        rulesVersionId: calculationResult.rulesVersionId,
        confidence: calculationResult.confidenceLevel,
        dataCompleteness: calculationResult.dataCompleteness
      });

      // Charger le profil pour le PDF
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', estimation.client_id)
        .single();

      // Générer le PDF
      const pdfResult = await generateEstimationPDF(
        estimation,
        calculationResult,
        profile
      );

      if (pdfResult.success) {
        // Mettre à jour le chemin du PDF
        await supabase
          .from('estimation_requests')
          .update({
            pdf_storage_path: pdfResult.pdfPath
          })
          .eq('id', estimationId);

        // Logger PDF généré
        await audit.logPDFGenerated(estimationId, estimation.client_id, {
          pdfPath: pdfResult.pdfPath,
          size: pdfResult.size
        });
      }
    } catch (calcError) {
      console.error('Calculation/PDF error:', calcError);
      // L'estimation est payée même si la génération échoue
    }

    return Response.json({
      success: true,
      estimationId
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return Response.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
