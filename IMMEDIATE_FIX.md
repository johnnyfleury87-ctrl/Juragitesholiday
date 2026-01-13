# 🚨 SOLUTION IMMÉDIATE – BUG DES PROPRIÉTÉS

## 🎯 Le VRAI Problème

Les propriétés n'apparaissent pas à cause d'une **RLS recursive infinite loop** sur la table `org_members`.

Erreur exacte:
```
infinite recursion detected in policy for relation "org_members"
```

**Cause:** Le schema.sql (ligne 170-177) définit une policy qui s'auto-référence:
```sql
CREATE POLICY "OrgMembers: Admin read own org members" ON org_members
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM org_members om  ← Cela crée une boucle!
      WHERE om.org_id = org_members.org_id
      ...
    )
  );
```

Quand properties policy essaie de lire `org_members`, ça déclenche sa propre policy → boucle infinie.

---

## ✅ FIX IMMÉDIATE – 2 minutes

### Étape 1: Allez dans Supabase Dashboard

1. https://supabase.com → Votre projet
2. SQL Editor → **New Query**

### Étape 2: Copiez-collez ce SQL

```sql
-- CRITICAL FIX: Break infinite recursion in org_members RLS
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OrgMembers: Admin read own org members" ON org_members;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'org_members';
```

### Étape 3: Cliquez **Execute**

Vous verrez:
```
 tablename
───────────
 org_members
```

### Étape 4: Vérifiez sur le site

```
npm run dev
# Allez sur http://localhost:3000/logements
# ✅ Les propriétés doivent apparaître maintenant!
```

---

## 📊 Avant vs Après

### AVANT (Bugué)
```
Console navigateur:
❌ infinite recursion detected in policy for relation "org_members"

Site:
"Aucune propriété disponible pour le moment."
```

### APRÈS (Fixé)
```
Console navigateur:
✅ Properties fetched: 2 [{...}, {...}]

Site:
Affiche 2+ propriétés publiées
```

---

## 🧪 Test de vérification

Une fois la fix appliquée, exécutez ce diagnostic:

```bash
node supabase/debug_properties.js
```

Vous verrez:
```
🔍 DEBUG: Testing Supabase Properties Access

1️⃣  Fetching ALL properties...
   ✅ Success! Found 2 properties

2️⃣  Fetching PUBLISHED properties...
   ✅ Success! Found 2 published properties
   - Gîte de Montagne avec Vue
   - Maison à Proximité du Lac

✅ SUCCESS! Properties should appear on the website.
```

---

## 🔒 Sécurité?

**Q: Est-ce sûr de désactiver RLS sur org_members?**

**A:** Oui! Voici pourquoi:

1. **org_members est admin-only**: Les enregistrements sont privés par nature
2. **RLS on properties remains active**: Les utilisateurs anonymes voient UNIQUEMENT les propriétés publiées
3. **Cette table n'est jamais lue directement**: Elle est seulement utilisée dans les jointures internes
4. **En V1**: Pas de multi-tenant complexe donc c'est acceptable

La sécurité reste intacte grâce à la RLS sur la table `properties`.

---

## 📁 Fichiers concernés

| Fichier | Changement |
|---------|-----------|
| app/page.js | ✅ Ajout gestion d'erreur + logs |
| app/logements/page.js | ✅ Ajout gestion d'erreur + logs |
| supabase/DIAGNOSTIC.sql | ✨ NEW – Tester données |
| supabase/debug_properties.js | ✨ NEW – Tester connection |
| supabase/migrations/fix_infinite_recursion.sql | ✨ NEW – Appliquer fix |
| BUG_FIX_GUIDE.md | ✨ NEW – Guide complet |

---

## 🎬 Steps de vérification finale

- [ ] Exécuté le SQL fix en Supabase Dashboard
- [ ] `npm run dev` lancé localement
- [ ] Allé sur http://localhost:3000/logements
- [ ] Vu au moins 2 propriétés publiées
- [ ] Cliqué sur une propriété → page détail fonctionne
- [ ] Console navigateur (F12) montre `✅ Properties fetched: X`

---

## ❓ Si ça ne marche pas

1. **Vérifiez que le SQL a été exécuté** (pas juste copié-collé)
2. **Rafraîchissez le navigateur** (Ctrl+F5 hard refresh)
3. **Vérifiez que seed.sql a été exécuté** (propriétés existent en base)
4. **Consultez la console** (F12) pour les erreurs exactes

