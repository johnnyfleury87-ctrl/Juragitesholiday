# 🏢 Gestion Opérationnelle par Logement - Documentation

## 📋 Vue d'ensemble

Cette implémentation ajoute une gestion complète des opérations quotidiennes pour les logements, sans modifier les tables existantes. Toutes les modifications passent par des **migrations SQL versionnées**.

---

## 🗂️ Tables créées

### 1️⃣ **inventory_items** (Inventaire)
Stocke l'inventaire des articles par logement.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `property_id` | UUID | Référence au logement |
| `item_name` | TEXT | Nom de l'article |
| `category` | TEXT | Catégorie (Vaisselle, Électroménager, Mobilier, Équipements, Autre) |
| `quantity` | INT | Quantité disponible |
| `condition` | TEXT | État (ok / à remplacer / HS) |
| `notes` | TEXT | Commentaires optionnels |
| `last_checked_at` | TIMESTAMP | Date du dernier contrôle |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

**Indexes :**
- `idx_inventory_items_property_id`
- `idx_inventory_items_category`
- `idx_inventory_items_condition`

**RLS :** ✅ Admins uniquement pour leur organisation

---

### 2️⃣ **cleaning_sessions** (Ménage)
Suivi des séances de ménage programmées et effectuées.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `property_id` | UUID | Référence au logement |
| `booking_id` | UUID | Référence optionnelle à la réservation |
| `scheduled_date` | DATE | Date programmée du ménage |
| `cleaning_type` | TEXT | Type (standard / approfondi) |
| `duration_hours` | DECIMAL | Durée en heures |
| `is_completed` | BOOLEAN | Statut (complété ou non) |
| `completed_at` | TIMESTAMP | Date/heure de complétion |
| `notes` | TEXT | Commentaires |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

**Indexes :**
- `idx_cleaning_sessions_property_id`
- `idx_cleaning_sessions_booking_id`
- `idx_cleaning_sessions_scheduled_date`
- `idx_cleaning_sessions_is_completed`

**RLS :** ✅ Admins uniquement pour leur organisation

---

### 3️⃣ **linens** (Linge)
Gestion du stock de linge par logement.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `property_id` | UUID | Référence au logement |
| `linen_type` | TEXT | Type (Draps, Serviettes, Housses de couette, Taies d'oreiller, Autre) |
| `quantity` | INT | Quantité |
| `status` | TEXT | **Statut obligatoire** (Disponible / Propre / Sale / En lavage / Manquant) |
| `last_status_change_at` | TIMESTAMP | Dernière modification de statut |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

**Indexes :**
- `idx_linens_property_id`
- `idx_linens_status`
- `idx_linens_linen_type`

**RLS :** ✅ Admins uniquement pour leur organisation

---

## 🗄️ Migrations SQL appliquées

### Migration 001: `001_create_inventory_management.sql`
Crée la table `inventory_items` avec RLS.

### Migration 002: `002_create_cleaning_management.sql`
Crée la table `cleaning_sessions` avec RLS.

### Migration 003: `003_create_linens_management.sql`
Crée la table `linens` avec RLS et statuts obligatoires.

### Migration 004: `004_seed_operational_data.sql`
Peuple les tables avec données fictives pour tester l'interface.

---

## 🎨 Interface Admin (`/admin/operations`)

### Onglet 1️⃣ : Arrivées / Départs
- **Vue :** Affiche les départs prévus et les arrivées à venir
- **Données :** Basées sur les réservations existantes (table `bookings`)
- **Statuts :** 
  - 🔴 Occupé
  - 🟠 À nettoyer (après départ)
  - 🟢 Prêt (avant arrivée)
- **Actions :** Lecture seule (aucune double saisie)

### Onglet 2️⃣ : Inventaire
- **Fonctionnalités :**
  - ➕ Ajouter un nouvel article
  - 📂 Groupement par catégorie
  - 🎨 Code couleur selon l'état (ok/à remplacer/HS)
  - 📝 Commentaires et historique
- **Actions :** Créer, lire, mettre à jour

### Onglet 3️⃣ : Ménage
- **Fonctionnalités :**
  - 📅 Planifier des séances de ménage
  - ✅ Marquer comme complété
  - ⏱️ Suivre la durée
  - 📊 Historique des ménages
- **Filtres :** À faire / Complété

### Onglet 4️⃣ : Linge
- **Fonctionnalités :**
  - 👕 Ajouter du linge
  - 🔄 Changer le statut en temps réel
  - 📊 Vue d'ensemble par type
  - 📍 Suivi du statut (Disponible/Propre/Sale/En lavage/Manquant)
- **Actions :** Créer, lire, mettre à jour le statut

---

## 📊 Sélecteur de logement

Tous les onglets affichent un **sélecteur en haut** pour choisir le logement. Les données se rechargent automatiquement.

**Données affichées :**
- Logements publiés uniquement
- Triés par titre

---

## 🔐 Sécurité (Row Level Security)

Toutes les tables ont des **RLS policies** :

✅ **Admins** peuvent :
- Lire et gérer les données pour les logements de leur organisation
- Ajouter/modifier/supprimer des articles, séances, linge

❌ **Clients** :
- Aucun accès aux tables opérationnelles

---

## 📦 Données fictives incluses

La migration `004_seed_operational_data.sql` ajoute automatiquement :

- **13 articles d'inventaire** par logement (vaisselle, électroménager, mobilier, équipements)
- **Séances de ménage** programmées après chaque départ
- **Historique de ménage** (complété) sur 30 jours précédents
- **Stock de linge** varié par logement (draps, serviettes, etc.)
- **Statuts de linge** mélangés pour tester les filtres

---

## ⚙️ Configuration technique

### Structure de fichiers
```
/app/admin/operations/
  ├── page.js                    # Composant React principal
  └── operations.module.css      # Styles
```

### Dépendances
- `@supabase/supabase-js` (déjà installé)
- `next` (déjà installé)

### Variables d'environnement
Aucune nouvelle variable requise. Utilise la config Supabase existante.

---

## 🚀 Étapes de déploiement

### 1. Appliquer les migrations
```bash
# Via Supabase CLI
supabase migration up
```

### 2. Seed les données (optionnel)
Les données fictives sont ajoutées via la migration 004 automatiquement.

### 3. Accéder à l'interface
```
https://votre-app.com/admin/operations
```

### 4. Test complet
1. Sélectionner un logement
2. Vérifier l'onglet "Arrivées/Départs" (données existantes)
3. Ajouter un article dans "Inventaire"
4. Planifier un ménage
5. Ajouter du linge et changer ses statuts

---

## 📝 Notes importantes

✅ **Points respectés :**
- ✅ Aucune modification des tables existantes
- ✅ Migrations SQL versionnées propres
- ✅ RLS policies strictes
- ✅ UI simple et pratique
- ✅ Aucune double saisie (arrivées/départs = données existantes)
- ✅ Données fictives pour test

⚠️ **Limitations actuelles :**
- Edition/suppression d'articles via API (UI peut être améliorée)
- Pas de multi-sélection pour actions en masse
- Pas d'export de rapports (v2)

---

## 🔮 Évolutions futures (v2)

- [ ] Exports PDF/Excel
- [ ] Notifications pour prochains ménages
- [ ] Assignation de personnel
- [ ] Historique d'audit complet
- [ ] Dashboard avec KPIs
- [ ] API REST documentée

---

**Dernière mise à jour :** Janvier 2026  
**Auteur :** Système d'implémentation  
**Version :** 1.0
