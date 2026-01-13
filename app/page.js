'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/shared';

export default function Home() {
  const [adminButtonVisible, setAdminButtonVisible] = useState(false);

  useEffect(() => {
    // Hidden admin access trigger: Ctrl+Shift+A
    const handleKeydown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        // Prevent default only if not in an input or textarea
        if (!['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
          event.preventDefault();
          setAdminButtonVisible(true);
          // Auto-hide after 3 seconds
          setTimeout(() => setAdminButtonVisible(false), 3000);
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <>
      <PublicHeader />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="slide-in-left">JuraGites</h1>
          <p className="fade-in">Découvrez nos gîtes de vacances meublés de luxe</p>
          <div className="hero-buttons">
            <Link href="/logements" className="btn-primary">
              Voir les logements
            </Link>
            <Link href="/signup" className="btn-secondary" style={{ color: 'white', borderColor: 'white' }}>
              S'inscrire
            </Link>
          </div>
        </div>
      </section>

      {/* TODO: Photo slider component */}
      <section className="page-container">
        <div className="container">
          <h2>Nos dernières disponibilités</h2>
          <p>Découvrez nos meilleures offres pour vos prochaines vacances</p>
          {/* TODO: Implement carousel/slider here */}
        </div>
      </section>

      {/* TODO: Features section */}
      <section className="page-container" style={{ background: '#F9FAFB' }}>
        <div className="container">
          <h2>Pourquoi choisir JuraGites ?</h2>
          {/* TODO: Add feature cards */}
        </div>
      </section>

      {/* Hidden Admin Button */}
      {adminButtonVisible && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <Link href="/admin/login" className="btn-primary">
            Admin
          </Link>
        </div>
      )}
    </>
  );
}
