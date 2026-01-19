'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { audit } from '@/lib/audit-service';

const AMENITY_CATEGORIES = {
  structures: {
    label: 'Structures',
    items: [
      { id: 'garage', label: 'Garage', fixed: 15000 },
      { id: 'carport', label: 'Carport', fixed: 5000 },
      { id: 'cellar', label: 'Cave', fixed: 2000 }
    ]
  },
  outdoor: {
    label: 'Extérieurs',
    items: [
      { id: 'terrace', label: 'Terrasse', fixed: 8000 },
      { id: 'balcony', label: 'Balcon', fixed: 3000 },
      { id: 'garden', label: 'Jardin', percentage: 5 }
    ]
  },
  comfort: {
    label: 'Confort',
    items: [
      { id: 'pool', label: 'Piscine', fixed: 30000 },
      { id: 'heating', label: 'Chauffage central', percentage: 5 },
      { id: 'aircon', label: 'Climatisation', percentage: 3 }
    ]
  },
  nuances: {
    label: 'Facteurs négatifs/positifs',
    items: [
      { id: 'view', label: 'Vue panoramique/agréable', percentage: 10 },
      { id: 'noise', label: 'Bruit (circulation, voisinage)', percentage: -10 },
      { id: 'pollution', label: 'Pollution/odeurs', percentage: -15 }
    ]
  }
};

export default function Step3AmenitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estimationId = searchParams.get('estimationId');

  const [selectedAmenities, setSelectedAmenities] = useState(new Set());
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

  const toggleAmenity = (amenityId) => {
    const newSet = new Set(selectedAmenities);
    if (newSet.has(amenityId)) {
      newSet.delete(amenityId);
    } else {
      newSet.add(amenityId);
    }
    setSelectedAmenities(newSet);
  };

  const handleNext = async () => {
    setLoading(true);
    setError('');

    try {
      const amenitiesData = Array.from(selectedAmenities);

      // Mettre à jour l'estimation
      const { data, error: fetchError } = await supabase
        .from('estimation_requests')
        .select('data')
        .eq('id', estimationId)
        .single();

      if (fetchError) throw fetchError;

      const existingData = data.data || {};
      const { error: updateError } = await supabase
        .from('estimation_requests')
        .update({
          data: {
            ...existingData,
            amenities: amenitiesData
          }
        })
        .eq('id', estimationId);

      if (updateError) throw updateError;

      // Logger
      await audit.logEstimationSubmitted(estimationId, user.id, {
        step: 3,
        amenities: amenitiesData
      });

      router.push(`/estimation/form/step4-consent?estimationId=${estimationId}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Calculer le total des amenities pour affichage
  const getTotalAdjustment = () => {
    let total = 0;
    selectedAmenities.forEach(amenityId => {
      Object.values(AMENITY_CATEGORIES).forEach(category => {
        const item = category.items.find(i => i.id === amenityId);
        if (item && item.fixed) {
          total += item.fixed;
        }
      });
    });
    return total;
  };

  const selectedAmenitiesDetails = Array.from(selectedAmenities).map(amenityId => {
    for (const category of Object.values(AMENITY_CATEGORIES)) {
      const item = category.items.find(i => i.id === amenityId);
      if (item) {
        return { ...item, categoryLabel: category.label };
      }
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-blue-600">Étape 3/5</span>
            <span className="text-sm text-gray-600">Éléments et équipements</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Équipements et éléments du bien
          </h1>
          <p className="text-gray-600">
            Sélectionnez les équipements et éléments présents dans votre bien. Tous les champs sont optionnels.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Amenities by category */}
        <div className="space-y-6 mb-8">
          {Object.entries(AMENITY_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{category.label}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.items.map(item => (
                  <label key={item.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer"
                    style={{
                      borderColor: selectedAmenities.has(item.id) ? '#2563eb' : undefined,
                      backgroundColor: selectedAmenities.has(item.id) ? '#eff6ff' : undefined
                    }}>
                    <input
                      type="checkbox"
                      checked={selectedAmenities.has(item.id)}
                      onChange={() => toggleAmenity(item.id)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="ml-3 flex-1 text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                    {item.fixed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        +{(item.fixed / 1000).toFixed(0)}k€
                      </span>
                    )}
                    {item.percentage && (
                      <span className={`text-xs px-2 py-1 rounded ${item.percentage > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.percentage > 0 ? '+' : ''}{item.percentage}%
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {selectedAmenitiesDetails.length > 0 && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✓ Équipements sélectionnés</h3>
            <div className="space-y-1">
              {selectedAmenitiesDetails.map((detail, idx) => (
                <div key={idx} className="text-sm text-green-800">
                  • {detail.label}
                  {detail.fixed && ` (+${(detail.fixed / 1000).toFixed(0)}k€)`}
                  {detail.percentage && ` (${detail.percentage > 0 ? '+' : ''}${detail.percentage}%)`}
                </div>
              ))}
            </div>
            {getTotalAdjustment() > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200 font-semibold text-green-900">
                Ajustement total fixe: +{(getTotalAdjustment() / 1000).toFixed(1)}k€
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Ces équipements seront pris en compte dans le calcul de votre estimation 
            pour ajuster la valeur de base de votre bien.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href={`/estimation/form/step2-property?estimationId=${estimationId}`}>
            <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Retour
            </button>
          </Link>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sauvegarde...' : 'Continuer vers étape 4'}
          </button>
        </div>
      </div>
    </div>
  );
}
