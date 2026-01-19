'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function PricingManagementPage() {
  const router = useRouter();
  const [communes, setCommunes] = useState([]);
  const [zones, setZones] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formMode, setFormMode] = useState('commune'); // 'commune' or 'zone'
  const [formData, setFormData] = useState({
    commune: '',
    pricePerM2: '',
    zoneId: '',
    zoneName: ''
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

        // Charger communes
        const { data: communesData } = await supabase
          .from('communes')
          .select('*')
          .eq('is_active', true)
          .order('name');

        setCommunes(communesData || []);

        // Charger zones
        const { data: zonesData } = await supabase
          .from('zones')
          .select('*')
          .eq('is_active', true)
          .order('name');

        setZones(zonesData || []);

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

    if (formMode === 'commune') {
      if (!formData.commune || !formData.pricePerM2) {
        setError('Veuillez remplir tous les champs.');
        return;
      }

      try {
        const { error: insertError } = await supabase
          .from('price_per_m2')
          .insert([
            {
              commune_id: formData.commune,
              price_per_m2: parseFloat(formData.pricePerM2),
              is_active: true
            }
          ]);

        if (insertError) throw insertError;

        setSuccessMessage('Tarification commune mise à jour avec succès!');
        setFormData({ commune: '', pricePerM2: '', zoneId: '', zoneName: '' });

        // Recharger
        const { data: updated } = await supabase
          .from('communes')
          .select('*')
          .eq('is_active', true)
          .order('name');
        setCommunes(updated || []);
      } catch (err) {
        console.error('Erreur insert:', err);
        setError('Erreur lors de la mise à jour.');
      }
    } else {
      if (!formData.zoneName || !formData.pricePerM2) {
        setError('Veuillez remplir tous les champs.');
        return;
      }

      try {
        // Mettre à jour la zone
        const { error: updateError } = await supabase
          .from('zones')
          .update({
            base_price_per_m2: parseFloat(formData.pricePerM2)
          })
          .eq('id', formData.zoneId);

        if (updateError) throw updateError;

        setSuccessMessage('Tarification zone mise à jour avec succès!');
        setFormData({ commune: '', pricePerM2: '', zoneId: '', zoneName: '' });

        // Recharger
        const { data: updated } = await supabase
          .from('zones')
          .select('*')
          .eq('is_active', true)
          .order('name');
        setZones(updated || []);
      } catch (err) {
        console.error('Erreur update:', err);
        setError('Erreur lors de la mise à jour.');
      }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">💰 Gestion Tarification</h1>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter tarification</h2>

              {/* Mode selector */}
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => setFormMode('commune')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    formMode === 'commune'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Commune
                </button>
                <button
                  onClick={() => setFormMode('zone')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    formMode === 'zone'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Zone
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formMode === 'commune' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commune
                      </label>
                      <select
                        value={formData.commune}
                        onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Sélectionner --</option>
                        {communes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zone
                      </label>
                      <select
                        value={formData.zoneId}
                        onChange={(e) => {
                          const zone = zones.find(z => z.id === e.target.value);
                          setFormData({
                            ...formData,
                            zoneId: e.target.value,
                            zoneName: zone?.name || ''
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Sélectionner --</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix/m² (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerM2}
                    onChange={(e) => setFormData({ ...formData, pricePerM2: e.target.value })}
                    placeholder="Ex: 1500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  ✓ Ajouter/Mettre à jour
                </button>
              </form>
            </div>
          </div>

          {/* Data Tables */}
          <div className="lg:col-span-2 space-y-8">
            {/* Communes Pricing */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Tarification communes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Commune
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Prix/m²
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Zone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {communes.map((commune, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{commune.name}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {commune.base_price_per_m2 ? `${commune.base_price_per_m2}€` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {commune.zone_id || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Zones Pricing */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Tarification zones</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Prix/m² (base)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{zone.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {zone.base_price_per_m2}€
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{zone.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Versioning:</strong> Chaque changement crée une nouvelle version. 
            Les estimations précédentes conservent les anciens tarifs.
          </p>
        </div>
      </div>
    </div>
  );
}
