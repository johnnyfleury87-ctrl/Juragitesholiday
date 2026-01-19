'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { audit } from '@/lib/audit-service';

export default function Step4ConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estimationId = searchParams.get('estimationId');

  const [consentCheckbox, setConsentCheckbox] = useState(false);
  const [legalText, setLegalText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

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

  // Charger les infos de l'estimation et le texte légal
  useEffect(() => {
    const fetchEstimationData = async () => {
      try {
        const { data: estimation, error: fetchError } = await supabase
          .from('estimation_requests')
          .select('reason')
          .eq('id', estimationId)
          .single();

        if (fetchError) throw fetchError;

        setReason(estimation.reason);

        // Charger le texte légal correspondant
        const { data: legal, error: legalError } = await supabase
          .from('legal_mentions')
          .select('legal_text, full_disclaimer')
          .eq('reason', estimation.reason)
          .eq('is_active', true)
          .single();

        if (legalError) throw legalError;

        const fullText = `${legal.legal_text}\n\n${legal.full_disclaimer}`;
        setLegalText(fullText);
      } catch (err) {
        console.error('Erreur chargement:', err);
        setLegalText('Texte légal non disponible.');
      }
    };

    if (estimationId) {
      fetchEstimationData();
    }
  }, [estimationId, supabase]);

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handleNext = async () => {
    if (!consentCheckbox) {
      setError('Vous devez accepter les conditions pour continuer.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userIP = await getUserIP();

      // Enregistrer le consent
      const { error: updateError } = await supabase
        .from('estimation_requests')
        .update({
          legal_consent_accepted: true,
          legal_consent_timestamp: new Date().toISOString(),
          legal_consent_ip: userIP,
          status: 'draft'
        })
        .eq('id', estimationId);

      if (updateError) throw updateError;

      // Logger l'événement
      await audit.logLegalConsentAccepted(estimationId, user.id, {
        timestamp: new Date().toISOString(),
        userIP
      });

      router.push(`/estimation/form/step5-payment?estimationId=${estimationId}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-3xl mx-auto py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-blue-600">Étape 4/5</span>
            <span className="text-sm text-gray-600">Consentement légal</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conditions d'utilisation
          </h1>
          <p className="text-gray-600">
            Veuillez lire et accepter les conditions légales avant de procéder.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Legal Text Box */}
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm max-h-96 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Texte légal applicable</h2>
          <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {legalText}
          </div>
        </div>

        {/* Critical Warning */}
        <div className="mb-8 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <h3 className="font-bold text-red-900 mb-2">⚠️ IMPORTANT - À LIRE ATTENTIVEMENT</h3>
          <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
            <li>Cette estimation est <strong>indicative</strong> et ne remplace pas une expertise professionnelle.</li>
            <li>Elle ne peut <strong>en aucun cas</strong> être utilisée à titre de preuve légale ou contractuelle.</li>
            <li>Elle est fournie <strong>à titre informatif uniquement</strong> pour vous aider dans votre décision.</li>
            <li>Vous acceptez <strong>l'intégralité des responsabilités</strong> liées à l'utilisation de cette estimation.</li>
            <li>Un enregistrement horodaté de votre consentement sera conservé à titre de preuve de votre acceptation.</li>
          </ul>
        </div>

        {/* Checkbox - CANNOT BE PRE-CHECKED */}
        <div className="mb-8">
          <label className="flex items-start p-4 border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={consentCheckbox}
              onChange={(e) => setConsentCheckbox(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 cursor-pointer"
              style={{ accentColor: '#2563eb' }}
            />
            <div className="ml-4 flex-1">
              <div className="font-semibold text-gray-900">
                J'accepte les conditions d'utilisation et les mentions légales
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Je confirme avoir lu l'intégralité du texte légal ci-dessus et j'accepte que cette estimation 
                est indicative et non contractuelle.
              </div>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ℹ️ Votre acceptation est enregistrée avec un horodatage précis et votre adresse IP à titre de preuve. 
            Cette information sera conservée conformément aux obligations légales.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href={`/estimation/form/step3-amenities?estimationId=${estimationId}`}>
            <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Retour
            </button>
          </Link>
          <button
            onClick={handleNext}
            disabled={!consentCheckbox || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Traitement...' : 'J\'accepte et continue vers paiement'}
          </button>
        </div>
      </div>
    </div>
  );
}
