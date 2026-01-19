import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { estimationId, clientId, email } = await request.json();

    if (!estimationId || !clientId || !email) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Vérifier que l'estimation existe et appartient au client
    const { data: estimation, error: fetchError } = await supabase
      .from('estimation_requests')
      .select('*')
      .eq('id', estimationId)
      .eq('client_id', clientId)
      .single();

    if (fetchError || !estimation) {
      return Response.json(
        { error: 'Estimation not found' },
        { status: 404 }
      );
    }

    if (estimation.payment_status === 'completed') {
      return Response.json(
        { error: 'This estimation is already paid' },
        { status: 400 }
      );
    }

    // Créer l'intention de paiement Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 4900, // 49€ en centimes
      currency: 'eur',
      metadata: {
        estimationId,
        clientId
      },
      description: `Estimation immobilière indicative - ID: ${estimationId}`,
      receipt_email: email
    });

    // Enregistrer le payment_id dans l'estimation
    await supabase
      .from('estimation_requests')
      .update({
        payment_id: paymentIntent.id,
        payment_status: 'pending'
      })
      .eq('id', estimationId);

    return Response.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return Response.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
