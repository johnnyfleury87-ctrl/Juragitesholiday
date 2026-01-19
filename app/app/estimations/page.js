'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function EstimationsHistoryPage() {
  const router = useRouter();
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/estimation');
          return;
        }

        setUser(session.user);

        // Charger les estimations
        const { data: ests } = await supabase
          .from('estimation_requests')
          .select('*')
          .eq('client_id', session.user.id)
          .order('created_at', { ascending: false });

        setEstimations(ests || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des estimations.');
        setLoading(false);
      }
    };

    init();
  }, [supabase, router]);

  const filteredEstimations = filterStatus === 'all'
    ? estimations
    : estimations.filter(e => e.payment_status === filterStatus);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ En attente', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '✅ Payée', color: 'bg-green-100 text-green-800' },
      failed: { label: '❌ Échouée', color: 'bg-red-100 text-red-800' },
      refunded: { label: '↩️ Remboursée', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { label: '?', color: 'bg-gray-100 text-gray-800' };
  };

  const getReasonLabel = (reason) => {
    const reasonMap = {
      curiosity: 'Curiosité personnelle',
      sale: 'Vente envisagée',
      divorce: 'Séparation',
      inheritance: 'Succession',
      notarial: 'Demande notariale',
      other: 'Autre'
    };
    return reasonMap[reason] || reason;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos estimations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/app/profile">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Retour au profil
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">📋 Historique estimations</h1>
          <Link href="/app/profile">
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              ← Retour profil
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{estimations.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
            <p className="text-sm text-gray-600">Payées</p>
            <p className="text-2xl font-bold text-green-600">
              {estimations.filter(e => e.payment_status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-600">
            <p className="text-sm text-gray-600">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">
              {estimations.filter(e => e.payment_status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-600">
            <p className="text-sm text-gray-600">Total dépensé</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(estimations.filter(e => e.payment_status === 'completed').length * 49)}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({estimations.length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Payées ({estimations.filter(e => e.payment_status === 'completed').length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({estimations.filter(e => e.payment_status === 'pending').length})
            </button>
          </div>
        </div>

        {/* List */}
        {filteredEstimations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Aucune estimation trouvée</p>
            <Link href="/estimation">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Créer une estimation
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEstimations.map((est) => {
              const statusInfo = getStatusBadge(est.payment_status);
              return (
                <div key={est.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    {/* ID & Reason */}
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">
                        ID: {est.id.substring(0, 8)}...
                      </p>
                      <p className="font-semibold text-gray-900">
                        {getReasonLabel(est.reason)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {est.data?.propertyType && `${est.data.propertyType} · ${est.data.habitableArea}m²`}
                      </p>
                    </div>

                    {/* Value */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Valeur médiane</p>
                      <p className="font-bold text-blue-600">
                        {est.data?.estimatedValueMedium 
                          ? formatCurrency(est.data.estimatedValueMedium)
                          : '-'
                        }
                      </p>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(est.created_at)}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="text-right">
                      {est.payment_status === 'completed' && (
                        <Link href={`/estimation/results/${est.id}`}>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition">
                            Voir résultats
                          </button>
                        </Link>
                      )}
                      {est.payment_status === 'pending' && (
                        <Link href={`/estimation/form/step2-property?estimationId=${est.id}`}>
                          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm transition">
                            Continuer
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create New */}
        {estimations.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/estimation">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                + Nouvelle estimation
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
