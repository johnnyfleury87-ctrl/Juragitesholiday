# ⚡ DÉMARRAGE RAPIDE - MODULE ESTIMATION

## En 10 minutes: Mise en route complète

### 1️⃣ SETUP BASE DE DONNÉES (2 min)

```bash
# Appliquer les migrations
supabase db push

# Vérifier les tables créées
supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

**Fichiers appliqués:**
- `supabase/migrations/005_create_estimation_module.sql`
- `supabase/migrations/006_seed_estimation_initial.sql`

### 2️⃣ VARIABLES D'ENVIRONNEMENT (1 min)

Créer `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Stripe (test keys pour dev)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (SendGrid - optionnel pour dev)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=dev@example.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ESTIMATION_PRICE_EUR=49.00
```

### 3️⃣ DÉPENDANCES (2 min)

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js pdfkit react-hook-form zod date-fns clsx @sendgrid/mail

# Vérifier installation
npm list stripe pdfkit react-hook-form
```

### 4️⃣ STRUCTURE FICHIERS (1 min)

✅ **Déjà créés:**
- `lib/estim-auth.js` - Auth client
- `lib/estimation-calculator.js` - Moteur calcul
- `lib/payment-service.js` - Paiement Stripe
- `lib/pdf-generator.js` - PDF generation
- `lib/audit-service.js` - Audit trail
- `app/api/admin/estimation/route.js` - Admin API
- `app/estimation/page.js` - Landing page

### 5️⃣ DÉMARRER LE SERVEUR (1 min)

```bash
npm run dev

# Accès: http://localhost:3000/estimation
```

### 6️⃣ TESTER LE PARCOURS (3 min)

1. Aller à http://localhost:3000/estimation
2. Cliquer "Commencer une estimation"
3. S'inscrire avec email/password
4. Voir le formulaire (à complétude)
5. Connexion à Stripe Dashboard pour voir payment intent

---

## 📋 CHECKLIST D'INTÉGRATION

### Core Functionality
- [x] Database setup (tables + RLS)
- [x] Authentication (register/login)
- [x] Calculation engine (100% server-side)
- [x] Payment integration (Stripe)
- [x] PDF generation (5 pages)
- [x] Admin configuration (endpoints)
- [x] Audit logging (immutable trail)
- [x] Landing page (law-compliant)

### À Implémenter (Step by step)
- [ ] Form Steps 1-5 (formulaires)
- [ ] Stripe Payment UI (client-side)
- [ ] Results page (display + download)
- [ ] Admin Dashboard (config UI)
- [ ] Email notifications (SendGrid)
- [ ] Error pages (404, 500)
- [ ] User profile/history
- [ ] Analytics

---

## 🔗 LIENS IMPORTANTS

| Resource | Link |
|----------|------|
| Database Schema | `supabase/migrations/005_create_estimation_module.sql` |
| Implementation Guide | `ESTIMATION_IMPLEMENTATION_GUIDE.md` |
| Full Summary | `ESTIMATION_MODULE_SUMMARY.md` |
| Auth Service | `lib/estim-auth.js` |
| Calculator | `lib/estimation-calculator.js` |
| Payment Service | `lib/payment-service.js` |
| PDF Generator | `lib/pdf-generator.js` |
| Audit Service | `lib/audit-service.js` |
| Landing Page | `app/estimation/page.js` |

---

## 🧪 TEST AVEC STRIPE (Sandbox)

### Carte de test
- Numéro: `4242 4242 4242 4242`
- Expiration: `12/25`
- CVC: `123`

### Test API
```bash
curl -X POST http://localhost:3000/api/payment/intent \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "user-uuid",
    "estimationId": "est-uuid",
    "clientEmail": "test@example.com"
  }'
```

---

