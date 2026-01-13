'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/shared';
import { signUp } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await signUp(supabase, email, password, fullName);

      if (signUpError) throw signUpError;

      // Redirect to login for email verification
      router.push('/login?message=Vérifiez votre email');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PublicHeader />

      <div className="page-container">
        <div className="container" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Créer un compte</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            Déjà inscrit ? <Link href="/login" style={{ color: '#4F46E5' }}>Se connecter</Link>
          </p>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
