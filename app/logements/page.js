'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicHeader, PropertyCard } from '@/components/shared';
import { createClient } from '@/lib/supabase/client';

export default function LogementsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, slug, title, description, location, price_per_night, is_published')
          .eq('is_published', true);

        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <>
      <PublicHeader />

      <div className="page-container">
        <div className="container">
          <h1>Nos logements</h1>
          <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
            Parcourez notre sélection de gîtes de vacances
          </p>

          {loading ? (
            <div>Chargement...</div>
          ) : properties.length === 0 ? (
            <div>Aucun logement disponible pour le moment.</div>
          ) : (
            <div className="grid grid-cols-3">
              {properties.map((property) => (
                <Link key={property.id} href={`/logements/${property.slug}`}>
                  <PropertyCard property={property} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
