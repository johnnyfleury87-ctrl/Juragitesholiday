/**
 * pdf-generator.js - PDF report generation for estimations
 * Purpose: Create structured, legal-compliant PDF documents
 * Scope: Server-side PDF creation with full metadata
 */

import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Generate complete estimation PDF
 * @param {Object} estimation - Estimation request with calculation results
 * @param {Object} calculationData - Result from calculateEstimation
 * @param {Object} clientProfile - Client profile information
 * @returns {Promise<{pdfPath, error}>}
 */
export async function generateEstimationPDF(estimation, calculationData, clientProfile) {
  if (!estimation || !calculationData || !clientProfile) {
    return {
      pdfPath: null,
      error: new Error('Missing required estimation data')
    };
  }

  try {
    // 1) Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true
    });

    // 2) Set up metadata
    doc.metadata = {
      Title: 'Rapport d\'estimation immobilière',
      Author: 'JuraGîtes - Module d\'estimation',
      Subject: `Estimation indicative - ${estimation.id}`,
      Keywords: 'estimation,immobilier,jura,diagnostic',
      CreationDate: new Date()
    };

    // 3) Create PDF content
    await createCoverPage(doc, estimation, clientProfile);
    await createContextPage(doc, estimation);
    await createPropertyDescriptionPage(doc, estimation);
    await createMethodologyPage(doc, estimation, calculationData);
    await createResultsPage(doc, estimation, calculationData);
    await createLegalNoticesPage(doc, estimation);

    // 4) Finalize document
    const fileName = `estimation_${estimation.id}_${Date.now()}.pdf`;
    const storagePath = `estimations/${estimation.client_id}/${fileName}`;

    // 5) Convert to buffer and upload
    return new Promise((resolve) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);

          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('estimation-pdfs')
            .upload(storagePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (uploadError) {
            return resolve({
              pdfPath: null,
              error: uploadError
            });
          }

          // Update estimation with PDF path
          await supabase
            .from('estimation_requests')
            .update({ pdf_storage_path: storagePath })
            .eq('id', estimation.id);

          // Log PDF generation
          await logAuditEvent(estimation.id, 'pdf_generated', {
            storage_path: storagePath,
            file_name: fileName,
            file_size_bytes: pdfBuffer.length
          });

          resolve({
            pdfPath: storagePath,
            error: null
          });
        } catch (err) {
          resolve({
            pdfPath: null,
            error: err
          });
        }
      });
      doc.pipe(null); // Don't pipe to file, we're using chunks
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return {
      pdfPath: null,
      error: err
    };
  }
}

/**
 * Create cover page
 */
async function createCoverPage(doc, estimation, clientProfile) {
  // Title
  doc.fontSize(28).font('Helvetica-Bold')
    .text('Rapport d\'estimation immobilière', { align: 'center' })
    .fontSize(14).font('Helvetica')
    .text('Document indicatif', { align: 'center' })
    .moveDown(2);

  // Metadata box
  doc.rect(40, doc.y, 515, 120)
    .stroke();

  doc.fontSize(11).font('Helvetica-Bold')
    .text('INFORMATIONS PRINCIPALES', 50, doc.y + 10);

  doc.fontSize(10).font('Helvetica')
    .text(`Référence: ${estimation.id.substring(0, 8).toUpperCase()}`, 50, doc.y)
    .text(`Date: ${new Date(estimation.created_at).toLocaleDateString('fr-FR')}`)
    .text(`Heure: ${new Date(estimation.created_at).toLocaleTimeString('fr-FR')}`)
    .text(`Client: ${clientProfile.full_name}`)
    .text(`Email: ${clientProfile.email}`);

  doc.moveDown(3);

  // Important notice box
  doc.rect(40, doc.y, 515, 80)
    .stroke();

  doc.fontSize(10).font('Helvetica-Bold')
    .text('⚠️ AVIS IMPORTANT', 50, doc.y + 10);

  doc.fontSize(9).font('Helvetica')
    .text('Cette estimation a un caractère purement indicatif. Elle ne constitue en aucun cas une expertise immobilière officielle, une valeur vénale certifiée ou un engagement de valeur.', 50, doc.y);

  doc.moveDown(4);
}

