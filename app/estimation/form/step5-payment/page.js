'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createClient } from '@supabase/supabase-js';
import { createPaymentIntent, confirmPayment } from '@/lib/payment-service';
import { calculateEstimation } from '@/lib/estimation-calculator';
import { generateEstimationPDF } from '@/lib/pdf-generator';
import { audit } from '@/lib/audit-service';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ estimationId, clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setLoading(false);
        return;
      }

      // Confirmer le paiement
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required'
      });

      if (confirmError) {
        setError(confirmError.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Appeler notre API pour finaliser
        const response = await fetch('/api/estimation/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estimationId,
            paymentIntentId: paymentIntent.id
          })
        });

        const data = await response.json();
        if (data.success) {
          onSuccess();
        } else {
          setError(data.error || 'Erreur lors de la confirmation du paiement');
        }
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      setError('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      <PaymentElement />
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Traitement du paiement...' : 'Payer 49€'}
      </button>
    </form>
  );
}

function Step5PaymentContent({ estimationId }) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [estimationData, setEstimationData] = useState(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/estimation');
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [supabase, router]);

  // Charger les données et créer PaymentIntent
  useEffect(() => {
    const init = async () => {
      try {
        // Charger l'estimation
        const { data: estimation, error: fetchError } = await supabase
          .from('estimation_requests')
          .select('*')
          .eq('id', estimationId)
          .single();

        if (fetchError) throw fetchError;
        setEstimationData(estimation);

        // Vérifier que le consent est accepté
        if (!estimation.legal_consent_accepted) {
          setError('Vous devez d\'abord accepter les conditions légales.');
          setLoading(false);
          return;
        }

        // Créer l'intention de paiement
        const response = await fetch('/api/estimation/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estimationId,
            clientId: user?.id,
            email: user?.email
          })
        });

        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
          
          // Logger
          await audit.logPaymentInitiated(estimationId, user.id, {
            amount: 49,
            currency: 'EUR'
          });
        }
      } catch (err) {
        console.error('Erreur init paiement:', err);
        setError('Erreur lors de l\'initialisation du paiement.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      init();
    }
  }, [estimationId, user, supabase]);

  const handlePaymentSuccess = async () => {
    try {
      // Calculer l'estimation
      const calculationResult = await calculateEstimation(
        estimationData.data,
        user.id,
        estimationData.reason
      );

      // Générer le PDF
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      await generateEstimationPDF(
        estimationData,
        calculationResult,
        profile
      );

      // Logger le succès
      await audit.logPaymentCompleted(estimationId, user.id, {
        amount: 49,
        estimationCalculated: true
      });

      // Rediriger vers résultats
      router.push(`/estimation/results/${estimationId}`);
    } catch (err) {
      console.error('Erreur post-paiement:', err);
      setError('Erreur lors de la génération des résultats.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Initialisation du paiement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-blue-600">Étape 5/5</span>
          <span className="text-sm text-gray-600">Paiement sécurisé</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Paiement de votre estimation
        </h1>
        <p className="text-gray-600">
          Entrez vos coordonnées de paiement pour finaliser votre demande d'estimation.
        </p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Payment form */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  estimationId={estimationId}
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4">Résumé</h3>
            <div className="space-y-3 border-b border-blue-200 pb-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimation indicative</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rapport PDF</span>
                <span className="font-medium">Inclus</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Accès historique</span>
                <span className="font-medium">10 ans</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-blue-600">49€</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Paiement sécurisé via Stripe
              </p>
            </div>

            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="text-xs text-gray-600">
                ✓ Paiement sécurisé<br/>
                ✓ Pas de frais cachés<br/>
                ✓ Accès immédiat aux résultats
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security info */}
      <div className="mt-12 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
        <p className="text-sm text-green-800">
          🔒 Vos données de paiement sont traitées de manière sécurisée par Stripe, 
          le leader de la sécurité de paiement en ligne.
        </p>
      </div>
    </div>
  );
}

export default function Step5PaymentPage() {
  const searchParams = useSearchParams();
  const estimationId = searchParams.get('estimationId');

  if (!estimationId) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto py-12 text-center">
          <p className="text-red-600">Erreur: ID d'estimation manquant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <Step5PaymentContent estimationId={estimationId} />
    </div>
  );
}
