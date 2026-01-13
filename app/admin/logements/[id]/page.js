'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/shared';
import { withAdminAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function EditPropertyPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    location: '',
    price_per_night: '',
    max_guests: 1,
    bedrooms: 1,
    bathrooms: 1,
    is_published: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get property
        const { data: propData, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (propError) throw propError;
        setProperty(propData);
        setFormData(propData);
      } catch (err) {
        setError('Propriété non trouvée');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('properties')
        .update(formData)
        .eq('id', id);

      if (updateError) throw updateError;

      setMessage('Logement mis à jour avec succès');
      setTimeout(() => {
        router.push('/admin/logements');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div><AdminHeader /><div className="page-container container">Chargement...</div></div>;

  return (
    <>
      <AdminHeader />

      <div className="page-container">
        <div className="container" style={{ maxWidth: '800px' }}>
          <Link href="/admin/logements" style={{ color: '#4F46E5' }}>← Retour</Link>

          <h1 style={{ marginTop: '1rem' }}>Modifier le logement</h1>

          {error && <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>}
          {message && <div className="success-message" style={{ marginTop: '1rem' }}>{message}</div>}

          <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
            <div className="form-group">
              <label>Slug (URL)</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Localisation</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label>Prix par nuit (€)</label>
                <input
                  type="number"
                  name="price_per_night"
                  value={formData.price_per_night}
                  onChange={handleChange}
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Personnes maximum</label>
                <input
                  type="number"
                  name="max_guests"
                  value={formData.max_guests}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Chambres</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Salles de bain</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  style={{ marginRight: '0.5rem', width: 'auto' }}
                />
                Publier ce logement
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Mise à jour...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/logements')}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>

          {/* TODO: Add photos management section */}
          <div style={{ marginTop: '3rem', padding: '2rem', background: '#F9FAFB', borderRadius: '0.75rem' }}>
            <h2>Photos</h2>
            <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>
              TODO: Implémenter la gestion des photos de propriété
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAdminAuth(EditPropertyPage);