/**
 * Create context page
 */
async function createContextPage(doc, estimation) {
  doc.fontSize(16).font('Helvetica-Bold')
    .text('1. Contexte et motif d\'estimation', { underline: true })
    .moveDown(1);

  const reasonLabels = {
    'curiosity': 'Curiosité / Information personnelle',
    'sale': 'Préparation à une vente',
    'divorce': 'Séparation / Divorce',
    'inheritance': 'Succession / Partage',
    'notarial': 'Préparation de discussion notariale',
    'other': 'Autre motif'
  };

  doc.fontSize(11).font('Helvetica')
    .text(`Motif déclaré: ${reasonLabels[estimation.estimation_reason] || estimation.estimation_reason}`);

  if (estimation.other_reason) {
    doc.text(`Détails: ${estimation.other_reason}`);
  }

  doc.moveDown(2);

  // Legal context
  doc.fontSize(11).font('Helvetica-Bold')
    .text('Cadre légal applicable');

  doc.fontSize(10).font('Helvetica');

  const legalTexts = {
    'curiosity': 'Cette estimation est fournie à titre informatif exclusif pour vous aider dans vos réflexions personnelles. Elle ne pourrait être invoquée dans aucun contexte juridique ou contractuel.',
    'sale': 'Ce document est un pré-diagnostic destiné à faciliter vos négociations. Une expertise immobilière professionnelle indépendante reste recommandée avant signature de compromis.',
    'divorce': 'Ce document ne constitue pas une expertise opposable devant une juridiction. En cas de litige, seule une expertise ordonnée par le tribunal a valeur probante.',
    'inheritance': 'Cette estimation est un pré-diagnostic informatif. La taxation de la succession dépend d\'une expertise officielle qui sera ordonnée par l\'autorité fiscale.',
    'notarial': 'Ce document prépare votre discussion avec un notaire. L\'expertise officielle du bien demeure obligatoire pour tout acte.',
    'other': 'Cette estimation a un caractère informatif et n\'engage en aucun cas la responsabilité de l\'éditeur.'
  };

  doc.text(legalTexts[estimation.estimation_reason] || legalTexts['other']);

  doc.moveDown(3);
}

/**
 * Create property description page
 */
async function createPropertyDescriptionPage(doc, estimation) {
  doc.fontSize(16).font('Helvetica-Bold')
    .text('2. Description du bien', { underline: true })
    .moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold')
    .text('Caractéristiques générales');

  doc.fontSize(10).font('Helvetica')
    .text(`Type de bien: ${
      estimation.property_type === 'house' ? 'Maison' :
      estimation.property_type === 'apartment' ? 'Appartement' : 'Autre'
    }`)
    .text(`Surface habitable: ${estimation.habitable_area} m²`)
    .text(`Code postal: ${estimation.postal_code}`)
    .text(`État du bien: ${
      estimation.property_condition === 'to_renovate' ? 'À rénover' :
      estimation.property_condition === 'correct' ? 'Correct' :
      estimation.property_condition === 'good' ? 'Bon' :
      'Très bon / Récent'
    }`);

  if (estimation.terrain_area && estimation.terrain_area > 0) {
    doc.text(`Surface terrain: ${estimation.terrain_area} m²`);
  }

  if (estimation.construction_year) {
    doc.text(`Année de construction: ${estimation.construction_year}`);
  }

  doc.moveDown(1.5);

  // Amenities
  if (estimation.amenities && Object.keys(estimation.amenities).length > 0) {
    doc.fontSize(11).font('Helvetica-Bold')
      .text('Options et équipements');

    doc.fontSize(10).font('Helvetica');

    const amenitiesLabels = {
      'garage_fixed': '✓ Garage',
      'pool_fixed': '✓ Piscine',
      'terrace_fixed': '✓ Terrasse / Balcon',
      'outbuilding_fixed': '✓ Dépendance',
      'exceptional_view': '✓ Vue exceptionnelle',
      'basement_fixed': '✓ Sous-sol',
      'recent_work_fixed': '✓ Travaux récents',
      'nature_access': '✓ Accès direct nature',
      'period_property': '✓ Bien d\'époque',
      'noise_nuisance': '✗ Nuisances sonores',
      'poor_isolation': '✗ Isolation faible',
      'difficult_layout': '✗ Configuration difficile'
    };

    Object.entries(estimation.amenities).forEach(([key, selected]) => {
      if (selected) {
        doc.text(amenitiesLabels[key] || `✓ ${key}`);
      }
    });
  }

  doc.moveDown(2);
}

