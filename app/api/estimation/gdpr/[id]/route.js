import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Vérifier le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Charger l'estimation
    const { data: estimation, error: fetchError } = await supabase
      .from('estimation_requests')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (fetchError || !estimation) {
      return Response.json(
        { error: 'Estimation not found' },
        { status: 404 }
      );
    }

    // Charger le profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Charger les trails
    const { data: auditTrail } = await supabase
      .from('estimation_audit_log')
      .select('*')
      .eq('estimation_id', id)
      .order('created_at', { ascending: true });

    const { data: paymentTrail } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('estimation_id', id)
      .order('created_at', { ascending: true });

    // Retourner le dossier complet
    const completeRecord = {
      estimation,
      profile: {
        id: profile?.id,
        email: user.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        phone: profile?.phone
      },
      auditTrail,
      paymentTrail,
      exportedAt: new Date().toISOString(),
      legalInfo: {
        consentAccepted: estimation.legal_consent_accepted,
        consentTimestamp: estimation.legal_consent_timestamp,
        consentIP: estimation.legal_consent_ip,
        gdprExport: true
      }
    };

    // Retourner en format JSON pour téléchargement
    return new Response(
      JSON.stringify(completeRecord, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="estimation-${id}-gdpr.json"`
        }
      }
    );
  } catch (error) {
    console.error('GDPR export error:', error);
    return Response.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
