'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { validateEstimationData } from '@/lib/estimation-security';
import { audit } from '@/lib/audit-service';

const PROPERTY_TYPES = [
  { id: 'house', label: 'Maison' },
  { id: 'apartment', label: 'Appartement' },
  { id: 'other', label: 'Autre (terrain, commerce, etc.)' }
];

const CONDITIONS = [
  { id: 'poor', label: 'À rénover', value: 0.75 },
  { id: 'fair', label: 'Correct', value: 0.90 },
  { id: 'good', label: 'Bon', value: 1.0 },
  { id: 'excellent', label: 'Très bon', value: 1.20 }
];

export default function Step2PropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estimationId = searchParams.get('estimationId');

  const [formData, setFormData] = useState({
    propertyType: '',
    habitableArea: '',
    postalCode: '',
    commune: '',
    condition: '',
    constructionYear: new Date().getFullYear(),
    terrainArea: ''
  });

  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Vérifier auth
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

  // Charger les communes
  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const { data } = await supabase
          .from('communes')
          .select('id, name, postal_code, zone_id')
          .eq('is_active', true)
          .order('name');

        setCommunes(data || []);
      } catch (err) {
        console.error('Erreur chargement communes:', err);
      }
    };

    fetchCommunes();
  }, [supabase]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.propertyType) return 'Veuillez sélectionner un type de bien';
    if (!formData.habitableArea) return 'La surface habitable est obligatoire';
    if (!formData.commune) return 'La commune est obligatoire';
    if (!formData.postalCode) return 'Le code postal est obligatoire';
    if (!formData.condition) return 'L\'état du bien est obligatoire';

    // Valider avec security config
    try {
      validateEstimationData({
        habitable_area: parseFloat(formData.habitableArea),
        terrain_area: formData.terrainArea ? parseFloat(formData.terrainArea) : 0
      });
    } catch (err) {
      return err.message;
    }

    return null;
  };

  const handleNext = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mettre à jour l'estimation avec les données du bien
      const { error: updateError } = await supabase
        .from('estimation_requests')
        .update({
          data: {
            propertyType: formData.propertyType,
            habitableArea: parseFloat(formData.habitableArea),
            postalCode: formData.postalCode,
            commune: formData.commune,
            condition: formData.condition,
            constructionYear: parseInt(formData.constructionYear),
            terrainArea: formData.terrainArea ? parseFloat(formData.terrainArea) : null
          },
          status: 'draft'
        })
        .eq('id', estimationId);

      if (updateError) throw updateError;

      // Logger
      await audit.logEstimationSubmitted(estimationId, user.id, {
        step: 2,
        data: formData
      });

      router.push(`/estimation/form/step3-amenities?estimationId=${estimationId}`);
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-blue-600">Étape 2/5</span>
            <span className="text-sm text-gray-600">Données du bien</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Décrivez votre bien
          </h1>
          <p className="text-gray-600">
            Renseignez les caractéristiques principales de votre propriété.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6 mb-8">
          {/* Type de bien */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Type de bien <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PROPERTY_TYPES.map(type => (
                <label key={type.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer"
                  style={{
                    borderColor: formData.propertyType === type.id ? '#2563eb' : undefined,
                    backgroundColor: formData.propertyType === type.id ? '#eff6ff' : undefined
                  }}>
                  <input
                    type="radio"
                    name="propertyType"
                    value={type.id}
                    checked={formData.propertyType === type.id}
                    onChange={handleInputChange}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Surface habitable */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Surface habitable <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="habitableArea"
                value={formData.habitableArea}
                onChange={handleInputChange}
                placeholder="Ex: 150"
                min="1"
                max="500"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <span className="flex items-center text-gray-500 px-3">m²</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Entre 1 et 500 m²</p>
          </div>

          {/* Commune */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Commune <span className="text-red-500">*</span>
            </label>
            <select
              name="commune"
              value={formData.commune}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Sélectionner une commune --</option>
              {communes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Code postal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Code postal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="Ex: 39100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* État du bien */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              État du bien <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CONDITIONS.map(cond => (
                <label key={cond.id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer"
                  style={{
                    borderColor: formData.condition === cond.id ? '#2563eb' : undefined,
                    backgroundColor: formData.condition === cond.id ? '#eff6ff' : undefined
                  }}>
                  <input
                    type="radio"
                    name="condition"
                    value={cond.id}
                    checked={formData.condition === cond.id}
                    onChange={handleInputChange}
                    className="mt-1 mr-2 w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-sm">{cond.label}</div>
                    <div className="text-xs text-gray-500">Coeff: {cond.value}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Année de construction */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Année de construction (optionnel)
            </label>
            <input
              type="number"
              name="constructionYear"
              value={formData.constructionYear}
              onChange={handleInputChange}
              min="1800"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Surface terrain */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Surface du terrain (optionnel)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="terrainArea"
                value={formData.terrainArea}
                onChange={handleInputChange}
                placeholder="Ex: 1500"
                min="0"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <span className="flex items-center text-gray-500 px-3">m²</span>
            </div>
          </div>
        </form>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href={`/estimation/form/step1-reason?estimationId=${estimationId}`}>
            <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Retour
            </button>
          </Link>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sauvegarde...' : 'Continuer vers étape 3'}
          </button>
        </div>
      </div>
    </div>
  );
}