/**
 * Create methodology page
 */
async function createMethodologyPage(doc, estimation, calculationData) {
  doc.fontSize(16).font('Helvetica-Bold')
    .text('3. Méthodologie de calcul', { underline: true })
    .moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold')
    .text('Principes');

  doc.fontSize(10).font('Helvetica')
    .text('L\'estimation est calculée selon une méthodologie interne basée sur:')
    .text('• Prix de référence au m² (par commune / zone)')
    .text('• Coefficients d\'ajustement (type, état, terrain)')
    .text('• Ajustements pour équipements spécifiques')
    .moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold')
    .text('Calcul détaillé');

  doc.fontSize(9).font('Helvetica')
    .text(`1. Base: ${estimation.habitable_area} m² × ${
      calculationData.calculationData.pricing.basePrice
    }€/m² = ${
      calculationData.calculationData.baseValue.toLocaleString('fr-FR')
    }€`, 50)
    .text(`2. Coefficients appliqués: ×${
      calculationData.calculationData.finalCoefficient.toFixed(3)
    }`, 50)
    .text(`3. Ajustements équipements: ${
      calculationData.calculationData.amenitiesAdjustment.percentage >= 0 ? '+' : ''
    }${calculationData.calculationData.amenitiesAdjustment.percentage}% / +${
      calculationData.calculationData.amenitiesAdjustment.fixed
    }€`, 50);

  doc.moveDown(1.5);

  doc.fontSize(10).font('Helvetica-Bold')
    .text('Données et sources');

  doc.fontSize(9).font('Helvetica')
    .text(`• Sources: Données déclarées par le client`)
    .text(`• Vérification: Pas de visite sur site`)
    .text(`• Version des règles: V${estimation.calculation_rules_version_id?.substring(0, 8) || 'N/A'}`)
    .text(`• Date de validité des barèmes: ${new Date(estimation.created_at).toLocaleDateString('fr-FR')}`);

  doc.moveDown(2);
}

/**
 * Create results page
 */
async function createResultsPage(doc, estimation, calculationData) {
  doc.fontSize(16).font('Helvetica-Bold')
    .text('4. Résultats', { underline: true })
    .moveDown(1);

  // Results box
  doc.rect(40, doc.y, 515, 150)
    .stroke();

  doc.fontSize(24).font('Helvetica-Bold')
    .text('Estimation de valeur', 50, doc.y + 15, { align: 'center' });

  doc.fontSize(18).font('Helvetica')
    .text(`${calculationData.estimatedValueLow.toLocaleString('fr-FR')}€ à ${
      calculationData.estimatedValueHigh.toLocaleString('fr-FR')
    }€`, 50, doc.y, { align: 'center' })
    .moveDown(1);

  doc.fontSize(14).font('Helvetica-Bold')
    .text(`Valeur médiane: ${
      calculationData.estimatedValueMedium.toLocaleString('fr-FR')
    }€`, 50, doc.y, { align: 'center' });

  doc.moveDown(6);

  // Confidence level
  doc.fontSize(11).font('Helvetica-Bold')
    .text('Niveau de confiance');

  const confidenceColors = {
    'low': 'Faible (données minimales)',
    'medium': 'Moyen (données complètes)',
    'high': 'Élevé (données très complètes)'
  };

  doc.fontSize(10).font('Helvetica')
    .text(`${confidenceColors[calculationData.confidenceLevel]}`)
    .text(`Marge d'incertitude: ±${calculationData.confidenceMargin}%`)
    .text(`Complétude des données: ${calculationData.dataCompleteness}%`);

  doc.moveDown(2);

  doc.fontSize(11).font('Helvetica-Bold')
    .text('Important');

  doc.fontSize(9).font('Helvetica')
    .text('La fourchette basse/haute reflète l\'incertitude intrinsèque à l\'absence de visite et à la fiabilité des données déclarées. Aucune valeur unique ne peut être présentée comme "la" valeur du bien.');

  doc.moveDown(3);
}

