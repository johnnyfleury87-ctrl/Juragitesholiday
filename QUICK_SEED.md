# ⚡ QUICK START – POPULATE DEMO DATA

## 🚀 3 MINUTES POUR ACTIVER LES LOGEMENTS

### Option 1: Script Node (Facile ✅)
```bash
cd /workspaces/Juragitesholiday
node seed.js
```

✓ Nécessite: `.env.local` avec clés Supabase  
✓ Output: Affiche résumé des données créées

---

### Option 2: SQL Brut via Dashboard (Rapide)
1. Ouvrir: https://app.supabase.com
2. Sélectionner le projet
3. SQL Editor (icône SELECT)
4. Copier le contenu de: [supabase/seed.sql](supabase/seed.sql)
5. Exécuter

---

### Option 3: Supabase CLI (Professionnel)
```bash
supabase db push
supabase seed run
```

---

## ✅ Vérification Immédiate

### En Local
```bash
npm run dev
# Accès: http://localhost:3000/logements
```
Doit afficher **4 logements** (Chalet, Maison Lac, Gîte, Maison Proximité)

### En Production
```
https://juragitesholiday-pkveu3rp.vercel.app/logements
```

---

## 📊 Ce que tu obtiens

| Logement | Prix | Capacité | Type |
|----------|------|----------|------|
| 🏔️ Chalet des Sapins | €320 | 12 | **NEW** – Pool + Sauna |
| 🏡 Maison du Lac | €210 | 8 | **NEW** – Hot tub + Jardin |
| 🏠 Gîte Montagne | €150 | 6 | Existant |
| 🏘️ Maison Proximité | €120 | 4 | Existant |

---

## 📚 Documentation Complète

- [SEED_INSTRUCTIONS.md](SEED_INSTRUCTIONS.md) – Guide détaillé
- [DEMO_PROPERTIES_SUMMARY.md](DEMO_PROPERTIES_SUMMARY.md) – Spec complète
- [DEMO_VISUAL_GUIDE.md](DEMO_VISUAL_GUIDE.md) – UI mockups

---

**Let's go! 🚀**
