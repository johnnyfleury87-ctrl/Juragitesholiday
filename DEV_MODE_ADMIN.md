# 👨‍💻 Mode Développement Admin

## 🎯 Objectif

Permettre l'accès à l'interface admin **sans authentification** pendant la construction des fonctionnalités.

---

## ⚙️ Configuration

### Activation du mode dev

Ajouter cette variable dans `.env.local` :

```env
NEXT_PUBLIC_ADMIN_DEV_MODE=true
```

### En production

Supprimer la variable ou la mettre à `false` :

```env
NEXT_PUBLIC_ADMIN_DEV_MODE=false
```

---

## 🚀 Accès à l'interface Admin

### Mode Dev ACTIVÉ ✅

1. **Depuis la navbar** (bouton visible)
   ```
   👨‍💻 Admin (dev) → /admin
   ```

2. **Accès direct**
   ```
   http://localhost:3000/admin
   ```

3. **Badge d'avertissement** visible en haut du dashboard
   ```
   ⚙️ Mode développement actif
   Accès libre sans authentification – Interface de construction
   ```

### Mode Dev DÉSACTIVÉ ❌

- Le bouton "Admin (dev)" disparaît de la navbar
- L'accès à `/admin` nécessite un login
- Les RLS de Supabase sont appliquées

---

## 📂 Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `lib/devMode.js` | ✨ Nouveau - Configuration du mode dev |
| `lib/guards.js` | Modifier le guard `withAdminAuth` pour bypass en dev |
| `app/admin/page.js` | Ajouter badge "Mode dev" + lien Operations |
| `components/shared.js` | Ajouter bouton "Admin (dev)" dans navbar |
| `.env.local` | Ajouter `NEXT_PUBLIC_ADMIN_DEV_MODE=true` |

---

## 🔍 Fonctionnement interne

### Guards (Protection)

```javascript
// En mode dev
if (ADMIN_DEV_MODE) {
  ✅ Bypass complètement l'authentification
  ✅ Crée un utilisateur fictif "dev-user"
  ✅ Accès immédiat
}

// En mode production
❌ Vérifie l'authentification Supabase
❌ Vérifie le rôle admin
❌ Redirige vers /admin/login si non autorisé
```

---

## ✅ Points clés

| Aspect | Status |
|--------|--------|
| Login complètement contourné | ✅ |
| Pas de modification de sécurité | ✅ |
| Accès à toutes les pages admin | ✅ |
| Badge dev visible | ✅ |
| Changement facile on/off | ✅ |

---

## 🛠️ Ce qui fonctionne maintenant

En mode dev, vous pouvez accéder à :

- ✅ `/admin` – Dashboard principal
- ✅ `/admin/logements` – Gestion des logements
- ✅ `/admin/operations` – Gestion opérationnelle (nouveau)
- ✅ `/admin/dashboard` – Tableau de bord complet
- ✅ `/admin/reservations` – Gestion des réservations

**Aucune authentification requise.**

---

## ⚠️ Avant de déployer

```bash
# 1. Désactiver le mode dev
NEXT_PUBLIC_ADMIN_DEV_MODE=false

# 2. Vérifier que login fonctionne
# 3. Tester les RLS policies
# 4. Redéployer
```

---

## 📋 Checklist construction

- [x] Mode dev activé
- [x] Accès navbar visible
- [x] Badge d'avertissement
- [x] Page `/admin` accessible
- [ ] Tester toutes les pages admin
- [ ] Ajouter/modifier données
- [ ] Vérifier l'UI
- [ ] Prêt pour tests

---

**Mode Construction Actif** 🏗️

Accès libre jusqu'à réactivation de l'authentification.
