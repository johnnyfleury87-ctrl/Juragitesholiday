'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/shared';
import { withAdminAuth } from '@/lib/guards';
import { ADMIN_DEV_MODE } from '@/lib/devMode';
import { createClient } from '@/lib/supabase/client';

// Fallback demo data when no properties exist
const DEMO_PROPERTIES = [
  {
    id: 'demo-1',
    title: 'Chalet Montagne 12 places',
    location: 'Jura, Morbier',
    price_per_night: 350,
    max_guests: 12,
    is_published: true,
    is_demo: true,
    description: 'Superbe chalet avec piscine chauffée et vue panoramique',
  },
  {
    id: 'demo-2',
    title: 'Maison 8 places avec Jacuzzi',
    location: 'Jura, Lons-le-Saunier',
    price_per_night: 280,
    max_guests: 8,
    is_published: true,
    is_demo: true,
    description: 'Maison confortable avec jacuzzi privé et jardin',
  },
];

function LogementsPage({ isDevMode }) {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orgId, setOrgId] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const supabase = createClient();

      try {
        // In dev mode, try to get all properties (without org filter)
        if (ADMIN_DEV_MODE) {
          console.log('📱 Dev Mode: Fetching all properties (no org filter)');
          const { data, error: err } = await supabase
            .from('properties')
            .select('id, slug, title, location, price_per_night, max_guests, is_published, created_at')
            .order('created_at', { ascending: false });

          if (err) throw err;

          if (data && data.length > 0) {
            console.log(`✅ Found ${data.length} properties`);
            setProperties(data);
          } else {
            console.log('ℹ️ No properties in DB, showing demo data');
            setProperties(DEMO_PROPERTIES);
          }
          setLoading(false);
          return;
        }

        // Production mode: get user and org
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get org
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single();

        if (orgError) throw orgError;
        if (!orgMember) {
          throw new Error('User is not member of any organization');
        }

        setOrgId(orgMember.org_id);

        // Get properties for this org
        const { data, error: propsError } = await supabase
          .from('properties')
          .select('id, slug, title, location, price_per_night, max_guests, is_published, created_at')
          .eq('org_id', orgMember.org_id)
          .order('created_at', { ascending: false });

        if (propsError) throw propsError;

        if (data && data.length > 0) {
          setProperties(data);
        } else {
          // Show demo data as fallback
          console.log('ℹ️ No properties for this org, showing demo data');
          setProperties(DEMO_PROPERTIES);
        }
      } catch (err) {
        console.error('❌ Error fetching properties:', err);
        setError({
          message: err.message,
          details: err.details || 'Une erreur est survenue lors du chargement des logements',
        });
        // Still show demo data on error
        setProperties(DEMO_PROPERTIES);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <>
      <AdminHeader />

      <div className="page-container">
        <div className="container">
          <Link href="/admin" style={{ color: '#4F46E5' }}>← Retour</Link>

          <h1 style={{ marginTop: '1rem' }}>Gestion des logements</h1>

          {/* ERROR BANNER */}
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#FEE2E2',
              border: '2px solid #F87171',
              borderRadius: '0.5rem',
              color: '#DC2626'
            }}>
              <strong>⚠️ Erreur Supabase</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>{error.message}</p>
              {error.details && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9em' }}>{error.details}</p>}
            </div>
          )}

          {/* DEV MODE INDICATOR */}
          {isDevMode && properties.some(p => p.is_demo) && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#FEF3C7',
              border: '2px solid #FBBF24',
              borderRadius: '0.5rem',
              color: '#92400E'
            }}>
              <strong>ℹ️ Données de démonstration</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9em' }}>
                Aucun logement en base de données. Les logements affichés ci-dessous sont fictifs.
              </p>
            </div>
          )}

          <Link href="/admin/logements/new" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            + Ajouter un logement
          </Link>

          {loading ? (
            <div style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', color: '#666' }}>
              <p>⏳ Chargement des logements...</p>
            </div>
          ) : properties.length === 0 ? (
            <div style={{
              marginTop: '2rem',
              padding: '2rem',
              background: '#F9FAFB',
              borderRadius: '0.5rem',
              textAlign: 'center',
              color: '#666'
            }}>
              <p>🏠 Aucun logement créé</p>
            </div>
          ) : (
            <div style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Image placeholder */}
                  <div style={{
                    height: '200px',
                    background: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9CA3AF',
                    fontSize: '3em'
                  }}>
                    🏠
                  </div>

                  {/* Content */}
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1em', color: '#1F2937', flex: 1 }}>
                        {prop.title}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        background: prop.is_published ? '#DCFCE7' : '#FEE2E2',
                        color: prop.is_published ? '#15803D' : '#DC2626',
                        fontSize: '0.85em',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        marginLeft: '0.5rem'
                      }}>
                        {prop.is_published ? '✓ Publié' : '○ Brouillon'}
                      </span>
                    </div>

                    <p style={{ margin: '0.5rem 0', color: '#6B7280', fontSize: '0.9em' }}>
                      📍 {prop.location}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #E5E7EB'
                    }}>
                      <div>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.85em' }}>Prix / nuit</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2em', fontWeight: 'bold', color: '#4F46E5' }}>
                          {prop.price_per_night}€
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.85em' }}>Capacité</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2em', fontWeight: 'bold', color: '#1F2937' }}>
                          {prop.max_guests ? `${prop.max_guests} personnes` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Demo badge */}
                    {prop.is_demo && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: '0.25rem',
                        fontSize: '0.85em',
                        color: '#92400E',
                        textAlign: 'center'
                      }}>
                        📋 Données fictives (demo)
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{
                      marginTop: '1rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem'
                    }}>
                      {!prop.is_demo && (
                        <Link
                          href={`/admin/logements/${prop.id}`}
                          style={{
                            padding: '0.5rem',
                            background: '#4F46E5',
                            color: 'white',
                            borderRadius: '0.375rem',
                            textAlign: 'center',
                            fontSize: '0.9em',
                            fontWeight: '600',
                            textDecoration: 'none'
                          }}
                        >
                          Modifier
                        </Link>
                      )}
                      {prop.is_demo && (
                        <div style={{
                          padding: '0.5rem',
                          background: '#E5E7EB',
                          color: '#6B7280',
                          borderRadius: '0.375rem',
                          textAlign: 'center',
                          fontSize: '0.9em'
                        }}>
                          (Demo - non modifiable)
                        </div>
                      )}
                      <Link
                        href={`/logements/${prop.slug || prop.id}`}
                        style={{
                          padding: '0.5rem',
                          background: '#F3F4F6',
                          color: '#4F46E5',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          textAlign: 'center',
                          fontSize: '0.9em',
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default withAdminAuth(LogementsPage);