## 📊 ARCHITECTURE EN UN COUP D'ŒIL

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTIMATION CLIENT                        │
│                                                             │
│  Landing → Auth → Form Step 1-4 → Legal Consent → Payment  │
│                                                             │
│  ↓ Success → Results Page + PDF Download                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE LOGIC                        │
│                                                             │
│  1. Validation Données                                      │
│  2. Fetch Pricing (Commune/Zone/Défaut)                    │
│  3. Apply Coefficients (Type, État, Terrain)               │
│  4. Apply Amenities (+%, +€)                               │
│  5. Calculate Confidence Level                             │
│  6. Generate Range (Low/Med/High)                          │
│                                                             │
│  ↓                                                          │
│                                                             │
│  7. Process Payment (Stripe)                               │
│  8. Generate PDF (5 pages)                                 │
│  9. Send Email                                             │
│  10. Log Audit Events                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                      │
│                                                             │
│  ✓ estimation_requests   (main record)                      │
│  ✓ estimation_audit_log  (full trail)                       │
│  ✓ payment_transactions  (payment records)                  │
│  ✓ price_per_m2          (pricing)                          │
│  ✓ coefficients          (rules)                            │
│  ✓ options_values        (amenities)                        │
│  ✓ calculation_rules_version (immutable)                    │
│  ✓ legal_mentions        (versioned disclaimers)            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE (Supabase)                       │
│                                                             │
│  📄 PDF Files: estimations/{client_id}/{estimation_id}.pdf  │
│     → Private bucket (signed URLs only)                     │
│     → Immutable (versioning for recalc)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ GARANTIES LÉGALES

### Positionnement Clair
```
✓ "Estimation indicative" - Systématique
✓ "Non-expertise officielle" - Légalement clair
✓ "Aide à la décision" - Tonalité positive
✓ "Données déclarées" - Responsabilité client
```

### Consent & Traçabilité
```
✓ Consent checkbox OBLIGATOIRE
✓ Timestamp enregistré
✓ IP client sauvegardée
✓ Audit trail immuable
✓ Export GDPR possible
```

### Intégrité Calcul
```
✓ Fourchette TOUJOURS (jamais chiffre unique)
✓ Confiance visible (low/medium/high)
✓ Marge affichée (±5%/±10%/±20%)
✓ Version règles immutable
✓ Inputs gelées après soumission
```

---

## 🚀 PROCHAINES ÉTAPES

### Phase 1: Forms (Today)
```javascript
// À créer:
- app/estimation/form/step1-reason/page.js
- app/estimation/form/step2-property/page.js
- app/estimation/form/step3-amenities/page.js
- app/estimation/form/step4-consent/page.js
- app/estimation/form/step5-payment/page.js
```

### Phase 2: Results (Today)
```javascript
// À créer:
- app/estimation/results/page.js
- app/estimation/results/[id]/page.js
```

### Phase 3: Admin (Tomorrow)
```javascript
// À créer:
- app/admin/estimation/page.js
- app/admin/estimation/pricing/page.js
- app/admin/estimation/coefficients/page.js
```

### Phase 4: Polish (This week)
- Error handling
- Email notifications
- Analytics
- Monitoring

---

## 📞 SUPPORT / DÉPANNAGE

### Issue: `tables not found`
```bash
# Solution:
supabase db reset  # Warning: clears all data!
supabase db push
```

### Issue: `CORS error on payment`
```bash
# Vérifier STRIPE_PUBLIC_KEY dans .env.local
# Doit être pk_test_... pour Stripe test mode
```

### Issue: `PDF not generating`
```bash
# Vérifier bucket created:
supabase storage buckets list

# Créer si absent:
supabase storage create-bucket estimation-pdfs --public false
```

### Issue: `RLS policy blocking`
```sql
-- Debug:
SELECT * FROM auth.users WHERE id = 'your-user-id';
-- Vérifier org_members si admin
```

---

## ✨ FEATURES CLÉS

| Feature | Status | File |
|---------|--------|------|
| Database + RLS | ✅ Complete | `migrations/005-006` |
| Auth (register/login) | ✅ Complete | `lib/estim-auth.js` |
| Calculation Engine | ✅ Complete | `lib/estimation-calculator.js` |
| Payment (Stripe) | ✅ Complete | `lib/payment-service.js` |
| PDF Generation | ✅ Complete | `lib/pdf-generator.js` |
| Admin API | ✅ Complete | `app/api/admin/estimation/route.js` |
| Audit Trail | ✅ Complete | `lib/audit-service.js` |
| Landing Page | ✅ Complete | `app/estimation/page.js` |
| Form Steps | ⏳ To Do | `app/estimation/form/` |
| Results Page | ⏳ To Do | `app/estimation/results/` |
| Admin UI | ⏳ To Do | `app/admin/estimation/` |

---

**Ready to launch! 🚀**

Besoin de clarifications? Consultez:
- `ESTIMATION_IMPLEMENTATION_GUIDE.md` - Architecture détaillée
- `ESTIMATION_MODULE_SUMMARY.md` - Vue d'ensemble complète
- Database comments - Dans les migrations SQL
