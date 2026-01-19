'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function AdminEstimationDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEstimations: 0,
    completedEstimations: 0,
    totalRevenue: 0,
    successRate: 0,
    averageValuePerEstimation: 0,
    estimationsByReason: {}
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkAdminAndLoadStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/admin/login');
          return;
        }

        // Vérifier le rôle admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (!profile?.is_admin) {
          setError('Accès refusé. Vous n\'êtes pas administrateur.');
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Charger les statistiques
        const { data: estimations } = await supabase
          .from('estimation_requests')
          .select('*');

        if (estimations) {
          const completed = estimations.filter(e => e.payment_status === 'completed').length;
          const totalRevenue = completed * 49;
          const successRate = estimations.length > 0 
            ? ((completed / estimations.length) * 100).toFixed(1) 
            : 0;

          // Grouper par motif
          const byReason = {};
          estimations.forEach(e => {
            byReason[e.reason] = (byReason[e.reason] || 0) + 1;
          });

          // Calculer la moyenne des valeurs (si disponible)
          let totalValues = 0;
          let estimationsWithValues = 0;
          estimations.forEach(e => {
            if (e.data?.estimatedValueMedium) {
              totalValues += e.data.estimatedValueMedium;
              estimationsWithValues++;
            }
          });
          const averageValue = estimationsWithValues > 0 
            ? totalValues / estimationsWithValues 
            : 0;

          setStats({
            totalEstimations: estimations.length,
            completedEstimations: completed,
            totalRevenue,
            successRate,
            averageValuePerEstimation: averageValue,
            estimationsByReason: byReason
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
        setError('Erreur lors du chargement des statistiques.');
        setLoading(false);
      }
    };

    checkAdminAndLoadStats();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Accès refusé'}</p>
          <Link href="/admin/login">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Retour à la connexion
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Module d'Estimation - Admin Dashboard
          </h1>
          <Link href="/admin">
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              ← Retour admin
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {/* Total Estimations */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 mb-1">Total estimations</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEstimations}</p>
            <p className="text-xs text-gray-500 mt-2">Depuis le lancement</p>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 mb-1">Payées</p>
            <p className="text-3xl font-bold text-green-600">{stats.completedEstimations}</p>
            <p className="text-xs text-gray-500 mt-2">{stats.successRate}% de taux</p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
            <p className="text-sm text-gray-600 mb-1">Revenu</p>
            <p className="text-3xl font-bold text-yellow-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-2">49€ par estimation</p>
          </div>

          {/* Avg Value */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 mb-1">Valeur moyenne</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(stats.averageValuePerEstimation)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Médiane des biens</p>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
            <p className="text-sm text-gray-600 mb-1">Taux de succès</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.successRate}%</p>
            <p className="text-xs text-gray-500 mt-2">Completion rate</p>
          </div>
        </div>

        {/* Estimations by Reason */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Estimations par motif</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats.estimationsByReason).map(([reason, count]) => (
              <div key={reason} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 capitalize">{reason}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalEstimations > 0 
                    ? ((count / stats.totalEstimations) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pricing Management */}
          <Link href="/admin/estimation/pricing">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">💰 Tarification</h3>
              <p className="text-sm text-blue-700 mb-4">
                Gérer les prix par commune et zone
              </p>
              <div className="text-xs text-blue-600 font-medium">Accéder →</div>
            </div>
          </Link>

          {/* Coefficients Management */}
          <Link href="/admin/estimation/coefficients">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">📊 Coefficients</h3>
              <p className="text-sm text-green-700 mb-4">
                Facteurs d'ajustement (état, type, terrain)
              </p>
              <div className="text-xs text-green-600 font-medium">Accéder →</div>
            </div>
          </Link>

          {/* Options Management */}
          <Link href="/admin/estimation/options">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">🏠 Amenities</h3>
              <p className="text-sm text-purple-700 mb-4">
                Équipements et options (garage, piscine, etc.)
              </p>
              <div className="text-xs text-purple-600 font-medium">Accéder →</div>
            </div>
          </Link>

          {/* Legal Mentions */}
          <Link href="/admin/estimation/legal">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition border-2 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚖️ Mentions légales</h3>
              <p className="text-sm text-yellow-700 mb-4">
                Textes légaux par motif d'estimation
              </p>
              <div className="text-xs text-yellow-600 font-medium">Accéder →</div>
            </div>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 À savoir</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Chaque modification crée une nouvelle version - les estimations passées restent immuables</li>
            <li>Les clients paient 49€ par estimation</li>
            <li>Taux de conversion: {stats.successRate}% (complétées vs. initiées)</li>
            <li>Tous les changements sont versionnés pour auditabilité</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
