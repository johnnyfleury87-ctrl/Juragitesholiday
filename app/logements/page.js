'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicHeader, PublicFooter, PropertyCard } from '@/components/shared';
import { createClient } from '@/lib/supabase/client';

export default function LogementsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const supabase = createClient();

      try {
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('id, slug, title, description, location, price_per_night, is_published')
          .eq('is_published', true);

        if (fetchError) {
          console.error('❌ Supabase error:', fetchError);
          throw fetchError;
        }
        console.log('✅ Properties fetched:', data?.length || 0, data);
        setProperties(data || []);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError(`Erreur: ${err.message}`);
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
          ) : error ? (
            <div style={{ color: '#DC2626', padding: '1rem', background: '#FEE2E2', borderRadius: '0.5rem' }}>
              <p>❌ {error}</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Consultez la console navigateur pour plus de détails.</p>
            </div>
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

      <PublicFooter />
    </>
  );
}
