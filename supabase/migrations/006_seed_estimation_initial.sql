-- ============================================================
-- SEED DATA: ESTIMATION MODULE
-- Purpose: Initialize zones, communes, pricing, coefficients
-- ============================================================

-- ============================================================
-- 1) ZONES (Jura regions)
-- ============================================================

INSERT INTO zones (name, description, is_active) VALUES
('Zone Métropole', 'Lons-le-Saunier centre et proches environs', TRUE),
('Zone Chaleur', 'Dole, Saint-Claude et vallées', TRUE),
('Zone Rurale Centrale', 'Communes intermédiaires, campagne Jura', TRUE),
('Zone Montagne', 'Hauts-Plateaux, stations touristiques', TRUE),
('Zone Périphérie', 'Communes limitrophes', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2) CALCULATION RULES VERSION (Initial version)
-- ============================================================

INSERT INTO calculation_rules_version (version_number, rule_set, description, is_active)
VALUES (
  1,
  '{
    "version": 1,
    "name": "Version initiale - Estimation Jura",
    "date_created": "2026-01-19",
    "rules": {
      "confidence_margins": {
        "minimal_data": {"low": -20, "high": 20},
        "complete_data": {"low": -10, "high": 10},
        "very_complete_data": {"low": -5, "high": 5}
      },
      "confidence_level_thresholds": {
        "low": 0.5,
        "medium": 0.75,
        "high": 0.9
      },
      "terrain_adjustment": {
        "method": "stepped",
        "steps": [
          {"area_min": 0, "area_max": 500, "factor": 1.0},
          {"area_min": 500, "area_max": 2000, "factor": 1.1},
          {"area_min": 2000, "area_max": 5000, "factor": 1.2},
          {"area_min": 5000, "area_max": 100000, "factor": 1.3}
        ]
      }
    }
  }',
  'Version initiale avec barèmes Jura de base',
  TRUE
)
ON CONFLICT (version_number) DO NOTHING;

-- Get the version ID for further inserts
-- Note: We will use dynamic inserts below

-- ============================================================
-- 3) LEGAL MENTIONS
-- ============================================================

INSERT INTO legal_mentions (version, reason, short_text, long_text, version_id)
SELECT
  1,
  reason_data.reason,
  reason_data.short_text,
  reason_data.long_text,
  (SELECT id FROM calculation_rules_version WHERE version_number = 1)
