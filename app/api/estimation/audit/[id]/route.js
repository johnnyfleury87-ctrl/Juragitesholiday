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

    // Vérifier le token avec Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Charger l'estimation pour vérifier que l'utilisateur la possède
    const { data: estimation, error: fetchError } = await supabase
      .from('estimation_requests')
      .select('id, client_id')
      .eq('id', id)
      .single();

    if (fetchError || !estimation || estimation.client_id !== user.id) {
      return Response.json(
        { error: 'Estimation not found or unauthorized' },
        { status: 404 }
      );
    }

    // Charger le trail d'audit
    const { data: auditTrail, error: auditError } = await supabase
      .from('estimation_audit_log')
      .select('*')
      .eq('estimation_id', id)
      .order('created_at', { ascending: false });

    if (auditError) throw auditError;

    return Response.json({
      estimationId: id,
      events: auditTrail || [],
      count: auditTrail?.length || 0
    });
  } catch (error) {
    console.error('Audit trail error:', error);
    return Response.json(
      { error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}
