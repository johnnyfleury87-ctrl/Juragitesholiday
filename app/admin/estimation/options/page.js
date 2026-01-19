'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const AMENITY_CATEGORIES = [
  { id: 'structures', label: 'Structures' },
  { id: 'outdoor', label: 'Extérieurs' },
  { id: 'comfort', label: 'Confort' },
  { id: 'nuances', label: 'Facteurs négatifs/positifs' }
];

export default function OptionsManagementPage() {
  const router = useRouter();
  const [options, setOptions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    label: '',
    category: '',
    fixedValue: '',
    percentageValue: '',
    description: ''
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

        // Charger les options
        const { data: optionsData } = await supabase
          .from('options_values')
          .select('*')
          .eq('is_active', true)
          .order('category');

        setOptions(optionsData || []);
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

    if (!formData.label || !formData.category) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!formData.fixedValue && !formData.percentageValue) {
      setError('Veuillez entrer soit une valeur fixe, soit un pourcentage.');
      return;
    }

    try {
      const insertData = {
        name: formData.label,
        category: formData.category,
        description: formData.description,
        is_active: true
      };

      if (formData.fixedValue) {
        insertData.fixed_value_eur = parseFloat(formData.fixedValue);
      }

      if (formData.percentageValue) {
        insertData.percentage_adjustment = parseFloat(formData.percentageValue);
      }

      const { error: insertError } = await supabase
        .from('options_values')
        .insert([insertData]);

      if (insertError) throw insertError;

      setSuccessMessage('Amenity ajoutée avec succès!');
      setFormData({ label: '', category: '', fixedValue: '', percentageValue: '', description: '' });

      // Recharger
      const { data: updated } = await supabase
        .from('options_values')
        .select('*')
        .eq('is_active', true)
        .order('category');
      setOptions(updated || []);
    } catch (err) {
      console.error('Erreur insert:', err);
      setError('Erreur lors de l\'ajout.');
    }
  };

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

  const optionsByCategory = AMENITY_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = options.filter(o => o.category === cat.id);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">🏠 Gestion Amenities</h1>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter amenity</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Ex: Piscine"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    {AMENITY_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur fixe (€) <span className="text-gray-500">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.fixedValue}
                    onChange={(e) => setFormData({ ...formData, fixedValue: e.target.value })}
                    placeholder="Ex: 30000"
                    step="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajustement % <span className="text-gray-500">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.percentageValue}
                    onChange={(e) => setFormData({ ...formData, percentageValue: e.target.value })}
                    placeholder="Ex: +10 ou -15"
                    step="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Positif ou négatif</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-gray-500">(optionnel)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Piscine creusée de qualité"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  ✓ Ajouter amenity
                </button>
              </form>
            </div>
          </div>

          {/* Data by Category */}
          <div className="lg:col-span-2 space-y-6">
            {AMENITY_CATEGORIES.map(category => (
              <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
                </div>
                
                {optionsByCategory[category.id].length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Aucune amenity dans cette catégorie
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {optionsByCategory[category.id].map((opt, idx) => (
                      <div key={idx} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{opt.name}</p>
                            {opt.description && (
                              <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            {opt.fixed_value_eur && (
                              <p className="font-mono text-green-600">
                                +{(opt.fixed_value_eur / 1000).toFixed(1)}k€
                              </p>
                            )}
                            {opt.percentage_adjustment && (
                              <p className={`font-mono ${opt.percentage_adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {opt.percentage_adjustment > 0 ? '+' : ''}{opt.percentage_adjustment}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">💡 Types d'ajustement</h3>
          <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
            <li><strong>Valeur fixe</strong>: Montant exact ajouté à la valeur (ex: Piscine +30,000€)</li>
            <li><strong>Pourcentage</strong>: Pourcentage appliqué à la valeur (ex: Vue +10%, Bruit -10%)</li>
            <li>Vous pouvez utiliser l'un ou l'autre (ou les deux)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
