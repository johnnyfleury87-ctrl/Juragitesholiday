# 📦 Instructions pour Exécuter le Seed de Démo

Ce document explique comment charger les 5 logements de démonstration dans Supabase.

## 🎯 Logements Inclus

### ✅ Logements Existants (3)
1. **Gîte de Montagne avec Vue** (€150/nuit) - Saint-Claude
2. **Maison à Proximité du Lac** (€120/nuit) - Lac de Chalain
3. **Studio Cosy en Centre-Ville** (€80/nuit) - Oyonnax (non publié)

### 🆕 Logements Premium (2)
4. **Chalet des Sapins – 12 pers** (€320/nuit) - Les Rousses
   - Piscine chauffée + sauna
   - 5 chambres, 3 SDB
   - Parking 4 voitures, local à skis
   - Wifi fibre, cheminée

5. **Maison du Lac – 8 pers** (€210/nuit) - Champagnole
   - Jacuzzi extérieur + terrasse BBQ
   - 4 chambres, 2 SDB
   - Parking 2 voitures
   - Animaux acceptés, Wifi inclus

---

## 🚀 Exécution du Seed

### Méthode 1: Via Supabase CLI
```bash
# 1. Installer Supabase CLI (si nécessaire)
brew install supabase/tap/supabase

# 2. Se connecter à ton projet
supabase login

# 3. Exécuter le seed
supabase db push
supabase seed run
```

### Méthode 2: Via Supabase Dashboard (Web UI)
```
1. Aller sur https://app.supabase.com
2. Sélectionner ton projet "juragitesholiday"
3. Aller dans SQL Editor
4. Copier le contenu de supabase/seed.sql
5. Exécuter la requête
```

### Méthode 3: Via Supabase SQL Editor Directement
```sql
-- Copier-coller le contenu complet de supabase/seed.sql
-- et exécuter dans https://app.supabase.com > SQL Editor
```

---

## ✅ Vérification

Après exécution, vérifie dans Supabase:

### 1. Vérifier les Logements (5 au total)
```sql
SELECT id, slug, title, price_per_night, max_guests, is_published 
FROM properties 
ORDER BY created_at DESC;
```

### 2. Vérifier les Disponibilités
```sql
SELECT p.title, ab.start_date, ab.end_date, ab.is_available
FROM availability_blocks ab
JOIN properties p ON ab.property_id = p.id
ORDER BY ab.start_date;
```

### 3. Vérifier l'Organisation
```sql
SELECT id, name FROM orgs;
```

---

## 🧪 Tester l'Affichage sur le Site

### Local (npm run dev)
```bash
cd /workspaces/Juragitesholiday
npm run dev
# Accès: http://localhost:3000
```

Puis navigate:
- **Home** (`/`) → Section "Dernières Propriétés" (limite 3)
- **Logements** (`/logements`) → Liste complète (5 logements publiés)
- **Détail** (`/logements/[slug]`) → Cliquer sur un logement

### Production (Vercel)
- **URL**: https://juragitesholiday-pkveu3rp.vercel.app
- Même navigation que local

---

## 📝 Notes

- Les 5 logements sont tous "publiés" sauf le studio (is_published=false)
- Les logements premium (4 & 5) ont des disponibilités complètes de jan-sep 2026
- Les photos ne sont pas incluses (à ajouter via Supabase Storage)
- L'organisation "JuraGites Inc" est déjà créée avec ID fixe
- Pas d'utilisateurs admin préchargés (à créer via Auth UI)

---

## 🔄 Réinitialiser le Seed

Si besoin de réinitialiser les données:

```sql
-- Supprimer tous les logements
DELETE FROM properties WHERE org_id = '550e8400-e29b-41d4-a716-446655440001'::uuid;

-- Puis réexécuter seed.sql
```

Ou via CLI:
```bash
supabase db reset
supabase seed run
```

---

**Questions?** Consulte [DEPLOY.md](DEPLOY.md) ou [SPECIFICATIONS.md](SPECIFICATIONS.md) pour plus de détails.
