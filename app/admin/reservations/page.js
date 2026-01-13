'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/shared';
import { withAdminAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function ReservationsPage() {
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
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

        // Get booking requests
        const { data, error } = await supabase
          .from('booking_requests')
          .select('id, property_id, check_in, check_out, status, num_guests')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookingRequests(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAcceptRequest = async (requestId, propertyId, checkIn, checkOut, numGuests) => {
    try {
      const supabase = createClient();

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          booking_request_id: requestId,
          property_id: propertyId,
          check_in: checkIn,
          check_out: checkOut,
          num_guests: numGuests,
          status: 'active',
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create payment
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * 100; // TODO: Get actual price from property

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          booking_id: booking.id,
          amount: totalPrice,
          status: 'pending',
        }]);

      if (paymentError) throw paymentError;

      // Update request status
      const { error: updateError } = await supabase
        .from('booking_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Refresh list
      setBookingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'acceptation');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('booking_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      setBookingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du rejet');
    }
  };

  return (
    <>
      <AdminHeader />

      <div className="page-container">
        <div className="container">
          <Link href="/admin" style={{ color: '#4F46E5' }}>← Retour</Link>

          <h1 style={{ marginTop: '1rem' }}>Gestion des réservations</h1>

          {loading ? (
            <div>Chargement...</div>
          ) : bookingRequests.length === 0 ? (
            <div style={{ marginTop: '2rem', padding: '2rem', background: '#F9FAFB', borderRadius: '0.5rem' }}>
              <p>Aucune demande en attente</p>
            </div>
          ) : (
            <div style={{ marginTop: '2rem' }}>
              {bookingRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    padding: '2rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    background: '#F9FAFB',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <strong>Arrivée</strong>
                      <p>{request.check_in}</p>
                    </div>
                    <div>
                      <strong>Départ</strong>
                      <p>{request.check_out}</p>
                    </div>
                    <div>
                      <strong>Personnes</strong>
                      <p>{request.num_guests}</p>
                    </div>
                    <div>
                      <strong>Statut</strong>
                      <p>En attente</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => handleAcceptRequest(
                        request.id,
                        request.property_id,
                        request.check_in,
                        request.check_out,
                        request.num_guests
                      )}
                      className="btn-primary"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="btn-secondary"
                    >
                      Rejeter
                    </button>
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

export default withAdminAuth(ReservationsPage);
