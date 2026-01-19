'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const COEFFICIENT_TYPES = [
  { id: 'property_condition', label: 'État du bien', categories: ['à rénover', 'correct', 'bon', 'très bon'] },
  { id: 'property_type', label: 'Type de bien', categories: ['maison', 'appartement', 'autre'] },
  { id: 'terrain', label: 'Superficie terrain', categories: ['petit', 'moyen', 'grand', 'très grand'] },
  { id: 'location', label: 'Localisation', categories: ['mauvaise', 'moyenne', 'bonne', 'excellente'] }
];

export default function CoefficientsManagementPage() {
  const router = useRouter();
  const [coefficients, setCoefficients] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    category: '',
    value: ''
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/admin/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (!profile?.is_admin) {
          setError('Accès refusé.');
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Charger les coefficients
        const { data: coeffData } = await supabase
          .from('coefficients')
          .select('*')
          .eq('is_active', true)
          .order('type');

        setCoefficients(coeffData || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur init:', err);
        setError('Erreur lors du chargement.');
        setLoading(false);
      }
    };

    init();
  }, [supabase, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.type || !formData.category || !formData.value) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('coefficients')
        .insert([
          {
            type: formData.type,
            category: formData.category,
            value: parseFloat(formData.value),
            is_active: true
          }
        ]);

      if (insertError) throw insertError;

      setSuccessMessage('Coefficient ajouté avec succès!');
      setFormData({ type: '', category: '', value: '' });

      // Recharger
      const { data: updated } = await supabase
        .from('coefficients')
        .select('*')
        .eq('is_active', true)
        .order('type');
      setCoefficients(updated || []);
    } catch (err) {
      console.error('Erreur insert:', err);
      setError('Erreur lors de l\'ajout.');
    }
  };

  const selectedTypeInfo = COEFFICIENT_TYPES.find(t => t.id === formData.type);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto py-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">📊 Gestion Coefficients</h1>
          <Link href="/admin/estimation">
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              ← Retour dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter coefficient</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de coefficient
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    {COEFFICIENT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {selectedTypeInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Sélectionner --</option>
                      {selectedTypeInfo.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur coefficient (0.5 à 1.5)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="1.5"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Ex: 1.0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0.5 = -50%, 1.0 = aucun ajustement, 1.5 = +50%
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  ✓ Ajouter coefficient
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 <strong>Reference:</strong> 1.0 = aucun impact | {'<'} 1.0 = réduit valeur | {'>'} 1.0 = augmente valeur
                </p>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Coefficients actuels</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Catégorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Valeur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Impact
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {coefficients.map((coeff, idx) => {
                      const typeInfo = COEFFICIENT_TYPES.find(t => t.id === coeff.type);
                      const impact = coeff.value < 1 ? '↓ Réduit' : coeff.value > 1 ? '↑ Augmente' : '→ Neutre';
                      const impactColor = coeff.value < 1 ? 'text-red-600' : coeff.value > 1 ? 'text-green-600' : 'text-gray-600';
                      
                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {typeInfo?.label}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {coeff.category}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">
                            {coeff.value}
                          </td>
                          <td className={`px-6 py-4 text-sm font-medium ${impactColor}`}>
                            {impact} ({((coeff.value - 1) * 100).toFixed(0):+}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info */}
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">✓ Exemple de calcul</h3>
              <p className="text-sm text-green-800 mb-2">
                Base: 100,000€ | Type: Maison (1.0) | État: Bon (1.0) | Terrain: Grand (1.3)
              </p>
              <p className="text-sm text-green-800 font-mono">
                = 100,000 × 1.0 × 1.0 × 1.3 = <strong>130,000€</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
