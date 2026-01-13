'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/shared';
import { withAdminAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function NewPropertyPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState(null);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getOrgId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (orgMember) {
        setOrgId(orgMember.org_id);
      }
    };

    getOrgId();
  }, []);

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
    setLoading(true);

    try {
      if (!orgId) throw new Error('Org ID not found');

      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from('properties')
        .insert([{
          ...formData,
          org_id: orgId,
          price_per_night: parseFloat(formData.price_per_night),
        }])
        .select();

      if (insertError) throw insertError;

      setMessage('Logement créé avec succès');
      setTimeout(() => {
        router.push('/admin/logements');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminHeader />

      <div className="page-container">
        <div className="container" style={{ maxWidth: '800px' }}>
          <Link href="/admin/logements" style={{ color: '#4F46E5' }}>← Retour</Link>

          <h1 style={{ marginTop: '1rem' }}>Créer un logement</h1>

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

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Création...' : 'Créer le logement'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default withAdminAuth(NewPropertyPage);
