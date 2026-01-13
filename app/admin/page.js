'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/shared';
import { withAdminAuth } from '@/lib/guards';
import { createClient } from '@/lib/supabase/client';

function AdminPage() {
  const [stats, setStats] = useState({
    properties: 0,
    bookings: 0,
    requests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get org
        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single();

        if (!orgMember) return;

        // Get properties count
        const { count: propertiesCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgMember.org_id);

        // Get bookings count
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgMember.org_id);

        // Get booking requests count
        const { count: requestsCount } = await supabase
          .from('booking_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setStats({
          properties: propertiesCount || 0,
          bookings: bookingsCount || 0,
          requests: requestsCount || 0,
        });
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <AdminHeader />

      <div className="page-container">
        <div className="container">
          <h1>Tableau de bord Admin</h1>

          {/* LINK TO NEW DASHBOARD */}
          <div style={{ background: '#dbeafe', border: '2px solid #3b82f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <p style={{ margin: 0, color: '#1e40af' }}>
              ✨ Nouvelle vue: <Link href="/admin/dashboard" style={{ fontWeight: 'bold', color: '#1d4ed8', textDecoration: 'underline' }}>Accéder au Dashboard Complet</Link>
            </p>
          </div>

          {loading ? (
            <div>Chargement...</div>
          ) : (
            <>
              <div className="admin-nav">
                <Link href="/admin/logements" className="admin-card">
                  <h3>{stats.properties}</h3>
                  <p>Logements</p>
                </Link>
                <Link href="/admin/reservations" className="admin-card">
                  <h3>{stats.bookings}</h3>
                  <p>Réservations</p>
                </Link>
                <Link href="/admin/reservations" className="admin-card">
                  <h3>{stats.requests}</h3>
                  <p>Demandes en attente</p>
                </Link>
              </div>

              <div style={{ marginTop: '3rem' }}>
                <h2>Actions rapides</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <Link href="/admin/logements/new" className="btn-primary">
                    Ajouter un logement
                  </Link>
                  <Link href="/admin/logements" className="btn-secondary">
                    Gérer les logements
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// TEMPORARY: Allow access without auth for demo/development
// In production, use: export default withAdminAuth(AdminPage);
export default AdminPage;
