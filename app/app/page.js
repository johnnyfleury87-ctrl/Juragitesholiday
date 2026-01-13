'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/shared';
import { withAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function AppPage() {
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
          .select('id, property_id, check_in, check_out, status')
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
          <h1>Tableau de bord</h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
            <div className="admin-card">
              <h3>{reservations.length}</h3>
              <p>Demandes de réservation</p>
            </div>
            <div className="admin-card">
              <h3>
                {reservations.filter(r => r.status === 'accepted').length}
              </h3>
              <p>Réservations confirmées</p>
            </div>
            <div className="admin-card">
              <h3>0</h3>
              <p>Points de fidélité</p>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h2>Mes réservations</h2>
            <Link href="/app/reservations" className="btn-primary">
              Voir toutes les réservations
            </Link>
          </div>

          {loading ? (
            <div>Chargement...</div>
          ) : reservations.length === 0 ? (
            <div style={{ marginTop: '2rem' }}>
              <p>Aucune demande de réservation pour le moment.</p>
              <Link href="/logements" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Découvrir les logements
              </Link>
            </div>
          ) : (
            <div style={{ marginTop: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Arrivée</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Départ</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.slice(0, 5).map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '1rem' }}>{res.check_in}</td>
                      <td style={{ padding: '1rem' }}>{res.check_out}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          background: res.status === 'accepted' ? '#DCFCE7' : '#FEF3C7',
                          color: res.status === 'accepted' ? '#15803D' : '#B45309',
                        }}>
                          {res.status === 'pending' && 'En attente'}
                          {res.status === 'accepted' && 'Confirmée'}
                          {res.status === 'rejected' && 'Rejetée'}
                        </span>
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

export default withAuth(AppPage);
