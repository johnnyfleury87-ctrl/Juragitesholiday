import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Vérifier la signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature error:', err.message);
      return Response.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Traiter les événements
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { estimationId } = paymentIntent.metadata;

        if (!estimationId) break;

        // Mettre à jour l'estimation
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
              payment_intent_id: paymentIntent.id,
              amount_eur: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              status: 'completed'
            }
          ]);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const { estimationId } = paymentIntent.metadata;

        if (!estimationId) break;

        await supabase
          .from('estimation_requests')
          .update({
            payment_status: 'failed'
          })
          .eq('id', estimationId);

        await supabase
          .from('payment_transactions')
          .insert([
            {
              estimation_id: estimationId,
              payment_intent_id: paymentIntent.id,
              amount_eur: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              status: 'failed'
            }
          ]);

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        if (!paymentIntentId) break;

        // Trouver l'estimation par payment_id
        const { data: est } = await supabase
          .from('estimation_requests')
          .select('id')
          .eq('payment_id', paymentIntentId)
          .single();

        if (est) {
          await supabase
            .from('estimation_requests')
            .update({
              payment_status: 'refunded'
            })
            .eq('id', est.id);

          await supabase
            .from('payment_transactions')
            .update({
              status: 'refunded'
            })
            .eq('payment_intent_id', paymentIntentId);
        }

        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}