/**
 * Create legal notices page
 */
async function createLegalNoticesPage(doc, estimation) {
  doc.addPage();

  doc.fontSize(16).font('Helvetica-Bold')
    .text('5. Limitations et responsabilité', { underline: true })
    .moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold')
    .text('Limitations de ce document');

  doc.fontSize(10).font('Helvetica')
    .text('✗ Pas de visite sur site', 50)
    .text('✗ Pas d\'expertise officielle', 50)
    .text('✗ Pas d\'évaluation de nuisances occultes', 50)
    .text('✗ Pas d\'appréciation des travaux futurs', 50)
    .text('✗ Résultats basés sur données déclarées', 50)
    .moveDown(2);

  doc.fontSize(11).font('Helvetica-Bold')
    .text('Responsabilité');

  doc.fontSize(9).font('Helvetica')
    .text('JuraGîtes ne peut être tenu responsable de:')
    .text('• Erreurs ou omissions dans les données déclarées', 50)
    .text('• Évolution du marché après la date de ce rapport', 50)
    .text('• Utilisation de ce document en dehors du contexte déclaré', 50)
    .text('• Préjudices résultant d\'une reliance non appropriée', 50)
    .moveDown(2);

  doc.fontSize(11).font('Helvetica-Bold')
    .text('Recommandations');

  doc.fontSize(10).font('Helvetica')
    .text('• Complétez cette estimation par une expertise professionnelle')
    .text('• Consultez un agent immobilier pour une analyse de marché')
    .text('• Ordonnez un diagnostic immobilier complet avant contrat')
    .text('• Documentez tout changement d\'état du bien');

  doc.moveDown(3);

  // Footer
  doc.fontSize(8).font('Helvetica')
    .text('Document généré automatiquement par le module d\'estimation JuraGîtes', 50, doc.page.height - 50, {
      align: 'center'
    })
    .text(`${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR')}`, 50, {
      align: 'center'
    });
}

/**
 * Get PDF download URL
 */
export async function getPDFDownloadURL(storagePath) {
  try {
    const { data } = supabase
      .storage
      .from('estimation-pdfs')
      .getPublicUrl(storagePath);

    return {
      url: data?.publicUrl || null,
      error: null
    };
  } catch (err) {
    return {
      url: null,
      error: err
    };
  }
}

/**
 * Send PDF by email
 */
export async function sendEstimationPDFByEmail(estimation, clientEmail, pdfPath) {
  try {
    // This would integrate with an email service (SendGrid, Mailgun, etc.)
    // For now, log the action
    await logAuditEvent(estimation.id, 'pdf_sent_by_email', {
      recipient_email: clientEmail,
      pdf_path: pdfPath
    });

    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Log audit event
 */
async function logAuditEvent(estimationId, eventType, eventData) {
  try {
    await supabase
      .from('estimation_audit_log')
      .insert([
        {
          estimation_id: estimationId,
          event_type: eventType,
          event_data: eventData
        }
      ]);
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

export default {
  generateEstimationPDF,
  getPDFDownloadURL,
  sendEstimationPDFByEmail
};
