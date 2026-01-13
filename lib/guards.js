'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ADMIN_DEV_MODE } from '@/lib/devMode';

// Guard for authenticated users
export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
      const checkAuth = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);
        setLoading(false);
      };

      checkAuth();
    }, [router]);

    if (loading) {
      return <div>Chargement...</div>;
    }

    return <Component {...props} user={user} />;
  };
}

// Guard for admin users
export function withAdminAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isDevMode, setIsDevMode] = useState(false);

    useEffect(() => {
      const checkAdminAuth = async () => {
        // En mode dev, bypass complètement l'authentification
        if (ADMIN_DEV_MODE) {
          setIsDevMode(true);
          setUser({ id: 'dev-user', email: 'dev@mode' });
          setRole('admin');
          setLoading(false);
          return;
        }

        // Mode production : vérifier l'authentification
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/admin/login');
          return;
        }

        // Check if user is admin
        const { data: orgMember } = await supabase
          .from('org_members')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!orgMember || orgMember.role !== 'admin') {
          router.push('/');
          return;
        }

        setUser(user);
        setRole(orgMember.role);
        setLoading(false);
      };

      checkAdminAuth();
    }, [router]);

    if (loading) {
      return <div>Chargement...</div>;
    }

    return <Component {...props} user={user} role={role} isDevMode={isDevMode} />;
  };
}
