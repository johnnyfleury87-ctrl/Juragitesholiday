'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/shared';
import { withAdminAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function LogementsPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get org
        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single();

        if (!orgMember) return;
        setOrgId(orgMember.org_id);

        // Get properties
        const { data, error } = await supabase
          .from('properties')
          .select('id, slug, title, location, price_per_night, is_published')
          .eq('org_id', orgMember.org_id)
          .order('created_at', { ascending: false });

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
      <AdminHeader />

      <div className="page-container">
        <div className="container">
          <Link href="/admin" style={{ color: '#4F46E5' }}>← Retour</Link>

          <h1 style={{ marginTop: '1rem' }}>Gestion des logements</h1>

          <Link href="/admin/logements/new" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            + Ajouter un logement
          </Link>

          {loading ? (
            <div style={{ marginTop: '2rem' }}>Chargement...</div>
          ) : properties.length === 0 ? (
            <div style={{ marginTop: '2rem', padding: '2rem', background: '#F9FAFB', borderRadius: '0.5rem' }}>
              <p>Aucun logement créé</p>
            </div>
          ) : (
            <div style={{ marginTop: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Titre</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Localisation</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Prix / nuit</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Publié</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop) => (
                    <tr key={prop.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '1rem' }}>{prop.title}</td>
                      <td style={{ padding: '1rem' }}>{prop.location}</td>
                      <td style={{ padding: '1rem' }}>{prop.price_per_night}€</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          background: prop.is_published ? '#DCFCE7' : '#FEE2E2',
                          color: prop.is_published ? '#15803D' : '#DC2626',
                        }}>
                          {prop.is_published ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Link href={`/admin/logements/${prop.id}`} style={{ color: '#4F46E5', marginRight: '1rem' }}>
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default withAdminAuth(LogementsPage);
