# Structure Visuelle - Liens de Réseaux Sociaux

## Layout du Header (Toutes pages publiques)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Logo "JuraGites"  │  Logements  Activités  │  Connexion  Inscription  ⓘ◉⚑ │
└─────────────────────────────────────────────────────────────────────────┘
   └──────┬──────┘   └────────┬──────────┘   └──────────┬──────────┘  └─┬─┘
      nav-left        nav-center                nav-right          SocialLinks
                                            (Auth buttons)        (Icons animés)
```

### Détails du Composant SocialLinks (Header)
```
    [Facebook]  [Instagram]  [Airbnb]
     (40x40px)   (40x40px)   (40x40px)

Hover Effect:
- Scale: 1.0 → 1.15
- Shadow: 0 8px 20px rgba(0, 102, 255, 0.25)
- Color: #6B7280 (gris) → #0066FF (bleu)
```

---

## Layout du Footer (Bas de toutes pages publiques)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  JuraGites              Liens utiles    Contact   │
│  Description courte     - Logements     Email:    │
│                         - Activités     Tél:      │
│                         - Connexion              │
│                                                    │
├────────────────────────────────────────────────────┤
│                Nous suivre                         │
│         [Facebook] [Instagram] [Airbnb]           │
│                                                    │
│  © 2026 JuraGites. Tous droits réservés.         │
└────────────────────────────────────────────────────┘
```

### Détails du Composant SocialLinksFooter
```
Nous suivre
  Facebook   Instagram   Airbnb
  
Animation au survol:
- Underline width: 0 → 100%
- Color: #6B7280 → #0066FF
- Font: 0.875rem
```

---

## Responsive Design (Mobile, max-width: 768px)

### Header Mobile
```
┌──────────────────────────────────────┐
│ JuraGites │ Logs Act │ Conn Insc ⓘ◉⚑ │
└──────────────────────────────────────┘
  (Compact, padding réduit, icons 32x32)
```

### Footer Mobile
```
┌────────────────────┐
│ JuraGites          │
│ Description        │
├────────────────────┤
│ Liens utiles       │
│ - Logements        │
│ - Activités        │
│ - Connexion        │
├────────────────────┤
│ Contact            │
│ Email: ...         │
│ Tél: ...           │
├────────────────────┤
│ Nous suivre        │
│ Facebook           │
│ Instagram          │
│ Airbnb             │
├────────────────────┤
│ © 2026 JuraGites   │
└────────────────────┘
  (1 colonne, stack vertical)
```

---

## Icônes SVG

### Facebook
- Circular background
- White "f" logo
- Size: 20x20px (header), 16x16px (mobile)

### Instagram
- Camera circle design
- Minimal and modern
- Size: 20x20px (header), 16x16px (mobile)

### Airbnb
- House/people design
- Distinctive shape
- Size: 20x20px (header), 16x16px (mobile)

---

## Couleurs et Styles

### Palette
```
Primary Blue:       #0066FF
Primary Dark:       #0052CC
Text Light:         #6B7280
Background Light:   #F9FAFB
Border:             #E5E7EB
White:              #FFFFFF
```

### Animations
```
Default Timing:     cubic-bezier(0.4, 0, 0.2, 1)
Duration:           0.3s
Scale On Hover:     1.0 → 1.15
Glow Distance:      8px
Glow Blur:          20px
Glow Alpha:         0.25
```

---

## Points d'Intégration dans le Projet

### Header
- ✅ Apparaît dans: `PublicHeader()` (components/shared.js)
- ✅ Intégré sur toutes les pages publiques
- ✅ Responsive et animé

### Footer
- ✅ Apparaît dans: `PublicFooter()` (components/shared.js)
- ✅ Intégré sur 6 pages : 
  - Accueil (page.js)
  - Logements (logements/page.js)
  - Détail logement (logements/[slug]/page.js)
  - Activités (activites/page.js)
  - Connexion (login/page.js)
  - Inscription (signup/page.js)
- ✅ Responsive et animé

---

## Facilité de Personnalisation

### Changer les URLs
```javascript
// In components/SocialLinks.js
const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/YOUR_PAGE_ID',  // ← Changer ici
    ...
  },
  // ... autres réseaux
];
```

### Ajouter un nouveau réseau social
```javascript
{
  name: 'LinkedIn',
  href: 'https://linkedin.com/YOUR_PROFILE',
  // SVG path sera ajoutée dans la fonction render
}
```

### Personnaliser les animations
```css
/* In app/globals.css */
.social-link:hover {
  transform: scale(1.15) translateY(-3px); /* Ajuster les valeurs */
  box-shadow: 0 8px 20px rgba(0, 102, 255, 0.25); /* Changer la couleur */
}
```

---

