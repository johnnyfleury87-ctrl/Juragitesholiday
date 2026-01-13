# Juragitesholiday - SaaS Gîtes de Vacances Meublés (V1)

Application SaaS complète pour la gestion de gîtes de vacances meublés, construite avec Next.js App Router, Supabase et Vercel.

## Stack Technologique

- **Frontend:** Next.js 14 (App Router, JavaScript)
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **Déploiement:** Vercel
- **Base de données:** PostgreSQL (Supabase)
- **Authentification:** Supabase Auth

## Fonctionnalités V1

### Public
- Landing page animée avec CTAs
- Listing des logements publiés
- Détail d'une propriété
- Formulaire de demande de réservation
- Authentification client (signup/login)

### Client
- Tableau de bord
- Liste des demandes/réservations
- Détail d'une réservation
- Gestion du profil
- Suivi des points de fidélité

### Admin
- Connexion admin (Ctrl+Shift+A sur homepage)
- Dashboard avec KPIs
- Gestion des logements (CRUD)
- Gestion de la visibilité (publish/unpublish)
- Gestion des réservations (acceptance/rejection)
- Gestion des paiements
- Système de points de fidélité automatique

## Architecture Base de Données

### Tables principales

```
orgs                    → Organisations/clients
org_members            → Admins et staff par org
profiles               → Profils utilisateurs
properties             → Logements
property_photos        → Photos des propriétés
availability_blocks    → Disponibilités
booking_requests       → Demandes de réservation
bookings              → Réservations confirmées
payments              → Paiements
loyalty_accounts      → Comptes fidélité
loyalty_ledger        → Journal des points
```

### Sécurité RLS

- **Public:** Peut voir uniquement les propriétés publiées
- **Clients:** Accès uniquement à leurs propres données
- **Admins:** Accès complet aux données de leur organisation

## Structure du Projet

```
/app
  /app                     → Routes client authentifiées
    /reservations          → Liste des réservations
    /reservations/[id]     → Détail réservation
    /profile               → Profil client
  /admin                   → Routes admin
    /login                 → Connexion admin
    /logements             → Gestion des propriétés
    /logements/new         → Créer propriété
    /logements/[id]        → Modifier propriété
    /reservations          → Gestion des demandes/réservations
    /reservations/[id]     → Détail réservation admin
  /logements               → Pages publiques
    /[slug]                → Détail propriété
  /login                   → Connexion client
  /signup                  → Inscription client

/lib
  /supabase               → Clients Supabase
  guards.js               → Protecteurs d'accès (Auth/Admin)
  auth.js                 → Fonctions d'authentification

/components
  shared.js               → Composants réutilisables

/supabase
  schema.sql              → Schéma base de données + RLS
  storage_rules.md        → Règles de storage
  seed.sql                → Données initiales
```

## Installation & Déploiement

### Prérequis
- Node.js 18+
- Compte Supabase
- Compte Vercel

### 1. Cloner et installer

```bash
git clone <repo-url>
cd Juragitesholiday
npm install
```

### 2. Configurer Supabase

1. Créer un projet Supabase
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL
3. Exécuter `supabase/seed.sql`
4. Créer le bucket `property-photos` en Storage
5. Copier les clés Supabase

### 3. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplir avec:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

### 4. Créer l'utilisateur admin

1. Aller à Supabase → Authentication
2. Créer un nouvel utilisateur avec email/mot de passe
3. Copier l'UUID de cet utilisateur
4. Aller à supabase/seed.sql, décommenter et adapter la ligne org_members

### 5. Développement local

```bash
npm run dev
```

L'app est disponible à `http://localhost:3000`

### 6. Déploiement sur Vercel

```bash
vercel
```

Ou connecter le repo GitHub directement sur vercel.com

## Accès Admin

Sur la homepage (`/`), appuyer sur **Ctrl+Shift+A** pour afficher le bouton Admin.

Le shortcut n'interfère pas avec le copier/coller dans les inputs.

## Workflow de Réservation

1. **Client** → Demande de réservation via `/logements/[slug]`
2. **Demande** → `booking_requests` table (status: pending)
3. **Admin** → Accepte via `/admin/reservations`
4. **Réservation créée** → `bookings` table (status: active)
5. **Paiement créé** → `payments` table (status: pending)
6. **Admin marque payé** → Points de fidélité crédités automatiquement
   - Points = nombre_nuits × 10
   - Stockés dans `loyalty_ledger`

## TODO Items pour V2

- [ ] Upload et gestion des photos de propriété
- [ ] Système de wishlist/favoris
- [ ] Avis et commentaires
- [ ] Moteur de recherche/filtrage avancé
- [ ] Intégration de paiement (Stripe)
- [ ] Emails transactionnels
- [ ] SMS notifications
- [ ] Dashboard analytics
- [ ] Export de données
- [ ] Gestion multi-devises
- [ ] Système de promotions/codes promo
- [ ] Calendrier interactif
- [ ] Mobile app
- [ ] Gestion des annulations et remboursements

## Notes Importantes

### Sécurité
- **Toute la sécurité est gérée par Supabase RLS** - Les guards du frontend sont pour l'UX seulement
- Les clés Supabase ne doivent jamais être exposées (utiliser .env.local sur Vercel)
- Les tokens d'authentification sont gérés automatiquement par les Auth Helpers

### Données
- **Aucune donnée fictive n'est affichée** (pas de faux avis, stats, nombres)
- Les TODOs marquent les manques intentionnels du spec

### Performance
- Ajouter des indexes Supabase si nécessaire
- Implémenter infinite scroll pour les listes longues (v2)
- Ajouter caching côté client avec React Query ou SWR (v2)

## Support & Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** Janvier 2026