FROM (
  VALUES
    ('curiosity',
     'Estimation à titre informatif',
     'Cette estimation est fournie à titre purement informatif et indicatif. Elle n'a aucune valeur légale et ne constitue pas une expertise immobilière opposable en justice. Elle est destinée à vous aider dans vos décisions personnelles.'),
    ('sale',
     'Aide à la négociation - Document préparatoire',
     'Ce document d'estimation a pour seul objectif de vous assister dans vos négociations de vente. Il ne constitue en aucun cas une expertise immobilière professionnelle, ni une valeur vénale officielle. Un diagnostic immobilier professionnel est recommandé avant la signature du compromis.'),
    ('divorce',
     'Évaluation pour contexte matrimonial',
     'Cette estimation est strictement réservée à un usage informatif dans un contexte de séparation/divorce. Elle ne constitue pas une expertise opposable devant une juridiction. Une expertise ordonnée par le tribunal demeure la seule valeur légale reconnue.'),
    ('inheritance',
     'Évaluation pour succession',
     'Cette estimation a pour seul objectif d'informer sur la valeur probable du bien dans un contexte de succession. Elle ne remplace pas l'expertise officielle, éventuellement requise pour la taxation de la succession ou le partage équitable.'),
    ('notarial',
     'Document préparatoire notarial',
     'Ce document est un pré-diagnostic informatif destiné à faciliter votre première discussion avec un notaire. Une expertise professionnelle indépendante reste nécessaire pour tous actes officiels.'),
    ('other',
     'Estimation indicative',
     'Cette estimation a un caractère informatif et indicatif. Elle ne constitue pas une expertise immobilière ni un engagement de valeur. Les données déclarées ne sont pas vérifiées sur site.')
) AS reason_data(reason, short_text, long_text)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4) COEFFICIENTS (Adjustment factors)
-- ============================================================

INSERT INTO coefficients (name, category, value_key, coefficient, description, version_id, is_active)
SELECT
  coef.name,
  coef.category,
  coef.value_key,
  coef.coefficient,
  coef.description,
  (SELECT id FROM calculation_rules_version WHERE version_number = 1),
  TRUE
FROM (
  VALUES
    -- Property condition coefficients
    ('À rénover', 'property_condition', 'to_renovate', 0.75::DECIMAL, 'Bien nécessitant travaux majeurs'),
    ('Correct', 'property_condition', 'correct', 0.90::DECIMAL, 'État standard, petits travaux courants'),
    ('Bon', 'property_condition', 'good', 1.05::DECIMAL, 'Bien entretenu, aménagements modernes'),
    ('Très bon / Récent', 'property_condition', 'very_good', 1.20::DECIMAL, 'Très bon état, rénovations récentes'),
    
    -- Property type coefficients
    ('Maison', 'property_type', 'house', 1.0::DECIMAL, 'Maison individuelle (référence)'),
    ('Appartement', 'property_type', 'apartment', 0.95::DECIMAL, 'Petit multiplicateur pour bien collectif'),
    ('Autre', 'property_type', 'other', 0.85::DECIMAL, 'Autres types de bien'),
    
    -- Terrain size adjustments (large coefficient for land)
    ('Terrain très petit', 'terrain_size', 'very_small', 0.90::DECIMAL, 'Moins de 200 m²'),
    ('Terrain petit', 'terrain_size', 'small', 1.0::DECIMAL, '200-500 m² (référence)'),
    ('Terrain moyen', 'terrain_size', 'medium', 1.15::DECIMAL, '500-2000 m²'),
    ('Terrain grand', 'terrain_size', 'large', 1.25::DECIMAL, '2000-5000 m²'),
    ('Terrain très grand', 'terrain_size', 'very_large', 1.35::DECIMAL, 'Plus de 5000 m²'),
    
    -- Location coefficients by zone
    ('Zone Métropole', 'location', 'zone_metropole', 1.25::DECIMAL, 'Lons-le-Saunier centre'),
    ('Zone Chaleur', 'location', 'zone_chaleur', 1.05::DECIMAL, 'Dole, Saint-Claude'),
    ('Zone Rurale Centrale', 'location', 'zone_rurale_centrale', 1.0::DECIMAL, 'Communes intermédiaires'),
    ('Zone Montagne', 'location', 'zone_montagne', 1.15::DECIMAL, 'Hauts-Plateaux touristiques'),
    ('Zone Périphérie', 'location', 'zone_peripherie', 0.90::DECIMAL, 'Communes limitrophes')
) AS coef(name, category, value_key, coefficient, description)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5) OPTIONS VALUES (Amenities pricing)
-- ============================================================

INSERT INTO options_values (name, option_key, value_type, value, description, version_id, is_active)
SELECT
  opt.name,
  opt.option_key,
  opt.value_type,
  opt.value,
  opt.description,
  (SELECT id FROM calculation_rules_version WHERE version_number = 1),
  TRUE
FROM (
  VALUES
    -- Fixed amount increases
    ('Garage (fixe)', 'garage_fixed', 'fixed', 15000::DECIMAL, 'Plus-value garage unique'),
    ('Piscine (fixe)', 'pool_fixed', 'fixed', 30000::DECIMAL, 'Piscine privée ou accès piscine'),
    ('Terrasse / Balcon (fixe)', 'terrace_fixed', 'fixed', 8000::DECIMAL, 'Terrasse ou balcon aménagé'),
    ('Dépendance (fixe)', 'outbuilding_fixed', 'fixed', 12000::DECIMAL, 'Petit bâtiment séparé utilisable'),
    ('Sous-sol (fixe)', 'basement_fixed', 'fixed', 10000::DECIMAL, 'Cave, sous-sol aménagé'),
    ('Travaux récents (fixe)', 'recent_work_fixed', 'fixed', 20000::DECIMAL, 'Toiture, électricité, plomberie récents'),
    
    -- Percentage increases
    ('Vue exceptionnelle (%)', 'exceptional_view', 'percentage', 10::DECIMAL, 'Panorama, vue mer/montagne'),
    ('Accès direct nature (%)', 'nature_access', 'percentage', 5::DECIMAL, 'Accès direct forêt, lac, rivière'),
    ('Bien d'époque', 'period_property', 'percentage', 15::DECIMAL, 'Charme historique, éléments typiques'),
    
    -- Percentage decreases (negative values)
    ('Nuisances sonores', 'noise_nuisance', 'percentage', -10::DECIMAL, 'Proximité route, aéroport, usine'),
    ('Isolation faible', 'poor_isolation', 'percentage', -8::DECIMAL, 'Factures énergétiques élevées probables'),
    ('Configuration difficile', 'difficult_layout', 'percentage', -5::DECIMAL, 'Pièces décloisonnées, architecture complexe')
) AS opt(name, option_key, value_type, value, description)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6) BASE PRICES PER M² (Jura communes by zone)
-- ============================================================

