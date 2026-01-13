'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/shared';
import { withAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Profil mis à jour avec succès');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ClientHeader />

      <div className="page-container">
        <div className="container" style={{ maxWidth: '600px' }}>
          <Link href="/app" style={{ color: '#4F46E5' }}>← Retour</Link>

          <h1 style={{ marginTop: '1rem' }}>Mon profil</h1>

          {message && (
            <div className={message.includes('succès') ? 'success-message' : 'error-message'} style={{ marginTop: '1rem' }}>
              {message}
            </div>
          )}

          {loading ? (
            <div>Chargement...</div>
          ) : (
            <div style={{ marginTop: '2rem', padding: '2rem', background: '#F9FAFB', borderRadius: '0.75rem' }}>
              {!editing ? (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <strong>Email:</strong>
                    <p>{profile?.email}</p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <strong>Nom complet:</strong>
                    <p>{profile?.full_name || 'Non renseigné'}</p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <strong>Téléphone:</strong>
                    <p>{profile?.phone || 'Non renseigné'}</p>
                  </div>

                  <button
                    onClick={() => setEditing(true)}
                    className="btn-primary"
                  >
                    Modifier
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Nom complet</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFullName(profile?.full_name || '');
                        setPhone(profile?.phone || '');
                      }}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default withAuth(ProfilePage);
