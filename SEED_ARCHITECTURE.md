# 📐 ARCHITECTURE DE SEED – MÉTHODE CORRECTE APPLIQUÉE

## 🔄 CORRECTION EFFECTUÉE

### ❌ Erreur Initialement Commise
- Modification directe de `supabase/seed.sql` (fichier de base)
- Mélange des données demo avec les données de référence
- Pas de séparation nette entre schéma et données

### ✅ Méthode Correcte Appliquée
- **Restauration** : `seed.sql` revenu à son état original
- **Séparation** : Fichiers de seed DÉDIÉS aux données demo
- **Clarté** : Chaque fichier a une responsabilité unique

---

## 🗂️ STRUCTURE FINALE

```
supabase/
├── schema.sql                      [BASE - Tables + RLS + Indexes]
│   └── Contient: orgs, properties, availability_blocks, etc.
│   └── État: IMMUABLE (ne pas modifier directement)
│
├── seed.sql                        [SEED DE BASE - Données de référence]
│   └── 3 propriétés initiales: Gîte, Maison, Studio
│   └── Organisation JuraGites Inc
│   └── État: IMMUABLE (ne pas modifier directement)
│
├── migrations/                     [MIGRATIONS - Évolutions de schéma]
│   └── Vide pour l'instant
│   └── À utiliser si colonnes/tables manquantes
│
├── seed_demo_logements.sql         [SEED DEMO - 2 propriétés premium] ✨ NOUVEAU
│   └── Chalet + Maison (données de test)
│   └── À exécuter APRÈS schema.sql et seed.sql
│
└── seed_demo_logements.js          [SEED DEMO Node.js] ✨ NOUVEAU
    └── Alternative programmatique
    └── Usage: node supabase/seed_demo_logements.js
```

---

## 📋 SCHÉMA DE RÉFÉRENCE UTILISÉ

### Table: `properties`
```sql
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price_per_night DECIMAL(10, 2),        ✅ Existe déjà
  max_guests INT,                         ✅ Existe déjà
  bedrooms INT,                           ✅ Existe déjà
  bathrooms INT,                          ✅ Existe déjà
  is_published BOOLEAN DEFAULT FALSE,     ✅ Existe déjà
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, slug)
);
```

**Conclusion**: ✅ Tous les champs nécessaires existent déjà  
**Migrations nécessaires**: ❌ AUCUNE (schéma déjà complet)

---

## 📊 DONNÉES DEMO À INSÉRER

### Logement 1: CHALET DES SAPINS
```
UUID: 550e8400-e29b-41d4-a716-446655440005
Slug: chalet-des-sapins-12-personnes
Titre: Chalet des Sapins – 12 pers
Lieu: Les Rousses, Jura
Prix: €320/nuit
Capacité: 12 personnes
Chambres: 5 | SDB: 3
Statut: PUBLIÉ (is_published = true)
Disponibilité: 3 périodes (Jan-Aug 2026)
```

### Logement 2: MAISON DU LAC
```
UUID: 550e8400-e29b-41d4-a716-446655440006
Slug: maison-du-lac-8-personnes
Titre: Maison du Lac – 8 pers
Lieu: Champagnole, Jura
Prix: €210/nuit
Capacité: 8 personnes
Chambres: 4 | SDB: 2
Statut: PUBLIÉ (is_published = true)
Disponibilité: 3 périodes (Jan-Sep 2026)
```

---

## 🚀 COMMANDES D'EXÉCUTION

### Étape 1: Appliquer le schéma (si nécessaire)
```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor: copier schema.sql
```

### Étape 2: Exécuter le seed de base
```bash
# Via Supabase SQL Editor: copier seed.sql → Exécuter

# Ou via CLI
supabase seed run
```

### Étape 3: Exécuter le seed DEMO (nouveau)

**Option A: SQL brut**
```bash
# Copier supabase/seed_demo_logements.sql
# Supabase Dashboard → SQL Editor → Exécuter
```

**Option B: Script Node**
```bash
node supabase/seed_demo_logements.js
```

---

## ✅ VALIDATIONS

### Après exécution complète (schema + seed + seed_demo):

**Requête 1: Compter les propriétés**
```sql
SELECT COUNT(*) as total_properties FROM properties;
```
**Résultat attendu**: 5
- 3 de seed.sql (Gîte, Maison, Studio)
- 2 de seed_demo_logements.sql (Chalet, Maison du Lac)

**Requête 2: Vérifier les propriétés demo**
```sql
SELECT slug, title, price_per_night, max_guests, is_published 
FROM properties 
WHERE slug LIKE '%sapins%' OR slug LIKE '%maison-du-lac%';
```
**Résultat attendu**: 2 lignes
```
chalet-des-sapins-12-personnes | Chalet des Sapins – 12 pers | 320.00 | 12 | true
maison-du-lac-8-personnes      | Maison du Lac – 8 pers      | 210.00 |  8 | true
```

**Requête 3: Compter les disponibilités**
```sql
SELECT COUNT(*) as availability_periods FROM availability_blocks;
```
**Résultat attendu**: ≥ 10 (4 originales + 6 demo)

---

## 📝 FICHIERS MODIFIÉS/CRÉÉS

| Fichier | Action | Raison |
|---------|--------|--------|
| `supabase/seed.sql` | Restauré à l'original | Ne plus y ajouter les données demo |
| `supabase/seed_demo_logements.sql` | ✨ NOUVEAU | Seed séparé pour demo uniquement |
| `supabase/seed_demo_logements.js` | ✨ NOUVEAU | Alternative Node.js du seed demo |
| `supabase/migrations/` | ✨ Créé (vide) | Pour futures migrations si nécessaire |

---

## 🔒 PRINCIPES APPLIQUÉS

### 1. Immuabilité des fichiers de base
- ❌ Ne JAMAIS modifier `schema.sql` directement
- ❌ Ne JAMAIS modifier `seed.sql` directement
- ✅ Utiliser `migrations/` pour évolutions

### 2. Séparation des responsabilités
- **schema.sql** = Structure DDL (tables, colonnes, index, RLS)
- **seed.sql** = Données de référence/fixtures
- **seed_demo_logements.sql** = Données demo pour test

### 3. Migrations propres
- Chaque changement = nouvelle migration datée
- Migrations sont immutables une fois commitées
- Permet versioning et rollback

### 4. Seeds modulaires
- Seed de base = indépendant
- Seed demo = optionnel, peut être exécuté/supprimé
- Permet test flexible

---

## 🎯 PROCHAINS AJOUTS (CORRECT)

Si tu dois ajouter autre chose à l'avenir:

### Ajouter une colonne à `properties`?
```
→ Créer migration: supabase/migrations/20260113_add_amenities.sql
```

### Ajouter des propriétés de référence?
```
→ Modifier seed.sql directement (car c'est du seed de base)
```

### Ajouter des propriétés pour test?
```
→ Créer seed_* séparé (comme seed_demo_logements.sql)
```

---

## 📚 DOCUMENTATION

- [SEED_INSTRUCTIONS.md](SEED_INSTRUCTIONS.md) – Guide d'exécution
- [DEMO_PROPERTIES_SUMMARY.md](DEMO_PROPERTIES_SUMMARY.md) – Spec des logements
- [DEMO_VISUAL_GUIDE.md](DEMO_VISUAL_GUIDE.md) – Affichage attendu

---

**Status**: ✅ Architecture propre et maintenable

