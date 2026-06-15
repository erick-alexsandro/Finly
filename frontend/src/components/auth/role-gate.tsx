'use client';

import { useState, useEffect, ReactNode } from 'react';
import { canManageRoles, ROLES, Role, ROLE_LABELS } from '@/lib/auth/organization';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallback?: ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setRole(data.role ?? null);
        }
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;

  if (!allowedRoles) {
    return <>{children}</>;
  }

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface RoleBasedNavProps {
  children: ReactNode;
}

export function AdminOrOwnerOnly({ children }: RoleBasedNavProps) {
  return (
    <RoleGate allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
      {children}
    </RoleGate>
  );
}

export function NotReceptionist({ children }: RoleBasedNavProps) {
  return (
    <RoleGate allowedRoles={[ROLES.OWNER, ROLES.ADMIN, ROLES.DOCTOR]}>
      {children}
    </RoleGate>
  );
}

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setRole(data.role ?? null);
        }
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { role, loading, canManage: canManageRoles(role) };
}
