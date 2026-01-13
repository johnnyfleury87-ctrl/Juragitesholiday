'use client';

import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/components/shared';

const activities = [
  {
    id: 1,
    title: "Randonnées",
    icon: "🥾",
    description: "Explorez les plus beaux sentiers du Jura avec des vues panoramiques spectaculaires.",
    details: [
      'Sentiers balisés pour tous niveaux',
      'Paysages de montagne époustouflants',
      'Lacs glaciaires à découvrir',
      'Points de vue remarquables',
    ],
  },
  {
    id: 2,
    title: "Ski",
    icon: "⛷️",
    description: "Domaines skiables accessibles et variés pour tous les niveaux de skieurs.",
    details: [
      'Pistes pour débutants et confirmés',
      'Remontées mécaniques modernes',
      'Écoles de ski professionnelles',
      'Saison de décembre à mars',
    ],
  },
  {
    id: 3,
    title: "Lacs",
    icon: "💧",
    description: "Baignades, pédalo et détente en famille au bord des plus beaux lacs du Jura.",
    details: [
      'Lac de Chalain - le plus grand',
      'Lac de Clairvaux - eaux cristallines',
      'Plages surveillées en été',
      'Activités nautiques variées',
    ],
  },
  {
    id: 4,
    title: "Restaurants",
    icon: "🍽️",
    description: "Découvrez la gastronomie locale avec des restaurants de qualité.",
    details: [
      'Cuisine traditionnelle jurassienne',
      'Produits locaux de qualité',
      'Vins du Jura réputés',
      'Petits restaurants conviviaux',
    ],
  },
  {
    id: 5,
    title: "Événements",
    icon: "🎉",
    description: "Festivals, marchés locaux et événements culturels toute l'année.",
    details: [
      'Marchés provençaux réguliers',
      'Festivals d\'été musicaux',
      'Foires artisanales',
      'Événements culturels',
    ],
  },
  {
    id: 6,
    title: "Cascades",
    icon: "💨",
    description: "Visitez les plus impressionnantes cascades du Jura en famille.",
    details: [
      'Cascades de Mouthier-Haute-Pierre',
      'Cascades du Hérisson',
      'Sentiers de randonnée intégrés',
      'Sites naturels protégés',
    ],
  },
];

export default function Activites() {
  return (
    <>
      <PublicHeader />

      {/* Hero Section */}
      <section className="activites-hero">
        <div className="container">
          <h1 className="fade-in-up">Les Activités du Jura</h1>
          <p className="fade-in-up" style={{ transitionDelay: "0.1s" }}>
            Un large choix d&apos;activités pour tous les âges et toutes les saisons
          </p>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="activites-section">
        <div className="container">
          <div className="activities-grid">
            {activities.map((activity, idx) => (
              <div
                key={activity.id}
                className="activity-card fade-in-up"
                style={{ transitionDelay: `${(idx % 3) * 0.1}s` }}
              >
                <div className="activity-icon">{activity.icon}</div>
                <h2>{activity.title}</h2>
                <p className="activity-description">{activity.description}</p>
                <ul className="activity-details">
                  {activity.details.map((detail, i) => (
                    <li key={i}>✓ {detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="activites-cta">
        <div className="container">
          <h2>Prêt pour l&apos;aventure ?</h2>
          <p>Réservez votre séjour et découvrez toutes les activités que le Jura a à offrir</p>
          <Link href="/logements" className="btn-primary btn-large">
            Voir les logements disponibles
          </Link>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </>
  );
}
