'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/shared';
import { createClient } from '@/lib/supabase/client';

// Hero Carousel Component
function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = [
    '/images/hero-1.jpg',
    '/images/hero-2.jpg',
    '/images/hero-3.jpg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="hero-carousel-wrapper">
      <div className="hero-carousel">
        {images.map((image, idx) => (
          <div
            key={idx}
            className={`carousel-slide ${idx === currentSlide ? 'active' : ''}`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Fallback gradient if image fails to load */}
            <div className="carousel-fallback" />
          </div>
        ))}
      </div>
      {/* Carousel indicators */}
      <div className="carousel-indicators">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`indicator ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
      {/* Animated gradient overlay */}
      <div className="carousel-overlay" />
    </div>
  );
}

// Latest Properties Component
function LatestProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .limit(3)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProperties(data);
      }
      setLoading(false);
    };

    fetchProperties();
  }, []);

  return (
    <section className="latest-properties">
      <div className="container">
        <div className="section-header">
          <h2 className="fade-in-up">Nos dernières disponibilités</h2>
          <p className="fade-in-up" style={{ transitionDelay: '0.1s' }}>
            Découvrez nos meilleures offres pour vos prochaines vacances en Jura
          </p>
        </div>

        {loading ? (
          <div className="properties-grid">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="property-card skeleton">
                <div className="skeleton-image" />
                <div className="skeleton-text" />
                <div className="skeleton-text" style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="properties-grid">
            {properties.map((prop) => (
              <Link key={prop.id} href={`/logements/${prop.slug}`} className="property-card">
                <div className="property-image-modern">
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                  }}>
                    🏠
                  </div>
                </div>
                <div className="property-content">
                  <h3>{prop.title}</h3>
                  <p className="location">📍 {prop.location}</p>
                  <div className="property-footer">
                    <span className="price">{prop.price_per_night}€/nuit</span>
                    <span className="arrow">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Aucune propriété disponible pour le moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Experience Section Component
function ExperienceSection() {
  const features = [
    {
      icon: '🏡',
      title: 'Propriétés Premium',
      desc: 'Sélection exclusive de gîtes haut de gamme en Jura',
    },
    {
      icon: '✨',
      title: 'Confort & Luxe',
      desc: 'Équipements modernes et services de qualité',
    },
    {
      icon: '🛡️',
      title: 'Confiance Garantie',
      desc: 'Paiements sécurisés et support 24/7',
    },
    {
      icon: '🌄',
      title: 'Activités Variées',
      desc: 'Découvrez les plus beaux spots du Jura',
    },
  ];

  return (
    <section className="experience-section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "center" }}>
          <h2 className="fade-in-up">L&apos;Expérience JuraGites</h2>
          <p className="fade-in-up" style={{ transitionDelay: "0.1s", maxWidth: "600px", margin: "0 auto" }}>
            Nous offrons bien plus que des locations de vacances. C&apos;est une expérience complète.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="feature-card fade-in-up"
              style={{ transitionDelay: `${idx * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [adminButtonVisible, setAdminButtonVisible] = useState(false);

  useEffect(() => {
    // Hidden admin access trigger: Ctrl+Shift+A
    const handleKeydown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        if (!['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
          event.preventDefault();
          setAdminButtonVisible(true);
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

      {/* Hero Section with Carousel */}
      <section className="hero-section">
        <HeroCarousel />
        <div className="hero-content">
          <div className="container">
            <div className="hero-text">
              <h1 className="fade-in-up" style={{ transitionDelay: "0.2s" }}>
                JuraGites
              </h1>
              <p className="hero-subtitle fade-in-up" style={{ transitionDelay: "0.3s" }}>
                Découvrez nos gîtes de vacances meublés de luxe dans le Jura
              </p>
              <div className="hero-buttons fade-in-up" style={{ transitionDelay: "0.4s" }}>
                <Link href="/logements" className="btn-primary btn-large">
                  Voir les logements
                </Link>
                <Link href="/signup" className="btn-secondary btn-large">
                  S&apos;inscrire
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Properties */}
      <LatestProperties />

      {/* Experience Section */}
      <ExperienceSection />

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
