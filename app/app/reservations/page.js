'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/shared';
import { withAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('booking_requests')
          .select('id, property_id, check_in, check_out, status, created_at')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReservations(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  return (
    <>
      <ClientHeader />

      <div className="page-container">
        <div className="container">
          <Link href="/app" style={{ color: '#4F46E5' }}>← Retour au tableau de bord</Link>

          <h1 style={{ marginTop: '1rem' }}>Mes demandes de réservation</h1>

          {loading ? (
            <div>Chargement...</div>
          ) : reservations.length === 0 ? (
            <div style={{ marginTop: '2rem', padding: '2rem', background: '#F9FAFB', borderRadius: '0.5rem' }}>
              <p>Aucune demande de réservation pour le moment.</p>
              <Link href="/logements" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Découvrir les logements
              </Link>
            </div>
          ) : (
            <div style={{ marginTop: '2rem' }}>
              {reservations.map((res) => (
                <div
                  key={res.id}
                  style={{
                    padding: '2rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => router.push(`/app/reservations/${res.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3>{res.check_in} → {res.check_out}</h3>
                      <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                        Demandée le {new Date(res.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      background: res.status === 'accepted' ? '#DCFCE7' : res.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                      color: res.status === 'accepted' ? '#15803D' : res.status === 'rejected' ? '#DC2626' : '#B45309',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      {res.status === 'pending' && 'En attente'}
                      {res.status === 'accepted' && 'Confirmée'}
                      {res.status === 'rejected' && 'Rejetée'}
                    </span>
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

export default withAuth(ReservationsPage);
