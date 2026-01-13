'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicHeader, BookingRequestForm } from '@/components/shared';
import { createClient } from '@/lib/supabase/client';

export default function PropertyDetailPage({ params }) {
  const router = useRouter();
  const { slug } = params;
  const [property, setProperty] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Get property
        const { data: propData, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (propError) throw propError;
        setProperty(propData);

        // Get photos
        if (propData) {
          const { data: photosData, error: photosError } = await supabase
            .from('property_photos')
            .select('*')
            .eq('property_id', propData.id)
            .order('display_order');

          if (!photosError) {
            setPhotos(photosData || []);
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleBookingRequest = async (formData) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('booking_requests')
        .insert([{
          property_id: property.id,
          client_id: user.id,
          check_in: formData.checkIn,
          check_out: formData.checkOut,
          num_guests: formData.numGuests,
          status: 'pending',
        }]);

      if (error) throw error;

      setMessage('Demande de réservation envoyée avec succès !');
      setTimeout(() => {
        router.push('/app/reservations');
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div><PublicHeader /><div className="page-container container">Chargement...</div></div>;
  if (!property) return <div><PublicHeader /><div className="page-container container">Propriété non trouvée</div></div>;

  return (
    <>
      <PublicHeader />

      <div className="page-container">
        <div className="container">
          <Link href="/logements" style={{ color: '#4F46E5' }}>← Retour aux logements</Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '2rem' }}>
            <div>
              <h1>{property.title}</h1>
              <p className="location">{property.location}</p>
              <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>{property.description}</p>

              <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong>Personnes max:</strong> {property.max_guests}
                </div>
                <div>
                  <strong>Chambres:</strong> {property.bedrooms}
                </div>
                <div>
                  <strong>Salles de bain:</strong> {property.bathrooms}
                </div>
                <div>
                  <strong>Prix / nuit:</strong> {property.price_per_night}€
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h3>Galerie</h3>
                {photos.length === 0 ? (
                  <p>Aucune photo disponible</p>
                ) : (
                  <div className="grid grid-cols-2" style={{ marginTop: '1rem' }}>
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        style={{
                          borderRadius: '0.5rem',
                          objectFit: 'cover',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          height: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        📸 Photo {idx + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              {message && (
                <div className={message.includes('succès') ? 'success-message' : 'error-message'}>
                  {message}
                </div>
              )}

              <BookingRequestForm
                propertyId={property.id}
                onSubmit={handleBookingRequest}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
