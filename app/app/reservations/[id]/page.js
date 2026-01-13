'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/shared';
import { withAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function ReservationDetailPage({ params }) {
  const { id } = params;
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get reservation
        const { data: resData, error: resError } = await supabase
          .from('booking_requests')
          .select('*')
          .eq('id', id)
          .eq('client_id', user.id)
          .single();

        if (resError) throw resError;
        setReservation(resData);

        // Get property details
        if (resData) {
          const { data: propData, error: propError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', resData.property_id)
            .single();

          if (!propError) {
            setProperty(propData);
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div><ClientHeader /><div className="page-container container">Chargement...</div></div>;
  if (!reservation) return <div><ClientHeader /><div className="page-container container">Réservation non trouvée</div></div>;

  return (
    <>
      <ClientHeader />

      <div className="page-container">
        <div className="container" style={{ maxWidth: '600px' }}>
          <Link href="/app/reservations" style={{ color: '#4F46E5' }}>← Retour</Link>

          <div style={{ marginTop: '2rem', padding: '2rem', background: '#F9FAFB', borderRadius: '0.75rem' }}>
            <h1>Détail de la demande</h1>

            {property && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3>{property.title}</h3>
                <p className="location">{property.location}</p>
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <strong>Arrivée:</strong>
                <p>{new Date(reservation.check_in).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <strong>Départ:</strong>
                <p>{new Date(reservation.check_out).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <strong>Personnes:</strong>
                <p>{reservation.num_guests}</p>
              </div>
              <div>
                <strong>Statut:</strong>
                <p>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    background: reservation.status === 'accepted' ? '#DCFCE7' : reservation.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                    color: reservation.status === 'accepted' ? '#15803D' : reservation.status === 'rejected' ? '#DC2626' : '#B45309',
                  }}>
                    {reservation.status === 'pending' && 'En attente'}
                    {reservation.status === 'accepted' && 'Confirmée'}
                    {reservation.status === 'rejected' && 'Rejetée'}
                  </span>
                </p>
              </div>
            </div>

            {reservation.status === 'pending' && (
              <div style={{ marginTop: "2rem", padding: "1rem", background: "#FEF3C7", borderRadius: "0.5rem", borderLeft: "4px solid #B45309" }}>
                <p>Votre demande est en attente d&apos;approbation.</p>
              </div>
            )}

            {reservation.status === 'accepted' && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#DCFCE7', borderRadius: '0.5rem', borderLeft: '4px solid #16A34A' }}>
                <p>Votre réservation est confirmée !</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Un email de confirmation a été envoyé.
                </p>
              </div>
            )}

            {reservation.status === 'rejected' && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#FEE2E2', borderRadius: '0.5rem', borderLeft: '4px solid #DC2626' }}>
                <p>Votre demande a été rejetée.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default withAuth(ReservationDetailPage);
