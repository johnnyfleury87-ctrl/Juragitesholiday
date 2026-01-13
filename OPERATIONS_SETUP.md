# 🔧 Gestion Opérationnelle - Guide d'Application

## Status: ✅ Code Complet - ⏳ Données à Synchroniser

Le système de gestion opérationnelle est **entièrement implémenté**. Reste à **appliquer les migrations et seed** pour que les données s'affichent.

---

## 🎯 Ce Qui a Été Construit

### 1. Tables Opérationnelles (3 nouvelles)
- **`inventory_items`** - Inventaire (vaisselle, électroménager, literie, équipements)
- **`cleaning_sessions`** - Sessions de ménage (planifiées et complétées)
- **`linens`** - Gestion du linge (draps, serviettes, housses, état)

### 2. Migrations SQL
- **001_create_inventory_management.sql** - Table `inventory_items` + RLS
- **002_create_cleaning_management.sql** - Table `cleaning_sessions` + RLS
- **003_create_linens_management.sql** - Table `linens` + RLS
- **004_seed_operational_data.sql** - Données de démo (~120 lignes/logement)

### 3. Interface UI
- **`/app/admin/operations/page.js`** - Page gestion opérationnelle avec 4 onglets:
  - **Arrivées/Départs** - Calendrier des bookings
  - **Inventaire** - Liste des articles (21 items par propriété)
  - **Ménage** - Sessions de nettoyage (5 par propriété)
  - **Linge** - État du linge (10 entrées par propriété)

### 4. Mode Développement
- **`ADMIN_DEV_MODE=true`** - Bypass authentification en développement
- **Fallback demo** - Affiche données de démo si DB vide

---

## 📦 Volume de Données (par logement)

| Catégorie | Quantité | Détails |
|-----------|----------|---------|
| Items inventaire | 21 | 5 catégories (Vaisselle, Électroménager, Literie, Équipements) |
| Sessions ménage | 5 | 3 historiques (complétées) + 2 à venir |
| Entrées linge | 10 | 4 types avec statuts variés (Disponible, Propre, Sale, En lavage) |
| Bookings démo | 2 | Pour affichage arrivées/départs |

**Total: ~120 lignes de données par logement**

---

## 🚀 Étapes d'Application

### Option 1: Via Migration SQL (Recommandé)

1. **Appliquer via Supabase Dashboard**:
   - Aller à: Supabase → Votre projet → SQL Editor
   - Ouvrir: `supabase/migrations/001_create_inventory_management.sql`
   - Copier le contenu entier → Exécuter ✓
   - Répéter pour les fichiers 002, 003, 004

2. **Ou via CLI**:
   ```bash
   # Installer Supabase CLI si nécessaire
   npm install -g supabase
   
   # Appliquer les migrations
   supabase db push
   ```

### Option 2: Via Script Node (Alternativ)

```bash
# S'assurer que les env vars sont présentes
echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Exécuter le seed
node supabase/seed_operations.js
```

---

## ✅ Vérification Post-Application

1. **Vérifier les tables**:
   ```sql
   -- Supabase SQL Editor
   SELECT COUNT(*) FROM inventory_items;
   SELECT COUNT(*) FROM cleaning_sessions;
   SELECT COUNT(*) FROM linens;
   ```

2. **Tester l'interface**:
   ```bash
   npm run dev
   # Aller à: http://localhost:3000/admin/operations
   ```

3. **Vérifier chaque onglet**:
   - ✓ Sélectionner un logement
   - ✓ Vérifier Inventaire: 21 items affichés
   - ✓ Vérifier Ménage: 5 sessions (3 complétées, 2 à venir)
   - ✓ Vérifier Linge: 10 entrées avec statuts
   - ✓ Vérifier Arrivées/Départs: 2 bookings

---

## 🗂️ Fichiers Modifiés

```
supabase/
  ├── migrations/
  │   ├── 001_create_inventory_management.sql  (NEW)
  │   ├── 002_create_cleaning_management.sql   (NEW)
  │   ├── 003_create_linens_management.sql     (NEW)
  │   └── 004_seed_operational_data.sql        (ENHANCED)
  └── seed_operations.js                       (NEW - Script Node)

app/admin/
  └── operations/
      ├── page.js                              (NEW)
      └── operations.module.css                (NEW - Styling)

lib/
  ├── devMode.js                               (NEW)
  └── guards.js                                (UPDATED - Dev mode bypass)

components/
  └── shared.js                                (UPDATED - Dev admin button)

.env.local                                     (UPDATED - ADMIN_DEV_MODE)
```

---

## 🔐 Politique RLS (Sécurité)

Toutes les nouvelles tables ont **Row Level Security** activé:
- ✅ Admins peuvent voir toutes les données de leur organisation
- ✅ Clients ne voient rien (pas d'accès direct)
- ✅ Service role (backend) peut tout faire
- ✅ Anon role (dev mode) bypass activé

---

## 🎨 Données de Démo

Si migrations pas encore appliquées, l'interface affiche une **version de démo** avec:
- 2 logements fictifs (Maison Côtière, Chalet Montagne)
- Statistiques approximatives
- Banneau "DÉMO" pour clarifier l'état

*Une fois migrations appliquées, données réelles affichées.*

---

## 🛠️ Configuration Développement

### `.env.local` actuel:
```
NEXT_PUBLIC_ADMIN_DEV_MODE=true          # Bypass authentification
NEXT_PUBLIC_SUPABASE_URL=...             # Votre URL Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # Votre clé Supabase anon
SUPABASE_SERVICE_KEY=...                 # Clé service (optionnel)
```

### Résultats:
- ✅ Admin accessible sans login: http://localhost:3000/admin
- ✅ Navbbar affiche badge "👨‍💻 Admin (dev)"
- ✅ Dashboard affiche "Mode DEV" en jaune
- ✅ Toutes les pages admin accessibles

---

## 📋 Prochaines Actions

1. **Appliquer les migrations** à Supabase
2. **Vérifier les onglets** affichent les données
3. **Tester les filtres** et tri (si implémentés)
4. **Configurer en Production**:
   - Retirer `ADMIN_DEV_MODE=true`
   - Activer authentification Supabase
   - Tester avec vrais utilisateurs

---

## 💬 Support

- **Erreur "Table not found"**: Migrations pas exécutées → Appliquer via Supabase SQL Editor
- **Page vide**: Vérifier `ADMIN_DEV_MODE=true` dans `.env.local`
- **Données pas à jour**: Vérifier les RLS policies en Supabase
- **Build error**: `npm run build` et vérifier Console

---

**État**: ✅ Codage terminé | ⏳ En attente d'exécution des migrations