-- This is a representative sample - would be expanded with all ~650 communes
INSERT INTO price_per_m2 (commune_id, zone_id, price_per_m2, is_default, version_id)
SELECT NULL, z.id, base_price.price, base_price.is_default, (SELECT id FROM calculation_rules_version WHERE version_number = 1)
FROM zones z
CROSS JOIN (
  VALUES
    (1500::DECIMAL, TRUE),  -- Default fallback
    (1500::DECIMAL, FALSE)  -- Zone specific (will be overridden per zone)
) AS base_price(price, is_default)
WHERE base_price.is_default = TRUE
ON CONFLICT DO NOTHING;

-- Zone-specific base prices
INSERT INTO price_per_m2 (zone_id, price_per_m2, is_default, version_id)
SELECT id, zone_price.price, FALSE, (SELECT id FROM calculation_rules_version WHERE version_number = 1)
FROM zones
CROSS JOIN (
  VALUES
    (2200::DECIMAL),  -- Métropole
    (1800::DECIMAL),  -- Chaleur
    (1500::DECIMAL),  -- Rurale Centrale
    (1900::DECIMAL),  -- Montagne
    (1200::DECIMAL)   -- Périphérie
) AS zone_price(price)
WHERE name = CASE
  WHEN name = 'Zone Métropole' THEN 'Zone Métropole'
  WHEN name = 'Zone Chaleur' THEN 'Zone Chaleur'
  WHEN name = 'Zone Rurale Centrale' THEN 'Zone Rurale Centrale'
  WHEN name = 'Zone Montagne' THEN 'Zone Montagne'
  WHEN name = 'Zone Périphérie' THEN 'Zone Périphérie'
END
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7) SAMPLE COMMUNES (partial list)
-- ============================================================

INSERT INTO communes (name, postal_code, zone_id, is_active)
SELECT
  commune.name,
  commune.postal_code,
  (SELECT id FROM zones WHERE name = commune.zone_name LIMIT 1),
  TRUE
FROM (
  VALUES
    -- Zone Métropole
    ('Lons-le-Saunier', '39000', 'Zone Métropole'),
    ('Montmorot', '39570', 'Zone Métropole'),
    ('Mayeux', '39270', 'Zone Métropole'),
    
    -- Zone Chaleur
    ('Dole', '39100', 'Zone Chaleur'),
    ('Saint-Claude', '39200', 'Zone Chaleur'),
    ('Salins-les-Bains', '39110', 'Zone Chaleur'),
    
    -- Zone Rurale Centrale
    ('Bletterans', '39140', 'Zone Rurale Centrale'),
    ('Chaumergy', '39130', 'Zone Rurale Centrale'),
    ('Saint-Amour', '39160', 'Zone Rurale Centrale'),
    
    -- Zone Montagne
    ('Prémanon', '39220', 'Zone Montagne'),
    ('Chalain', '39120', 'Zone Montagne'),
    ('Lamoura', '39310', 'Zone Montagne'),
    
    -- Zone Périphérie
    ('Champagnole', '39300', 'Zone Périphérie'),
    ('Nozeroy', '39250', 'Zone Périphérie')
) AS commune(name, postal_code, zone_name)
WHERE NOT EXISTS (
  SELECT 1 FROM communes c WHERE c.name = commune.name
);

-- ============================================================
-- 8) VERIFY SEED
-- ============================================================

-- Display summary
SELECT 'Zones créées' as setup, COUNT(*) as count FROM zones
UNION ALL
SELECT 'Communes créées', COUNT(*) FROM communes
UNION ALL
SELECT 'Coefficients créés', COUNT(*) FROM coefficients
UNION ALL
SELECT 'Options créées', COUNT(*) FROM options_values
UNION ALL
SELECT 'Prix m² créés', COUNT(*) FROM price_per_m2
UNION ALL
SELECT 'Mentions légales', COUNT(*) FROM legal_mentions
UNION ALL
SELECT 'Versions règles', COUNT(*) FROM calculation_rules_version;
