'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/shared';
import { createClient } from '@/lib/supabase/client';

// Hero Carousel Component - Continuous Marquee
function HeroCarousel() {
  const [imageErrors, setImageErrors] = useState({});
  
  const images = [
    '/images/hero-1.jpg',
    '/images/hero-2.jpg',
    '/images/hero-3.jpg',
  ];

  // Duplicate images for seamless infinite loop
  const duplicatedImages = [...images, ...images];

  const handleImageError = (idx) => {
    setImageErrors(prev => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="hero-carousel-wrapper">
      <div className="hero-carousel">
        <div className="carousel-track">
          {duplicatedImages.map((image, idx) => (
            <div
              key={idx}
              className="carousel-slide"
              style={{
                backgroundImage: imageErrors[idx % images.length] ? 'none' : `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              onError={() => handleImageError(idx % images.length)}
              loading="eager"
            >
              {/* Fallback gradient if image fails to load */}
              {imageErrors[idx % images.length] && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, var(--color-gradient-start) 0%, var(--color-gradient-end) 100%)',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Latest Properties Component
function LatestProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('is_published', true)
          .limit(3)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('❌ Supabase error fetching properties:', fetchError);
          setError(`Erreur Supabase: ${fetchError.message}`);
        } else {
          console.log('✅ Properties fetched:', data?.length || 0, data);
          setProperties(data || []);
        }
      } catch (err) {
        console.error('❌ Exception fetching properties:', err);
        setError(`Erreur: ${err.message}`);
      } finally {
        setLoading(false);
      }
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
              <div key={idx} className="property-card">
                <div className="property-image-modern">
                  🏠
                </div>
                <div className="property-content">
                  <h3>Gîte Premium Jura</h3>
                  <p className="location">📍 Jura, France</p>
                  <div className="property-footer">
                    <span className="price">89€/nuit</span>
                    <button className="property-cta">
                      Découvrir <span className="arrow">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="properties-grid">
            {properties.map((prop) => (
              <Link key={prop.id} href={`/logements/${prop.slug}`} className="property-card">
                <div className="property-image-modern">
                  🏠
                </div>
                <div className="property-content">
                  <h3>{prop.title}</h3>
                  <p className="location">📍 {prop.location}</p>
                  <div className="property-footer">
                    <span className="price">{prop.price_per_night}€/nuit</span>
                    <button className="property-cta">
                      Découvrir <span className="arrow">→</span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#DC2626' }}>
            <p>❌ {error}</p>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              Consultez la console navigateur pour plus de détails.
            </p>
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

// Description Section Component
function DescriptionSection() {
  return (
    <section className="description-section">
      <div className="container">
        <div className="description-content fade-in-up">
          <h2>Bienvenue chez JuraGites</h2>
          <p>
            Votre référence pour des séjours authentiques et confortables au cœur du Jura. 
            Nous sélectionnons avec soin chaque propriété pour garantir votre satisfaction et créer 
            des souvenirs inoubliables. Que vous cherchiez une escapade romantique, une détente en famille 
            ou une aventure entre amis, JuraGites offre le cadre idéal pour vos vacances.
          </p>
          <div className="description-highlights">
            <div className="highlight-item">
              <span className="highlight-icon">✓</span>
              <span>Gîtes soigneusement sélectionnés</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">✓</span>
              <span>Confort et qualité garantis</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">✓</span>
              <span>Service client réactif et bienveillant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reviews Section Component
function ReviewsSection() {
  const reviews = [
    {
      name: 'Sophie Martin',
      comment: 'Séjour magnifique dans une propriété exceptionnelle. Accueil chaleureux et service impeccable!',
      rating: 5,
    },
    {
      name: 'Jean Dupont',
      comment: 'JuraGites offre vraiment une expérience premium. Nous reviendrons sans hésiter!',
      rating: 5,
    },
    {
      name: 'Marie Leclerc',
      comment: 'Environnement paisible, propriété bien équipée. Parfait pour déconnecter en famille.',
      rating: 5,
    },
    {
      name: 'Pierre Bernard',
      comment: 'Très bon rapport qualité-prix. L\'équipe est attentive et réactive.',
      rating: 4,
    },
  ];

  return (
    <section className="reviews-section">
      <div className="container">
        <div className="section-header">
          <h2 className="fade-in-up">Avis de nos clients</h2>
          <p className="fade-in-up" style={{ transitionDelay: '0.1s' }}>
            Découvrez ce que nos clients pensent de JuraGites
          </p>
        </div>
        <div className="reviews-grid">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="review-card fade-in-up"
              style={{ transitionDelay: `${idx * 0.1}s` }}
            >
              <div className="review-rating">
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="review-comment">&quot;{review.comment}&quot;</p>
              <p className="review-name">— {review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Highlights Section Component
function HighlightsSection() {
  const highlights = [
    {
      icon: '🏆',
      title: 'Qualité Premium',
      desc: 'Sélection rigoureuse des meilleures propriétés',
    },
    {
      icon: '⚡',
      title: 'Réservation Facile',
      desc: 'Process de booking simple et rapide en quelques clics',
    },
    {
      icon: '🛡️',
      title: 'Sécurité 100%',
      desc: 'Paiements sécurisés et protection du voyageur garantie',
    },
    {
      icon: '🌟',
      title: 'Support 24/7',
      desc: 'Notre équipe disponible pour vous avant, pendant et après',
    },
  ];

  return (
    <section className="highlights-section">
      <div className="container">
        <div className="section-header">
          <h2 className="fade-in-up">Pourquoi choisir JuraGites ?</h2>
        </div>
        <div className="highlights-grid">
          {highlights.map((highlight, idx) => (
            <div
              key={idx}
              className="highlight-card fade-in-up"
              style={{ transitionDelay: `${idx * 0.1}s` }}
            >
              <div className="highlight-icon-large">{highlight.icon}</div>
              <h3>{highlight.title}</h3>
              <p>{highlight.desc}</p>
            </div>
          ))}
        </div>
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
  const pathname = usePathname();
  const router = useRouter();
  const carouselKeyRef = useRef(0);

  // Force carousel remount when returning to homepage
  useEffect(() => {
    if (pathname === '/') {
      carouselKeyRef.current += 1;
    }
  }, [pathname]);

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

  // Ctrl+C admin shortcut with confirmation
  useEffect(() => {
    if (pathname !== '/') return;

    const handleCtrlC = (event) => {
      // Check if Ctrl+C was pressed
      if (event.ctrlKey && (event.key === 'c' || event.key === 'C')) {
        // Don't trigger if typing in an input/textarea or contenteditable element
        const isInEditableField = 
          ['INPUT', 'TEXTAREA'].includes(event.target.tagName) ||
          (event.target.getAttribute && event.target.getAttribute('contenteditable') === 'true');

        if (!isInEditableField) {
          // Prevent the default copy action
          event.preventDefault();

          // Show confirmation dialog
          const confirmed = window.confirm('Accéder à la vue admin ?');
          if (confirmed) {
            router.push('/admin/login');
          }
        }
      }
    };

    window.addEventListener('keydown', handleCtrlC);
    return () => window.removeEventListener('keydown', handleCtrlC);
  }, [pathname, router]);

  return (
    <>
      <PublicHeader />

      {/* Hero Section with Carousel */}
      <section className="hero-section">
        <HeroCarousel key={carouselKeyRef.current} />
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
                <Link href="/signup" className="btn-inscription btn-large">
                  S&apos;inscrire maintenant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Properties */}
      <LatestProperties />

      {/* Description Section */}
      <DescriptionSection />

      {/* Reviews Section */}
      <ReviewsSection />

      {/* Highlights Section */}
      <HighlightsSection />

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

      {/* Footer */}
      <PublicFooter />
    </>
  );
}
