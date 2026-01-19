'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { calculateEstimation } from '@/lib/estimation-calculator';
import { getPDFDownloadURL } from '@/lib/pdf-generator';
import { audit } from '@/lib/audit-service';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const estimationId = params.id;

  const [estimation, setEstimation] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showAudit, setShowAudit] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Auth check
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

  // Charger les résultats
  useEffect(() => {
    const loadResults = async () => {
      try {
        // Charger l'estimation
        const { data: est, error: estError } = await supabase
          .from('estimation_requests')
          .select('*')
          .eq('id', estimationId)
          .eq('client_id', user?.id)
          .single();

        if (estError) throw estError;
        if (!est || est.payment_status !== 'completed') {
          setError('Estimation non payée ou non trouvée.');
          setLoading(false);
          return;
        }

        setEstimation(est);

        // Recalculer l'estimation (pour afficher les résultats)
        const calcResult = await calculateEstimation(
          est.data,
          user.id,
          est.reason
        );
        setCalculation(calcResult);

        // Charger le trail d'audit
        const { data: trail } = await supabase
          .from('estimation_audit_log')
          .select('*')
          .eq('estimation_id', estimationId)
          .order('created_at', { ascending: false });

        setAuditTrail(trail || []);

        // Charger l'URL du PDF
        if (est.pdf_storage_path) {
          const url = getPDFDownloadURL(est.pdf_storage_path);
          setPdfUrl(url);
        }

        // Logger la visualisation
        await audit.logResultViewed(estimationId, user.id);
      } catch (err) {
        console.error('Erreur chargement résultats:', err);
        setError('Erreur lors du chargement des résultats.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadResults();
    }
  }, [estimationId, user, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos résultats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/estimation">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Retour à l'accueil
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!estimation || !calculation) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto py-12 text-center">
          <p className="text-gray-600">Données non disponibles</p>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const confidenceColors = {
    low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    medium: 'bg-blue-50 border-blue-200 text-blue-800',
    high: 'bg-green-50 border-green-200 text-green-800'
  };

  const confidenceLabels = {
    low: '⚠️ Basse confiance',
    medium: '✓ Confiance moyenne',
    high: '✅ Haute confiance'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✅ Estimation générée avec succès!
          </h1>
          <p className="text-gray-600">
            Voici l'estimation de votre bien généré le {new Date(estimation.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Main Results Box */}
        <div className="bg-white rounded-lg shadow-lg border-4 border-blue-600 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Fourchette d'estimation
          </h2>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Low value */}
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium mb-2">Valeur basse</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(calculation.estimatedValueLow)}
              </p>
              <p className="text-xs text-red-600 mt-2">-{calculation.confidenceMargin}%</p>
            </div>

            {/* Medium value */}
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-600 relative">
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                RÉFÉRENCE
              </div>
              <p className="text-sm text-blue-700 font-medium mb-2">Valeur médiane</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatCurrency(calculation.estimatedValueMedium)}
              </p>
              <p className="text-xs text-blue-600 mt-2">Valeur centrale</p>
            </div>

            {/* High value */}
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-2">Valeur haute</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(calculation.estimatedValueHigh)}
              </p>
              <p className="text-xs text-green-600 mt-2">+{calculation.confidenceMargin}%</p>
            </div>
          </div>

          {/* Confidence & Completeness */}
          <div className="grid grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg border ${confidenceColors[calculation.confidenceLevel]}`}>
              <p className="text-sm font-medium mb-1">
                {confidenceLabels[calculation.confidenceLevel]}
              </p>
              <p className="text-xs">
                Basée sur {(calculation.dataCompleteness * 100).toFixed(0)}% des données disponibles
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <p className="text-sm font-medium text-gray-900 mb-1">Marge de confiance</p>
              <p className="text-2xl font-bold text-blue-600">±{calculation.confidenceMargin}%</p>
            </div>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-red-900 mb-3">⚠️ Mentions légales importantes</h3>
          <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
            <li>Cette estimation est <strong>indicative</strong> et ne remplace pas une expertise professionnelle.</li>
            <li>Fourchette affichée: Les valeurs basse et haute représentent les limites de l'intervalle de confiance.</li>
            <li>La valeur <strong>médiane</strong> est la valeur de référence proposée.</li>
            <li>Cette estimation <strong>ne peut pas être utilisée à titre probant</strong> dans un contexte légal.</li>
            <li>La marge de confiance dépend de la complétude des données fournies.</li>
          </ul>
        </div>

        {/* Property Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Récapitulatif du bien</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900">{estimation.data.propertyType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Surface habitable</p>
              <p className="font-medium text-gray-900">{estimation.data.habitableArea} m²</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Commune</p>
              <p className="font-medium text-gray-900">{estimation.data.commune}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">État</p>
              <p className="font-medium text-gray-900 capitalize">{estimation.data.condition}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Année de construction</p>
              <p className="font-medium text-gray-900">{estimation.data.constructionYear}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Motif d'estimation</p>
              <p className="font-medium text-gray-900 capitalize">{estimation.reason}</p>
            </div>
          </div>
        </div>

        {/* Calculation Details */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Détails du calcul</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <span className="font-medium">Étapes du calcul:</span> 
              {' '} Base × Coefficients × Ajustements amenities
            </p>
            <p>
              <span className="font-medium">Version des règles:</span> 
              {' '} Version {calculation.rulesVersionId}
            </p>
            <p>
              <span className="font-medium">Complétude des données:</span> 
              {' '} {(calculation.dataCompleteness * 100).toFixed(1)}%
            </p>
            <p>
              <span className="font-medium">Nombre d'équipements:</span> 
              {' '} {estimation.data.amenities?.length || 0}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              onClick={async () => {
                await audit.logPDFDownloaded(estimationId, user.id);
              }}>
              <button className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                📥 Télécharger le rapport PDF
              </button>
            </a>
          )}
          <button
            onClick={() => setShowAudit(!showAudit)}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
          >
            🔐 Trail d'audit ({auditTrail.length} événements)
          </button>
        </div>

        {/* Audit Trail */}
        {showAudit && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 Trail d'audit complet</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditTrail.map((event, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">{event.event_type}</span>
                    <span className="text-xs text-gray-600">
                      {new Date(event.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">IP: {event.user_ip_address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href="/app/profile">
            <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Mon profil
            </button>
          </Link>
          <button
            onClick={() => router.push('/app/reservations')}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Retour à mon espace
          </button>
        </div>
      </div>
    </div>
  );
}
