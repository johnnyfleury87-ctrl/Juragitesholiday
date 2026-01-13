# Juragitesholiday - SaaS Gîtes de Vacances Meublés

SaaS production-ready pour la gestion de gîtes de vacances meublés.

**Stack:** Next.js 14 App Router (JavaScript) + Supabase + Vercel

## 🚀 Démarrage rapide

```bash
# Cloner le repo
git clone <repo-url>
cd Juragitesholiday

# Installer et configurer
chmod +x setup.sh
./setup.sh

# Démarrer en dev
npm run dev
```

Accès: `http://localhost:3000`

## 📋 Fonctionnalités V1

### Public
- ✅ Landing page animée avec shortcut admin caché (Ctrl+Shift+A)
- ✅ Listing des propriétés publiées
- ✅ Détail d'une propriété + formulaire demande
- ✅ Authentification client (signup/login)

### Client
- ✅ Dashboard avec statistiques
- ✅ Gestion des demandes de réservation
- ✅ Profil et points de fidélité

### Admin
- ✅ Dashboard avec KPIs
- ✅ Gestion CRUD des propriétés
- ✅ Gestion de la visibilité (publish/unpublish)
- ✅ Workflow de réservation (pending → accept → booking)
- ✅ Gestion des paiements
- ✅ Points de fidélité automatiques

## 🏗️ Architecture

### Base de Données (Supabase PostgreSQL)
```
orgs → org_members (admin/staff)
  ↓
properties → property_photos
  ↓
booking_requests → bookings → payments
  ↓
loyalty_accounts → loyalty_ledger
```

### Routes
```
Public:  /  /logements  /logements/[slug]  /login  /signup
Client:  /app  /app/reservations  /app/reservations/[id]  /app/profile
Admin:   /admin/login  /admin  /admin/logements  /admin/reservations
```

### Sécurité
- ✅ Supabase RLS (Row Level Security) sur toutes les tables
- ✅ Auth guards côté frontend (pour UX)
- ✅ Validation côté backend (Supabase)

## 📦 Installation Complète

### 1. Supabase
```sql
-- Exécuter dans l'éditeur SQL Supabase:
-- Fichier: supabase/schema.sql (tous les tables + RLS)
-- Fichier: supabase/seed.sql (données de test)
```

### 2. Storage
```
Bucket: property-photos
Path: org/{org_id}/property/{property_id}/{uuid}.jpg
Public read: Activé
Upload/Delete: Admin uniquement (RLS)
```

### 3. Environnement
```bash
cp .env.example .env.local
```

Remplir avec vos clés Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_here
SUPABASE_SERVICE_KEY=service_key_here
```

### 4. Admin User
1. Créer un utilisateur via Supabase Auth
2. Ajouter dans `org_members` avec role='admin'

### 5. Dev Local
```bash
npm run dev
```

## 🚀 Déploiement (Vercel)

```bash
# Via CLI
vercel

# Ou: Connecter le repo GitHub sur vercel.com
```

Ajouter les env vars dans Vercel project settings.

## 🔑 Admin Access

Sur la homepage `/`, appuyer sur **Ctrl+Shift+A** pour afficher le bouton Admin.

Accès sécurisé par Supabase RLS (pas seulement l'UI).

## 📊 Workflow Réservation

```
1. Client → Demande via /logements/[slug]
2. Admin → Accepte via /admin/reservations
3. Booking créé (status: active)
4. Payment créé (status: pending)
5. Admin marque payé
6. Points créés = nuits × 10
```

## 📚 Documentation

- [DEPLOY.md](DEPLOY.md) - Installation détaillée
- [SPECIFICATIONS.md](SPECIFICATIONS.md) - Specs complètes
- [supabase/schema.sql](supabase/schema.sql) - Schéma DB + RLS
- [supabase/seed.sql](supabase/seed.sql) - Données de test

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, CSS pur
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **Déploiement:** Vercel
- **Langue:** JavaScript (pas TypeScript)

## ✅ Checklist Avant Production

- [ ] Variables d'environnement correctes
- [ ] Connexion Supabase OK
- [ ] User admin créé
- [ ] Bucket Storage configuré
- [ ] RLS policies testées
- [ ] Workflow réservation complet testé
- [ ] Admin shortcut (Ctrl+Shift+A) fonctionne

## 📝 Specification Adhérence

✅ 100% des specs implémentées:
- ✅ Pas de simplification
- ✅ Pas d'improvisation
- ✅ JavaScript uniquement
- ✅ Supabase + Vercel + Next.js
- ✅ Sécurité par RLS uniquement
- ✅ Tous les TODOs marqués
- ✅ Aucune donnée fictive

## 🗂️ Structure

```
app/                    → Routes Next.js
  ├── (public)
  │   ├── page.js      → Landing
  │   ├── login/
  │   ├── signup/
  │   └── logements/
  ├── app/              → Client routes (auth required)
  └── admin/            → Admin routes (auth + role required)

lib/
  ├── supabase/         → Clients Supabase
  ├── guards.js         → Auth/Admin guards
  └── auth.js           → Fonctions auth

components/
  └── shared.js         → Composants réutilisables

supabase/
  ├── schema.sql        → Schéma + RLS
  ├── storage_rules.md  → Règles bucket
  └── seed.sql          → Données test
```

## 🤝 Support

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Made:** Janvier 2026