'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { audit } from '@/lib/audit-service';

const ESTIMATION_REASONS = [
  {
    id: 'curiosity',
    label: 'Curiosité personnelle',
    description: 'Je souhaite connaître la valeur de mon bien à titre informatif'
  },
  {
    id: 'sale',
    label: 'Vente envisagée',
    description: 'Je prépare la vente de mon bien immobilier'
  },
  {
    id: 'divorce',
    label: 'Partage dans le cadre d\'une séparation',
    description: 'Je dois évaluer le bien pour un partage (divorce, PACS)'
  },
  {
    id: 'inheritance',
    label: 'Succession',
    description: 'Je dois évaluer le bien dans le contexte d\'une succession'
  },
  {
    id: 'notarial',
    label: 'Demande notariale',
    description: 'Mon notaire a besoin d\'une estimation pour mon dossier'
  },
  {
    id: 'other',
    label: 'Autre raison',
    description: 'Autre motif non listé ci-dessus'
  }
];

export default function Step1ReasonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedReason, setSelectedReason] = useState('');
  const [legalText, setLegalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Vérifier l'authentification
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

  // Charger le texte légal quand la raison change
  useEffect(() => {
    const fetchLegalText = async () => {
      if (!selectedReason) {
        setLegalText('');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('legal_mentions')
          .select('legal_text')
          .eq('reason', selectedReason)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setLegalText(data?.legal_text || '');
      } catch (err) {
        console.error('Erreur chargement texte légal:', err);
        setLegalText('Cadre légal: Cette estimation est indicative et n\'a aucune valeur officielle.');
      }
    };

    fetchLegalText();
  }, [selectedReason, supabase]);

  const handleNext = async () => {
    if (!selectedReason) {
      setError('Veuillez sélectionner une raison d\'estimation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Créer une nouvelle estimation avec la raison
      const { data, error: insertError } = await supabase
        .from('estimation_requests')
        .insert([
          {
            client_id: user.id,
            reason: selectedReason,
            status: 'draft',
            payment_status: 'pending',
            legal_consent_accepted: false,
            data: {}
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const estimationId = data.id;

      // Logger l'événement
      await audit.logEstimationCreated(estimationId, user.id, selectedReason, {
        userAgent: navigator.userAgent,
        userIP: await getUserIP()
      });

      // Rediriger vers step 2
      router.push(`/estimation/form/step2-property?estimationId=${estimationId}`);
    } catch (err) {
      console.error('Erreur création estimation:', err);
      setError('Erreur lors de la création de l\'estimation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-blue-600">Étape 1/5</span>
            <span className="text-sm text-gray-600">Raison d'estimation</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quel est votre motif d'estimation?
          </h1>
          <p className="text-gray-600">
            Sélectionnez la raison principale de votre demande d'estimation. Cela nous aide à proposer le cadre légal adapté.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Reason Selection */}
        <div className="space-y-3 mb-8">
          {ESTIMATION_REASONS.map((reason) => (
            <label key={reason.id} className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
              style={{
                borderColor: selectedReason === reason.id ? '#2563eb' : undefined,
                backgroundColor: selectedReason === reason.id ? '#eff6ff' : undefined
              }}>
              <input
                type="radio"
                name="reason"
                value={reason.id}
                checked={selectedReason === reason.id}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="mt-1 mr-4 w-5 h-5 text-blue-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{reason.label}</div>
                <div className="text-sm text-gray-600">{reason.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Legal Text Display */}
        {selectedReason && legalText && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">📋 Cadre légal</h3>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{legalText}</p>
          </div>
        )}

        {/* Important Warning */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">⚠️ Important</h3>
          <p className="text-sm text-blue-800">
            Cette estimation est <strong>indicative</strong> et n'a aucune valeur d'expertise officielle. 
            Elle est destinée à vous aider dans votre décision et ne peut en aucun cas être utilisée en tribunal 
            ou comme base contractuelle.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href="/estimation">
            <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Retour
            </button>
          </Link>
          <button
            onClick={handleNext}
            disabled={!selectedReason || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Chargement...' : 'Continuer vers étape 2'}
          </button>
        </div>
      </div>
    </div>
  );
}
