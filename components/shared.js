'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/lib/supabase/auth';
import { ADMIN_DEV_MODE } from '@/lib/devMode';
import { SocialLinks, SocialLinksFooter } from './SocialLinks';

// Header component for public pages
export function PublicHeader() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await signOut(supabase);
    window.location.href = '/';
  }

  return (
    <header className="header">
      <nav className="nav-container">
        <Link href="/" className="logo">JuraGites</Link>
        <div className="nav-center">
          <Link href="/logements">Logements</Link>
          <Link href="/activites">Activités</Link>
        </div>
        <div className="nav-right">
          <Link href="/admin/dashboard" className="btn-celia-nav">⚙️ Célia – Gestion</Link>
          {ADMIN_DEV_MODE && (
            <Link href="/admin" className="btn-primary" style={{ background: '#fbbf24', color: '#000' }}>
              👨‍💻 Admin (dev)
            </Link>
          )}
          {user ? (
            <>
              <Link href="/app">Tableau de bord</Link>
              <button onClick={() => handleSignOut()} className="btn-secondary">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Connexion</Link>
              <Link href="/signup" className="btn-primary">Inscription</Link>
            </>
          )}
          <SocialLinks />
        </div>
      </nav>
    </header>
  );
}

// Header for authenticated client pages
export function ClientHeader() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await signOut(supabase);
    window.location.href = '/';
  }

  return (
    <header className="header">
      <nav className="nav-container">
        <Link href="/" className="logo">JuraGites</Link>
        <div className="nav-links">
          <Link href="/app">Réservations</Link>
          <Link href="/app/profile">Profil</Link>
          <button onClick={handleSignOut} className="btn-secondary">
            Déconnexion
          </button>
        </div>
      </nav>
    </header>
  );
}

// Header for admin pages
export function AdminHeader() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await signOut(supabase);
    window.location.href = '/';
  }

  return (
    <header className="admin-header">
      <nav className="nav-container">
        <Link href="/admin" className="logo">JuraGites Admin</Link>
        <div className="nav-links">
          <Link href="/admin/logements">Logements</Link>
          <Link href="/admin/reservations">Réservations</Link>
          <button onClick={handleSignOut} className="btn-secondary">
            Déconnexion
          </button>
        </div>
      </nav>
    </header>
  );
}

// Property card component
export function PropertyCard({ property, onClick }) {
  return (
    <div className="property-card" onClick={onClick}>
      <div className="property-image">
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          textAlign: 'center',
          padding: '1rem',
        }}>
          📸 {property.title}
        </div>
      </div>
      <div className="property-info">
        <h3>{property.title}</h3>
        <p className="location">{property.location}</p>
        <p className="price">{property.price_per_night}€ / nuit</p>
        <p className="description">{property.description?.substring(0, 80)}...</p>
      </div>
    </div>
  );
}

// Booking request form component
export function BookingRequestForm({ propertyId, onSubmit, loading }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numGuests, setNumGuests] = useState(1);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!checkIn || !checkOut) {
      setError('Veuillez remplir toutes les dates');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('La date de départ doit être après la date d\'arrivée');
      return;
    }

    await onSubmit({ checkIn, checkOut, numGuests });
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label>Arrivée</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Départ</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Nombre de personnes</label>
        <input
          type="number"
          min="1"
          value={numGuests}
          onChange={(e) => setNumGuests(parseInt(e.target.value))}
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Envoi...' : 'Demander une réservation'}
      </button>
    </form>
  );
}

// Footer component for public pages
export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>JuraGites</h3>
            <p>Découvrez nos gîtes de vacances meublés de luxe dans le Jura.</p>
          </div>
          
          <div className="footer-section">
            <h4>Liens utiles</h4>
            <ul>
              <li><Link href="/logements">Logements</Link></li>
              <li><Link href="/activites">Activités</Link></li>
              <li><Link href="/login">Connexion</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@juragites.com</p>
            <p>Tél: +33 (0) 3 XX XX XX XX</p>
          </div>
        </div>

        <SocialLinksFooter />
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} JuraGites. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

// TODO: Additional components as needed (carousel, testimonial placeholder)
