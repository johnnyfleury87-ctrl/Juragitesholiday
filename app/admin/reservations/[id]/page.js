'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/shared';
import { withAdminAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function ReservationDetailPage({ params }) {
  const { id } = params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        // Get booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', id)
          .single();

        if (bookingError) throw bookingError;
        setBooking(bookingData);

        // Get payment
        if (bookingData) {
          const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('booking_id', bookingData.id)
            .single();

          if (paymentData) {
            setPayment(paymentData);
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

  const handleMarkAsPaid = async () => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('id', payment.id);

      if (error) throw error;

      // Create loyalty points (nights * 10)
      const nights = Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24));
      const points = nights * 10;

      // Get or create loyalty account
      const { data: loyaltyAccount } = await supabase
        .from('loyalty_accounts')
        .select('id')
        .eq('client_id', booking.client_id)
        .single();

      if (loyaltyAccount) {
        // Add points
        const { error: ledgerError } = await supabase
          .from('loyalty_ledger')
          .insert([{
            loyalty_account_id: loyaltyAccount.id,
            booking_id: booking.id,
            points_delta: points,
            reason: 'Booking completed',
          }]);

        if (ledgerError) console.error('Error creating ledger:', ledgerError);

        // Update loyalty balance
        await supabase
          .from('loyalty_accounts')
          .update({ points_balance: points })
          .eq('id', loyaltyAccount.id);
      }

      setPayment({ ...payment, status: 'paid' });
      alert('Paiement marqué comme payé');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div><AdminHeader /><div className="page-container container">Chargement...</div></div>;
  if (!booking) return <div><AdminHeader /><div className="page-container container">Réservation non trouvée</div></div>;

  return (
    <>
      <AdminHeader />

      <div className="page-container">
        <div className="container" style={{ maxWidth: '600px' }}>
          <Link href="/admin/reservations" style={{ color: '#4F46E5' }}>← Retour</Link>

          <h1 style={{ marginTop: '1rem' }}>Détail de la réservation</h1>

          <div style={{ marginTop: '2rem', padding: '2rem', background: '#F9FAFB', borderRadius: '0.75rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Arrivée:</strong>
              <p>{new Date(booking.check_in).toLocaleDateString('fr-FR')}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Départ:</strong>
              <p>{new Date(booking.check_out).toLocaleDateString('fr-FR')}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Personnes:</strong>
              <p>{booking.num_guests}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Total:</strong>
              <p>{booking.total_price}€</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Statut:</strong>
              <p>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.25rem',
                  background: '#DCFCE7',
                  color: '#15803D',
                }}>
                  Confirmée
                </span>
              </p>
            </div>

            {payment && (
              <>
                <div style={{ marginTop: '2rem', borderTop: '1px solid #E5E7EB', paddingTop: '2rem' }}>
                  <h3>Paiement</h3>

                  <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <strong>Montant:</strong>
                    <p>{payment.amount}€</p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Statut:</strong>
                    <p>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        background: payment.status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                        color: payment.status === 'paid' ? '#15803D' : '#B45309',
                      }}>
                        {payment.status === 'pending' && 'En attente'}
                        {payment.status === 'paid' && 'Payé'}
                      </span>
                    </p>
                  </div>

                  {payment.status === 'pending' && (
                    <button onClick={handleMarkAsPaid} className="btn-primary">
                      Marquer comme payé
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default withAdminAuth(ReservationDetailPage);
