# 🐛 BUG FIX: Properties n'apparaissent pas sur le site

## 📋 Problème rapporté
- Propriétés existent en DB Supabase (table `public.properties`)
- Mais page `/logements` et section homepage affichent **"Aucune propriété disponible"**

---

## 🔍 DIAGNOSTIC – À faire en premier

### Étape 1: Vérifier les données en base

**Accédez au Dashboard Supabase:**
1. Allez sur https://supabase.com → Votre projet
2. SQL Editor → New Query
3. Copiez-collez le contenu de `supabase/DIAGNOSTIC.sql`
4. Cliquez **Execute**

**Ce que vous verrez:**
- ✅ Nombre de propriétés totales
- ✅ Nombre de propriétés publiées (`is_published = true`)
- ✅ Liste des RLS policies
- ✅ Si la requête publique retourne les données

**Résultats possibles:**

| Scénario | Cause | Solution |
|----------|-------|----------|
| 0 propriétés au total | Seed jamais exécuté | Exécuter seed.sql |
| 5+ propriétés, 0 publiées | Toutes en brouillon | Modifier is_published |
| 2+ publiées, mais requête = 0 rows | RLS trop restrictif | Exécuter migration |
| 2+ publiées, requête retourne résultats | ✅ Bug côté frontend | Vérifier console navigateur |

---

### Étape 2: Tester depuis le frontend

**Ouvrez la page dans le navigateur:**
1. http://localhost:3000/ (homepage)
2. Ou http://localhost:3000/logements (page logements)

**Appuyez sur F12 → Console**

**Vous verrez un des messages:**
```javascript
// Si succès:
✅ Properties fetched: 3 [{...}, {...}, {...}]

// Si erreur RLS:
❌ Supabase error fetching properties: {
  message: "row level security (RLS) check"
}

// Si erreur connexion:
❌ Exception fetching properties: ...
```

**Si vous voyez une erreur:**
- ✅ Regardez le message d'erreur exact
- ✅ Notez le numéro de ligne (ex: line 204 de schema.sql)

---

### Étape 3: Tester via script Node.js

```bash
cd /workspaces/Juragitesholiday
node supabase/debug_properties.js
```

**Vous verrez:**
```
1️⃣  Fetching ALL properties...
   ✅ Success! Found 3 properties

2️⃣  Fetching PUBLISHED properties...
   ✅ Success! Found 2 published properties
   - Gîte de Montagne avec Vue
   - Maison à Proximité du Lac

3️⃣  Fetching LATEST 3...
   ✅ Success! Found 2 latest properties

📊 SUMMARY:
✅ Published properties count: 2
```

---

## ✅ SOLUTION

### Cas 1: Pas de propriétés en base (0 résultats dans DIAGNOSTIC)

**Action:** Exécuter le seed.sql

1. Dashboard Supabase → SQL Editor
2. Copiez-collez `supabase/seed.sql`
3. Cliquez Execute
4. Rafraîchissez le site: http://localhost:3000

**Résultat attendu:** 2 propriétés publiées apparaissent

---

### Cas 2: Propriétés existent, mais RLS bloque l'accès

**Symptôme dans console navigateur:**
```javascript
❌ Error: row level security (RLS) check
```

**Action:** Appliquer la migration RLS

1. Dashboard Supabase → SQL Editor
2. Copiez-collez `supabase/migrations/add_permissive_policy.sql`
3. Cliquez Execute
4. Rafraîchissez: http://localhost:3000

**Ce que fait cette migration:**
- Ajoute une policy PERMISSIVE explicite
- Autorise les utilisateurs anonymes à lire les propriétés publiées
- N'affecte pas les admin (qui peuvent déjà tout lire)

---

### Cas 3: Propriétés publiées + pas d'erreur, mais toujours vide

**Possible causes:**
1. Frontend `is_published` n'est pas configuré correctement
2. Toutes les propriétés ont `is_published = false`

**Action:**

Vérifier en SQL:
```sql
SELECT count(*), is_published FROM properties GROUP BY is_published;
```

Si tout est `false`:
```sql
UPDATE properties SET is_published = true WHERE slug LIKE '%gite%' OR slug LIKE '%maison%';
```

---

## 📁 Fichiers modifiés

| Fichier | Changement | Raison |
|---------|-----------|--------|
| app/page.js | + état error, + logs console | Afficher erreurs Supabase |
| app/logements/page.js | + état error, + logs console | Afficher erreurs Supabase |
| supabase/DIAGNOSTIC.sql | ✨ NEW | Tester données et RLS |
| supabase/migrations/add_permissive_policy.sql | ✨ NEW | Corriger RLS si restrictif |
| supabase/debug_properties.js | ✨ NEW | Tester de Node.js |

---

## 🚀 Procédure complète de correction

### En production (Vercel)

1. **Vérifier les données:**
   - Allez dans Supabase Dashboard pour votre projet prod
   - Exécutez la requête SQL du DIAGNOSTIC
   - Notez le nombre de propriétés publiées

2. **Si 0 propriétés:**
   - Exécutez `seed.sql` en production
   - Ou exécutez `seed_demo_logements.sql` pour les démos

3. **Si propriétés existent mais erreur RLS:**
   - Exécutez la migration `add_permissive_policy.sql`
   - Attendez ~30s le redéploiement

4. **Rafraîchissez le site:**
   - https://juragitesholiday-pkveu3rp.vercel.app/
   - Propriétés doivent apparaître

### En local (développement)

```bash
# 1. Tester
node supabase/debug_properties.js

# 2. Si erreur, voir logs console
npm run dev
# F12 → Console → Regarder message d'erreur

# 3. Appliquer diagnostic
# → Exécuter DIAGNOSTIC.sql en Supabase
# → Puis appliquer migration si besoin

# 4. Vérifier résultat
# http://localhost:3000/logements
```

---

## 🎯 Checklist de confirmation

- [ ] 2+ propriétés avec `is_published = true` en base
- [ ] Aucune erreur RLS dans console navigateur F12
- [ ] Page homepage affiche ≥1 propriété dans "Nos dernières disponibilités"
- [ ] Page /logements affiche ≥2 propriétés publiées
- [ ] Cliquer sur une propriété va sur page détail (/logements/[slug])

---

## 📞 Dépannage avancé

### Si vous voyez "row level security (RLS) check"

Le RLS est trop restrictif. Solution étape-par-étape:

1. Dashboard Supabase → Authentication → Policies
2. Cherchez la table "properties"
3. Vérifiez que "Properties: Public read published" existe
4. Si manquante ou cassée: exécutez la migration `add_permissive_policy.sql`

### Si you see "permission denied for schema public"

Le rôle `anon` n'a pas les droits. Exécutez:

```sql
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.properties TO anon;
```

### Si aucune solution ne marche

En dernier recours (démo V1 uniquement):
```sql
-- ATTENTION: Cela désactive RLS, risqué en production!
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
```

Puis appliquez RLS correctement après.

---

## 📝 Notes

- Les modifications au `app/page.js` et `app/logements/page.js` n'affectent PAS la logique métier
- Elles ajoutent juste la gestion d'erreur et les logs console
- Les scripts de diagnostic ne modifient aucune donnée (SELECT only)
- Les migrations sont idempotentes (`CREATE POLICY ... IF NOT EXISTS`)

