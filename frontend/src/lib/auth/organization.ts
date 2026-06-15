/**
 * organization.ts
 *
 * Helpers for Neon Auth organizations using the correct better-auth APIs.
 *
 * Neon Auth is built on better-auth with the organization plugin.
 * The verified API shapes (from @neondatabase/auth type definitions):
 *
 *   authClient.getSession() → { data: { session: { activeOrganizationId }, user } }
 *   authClient.token()      → { data: { token: string } }  (the JWT)
 *   authClient.organization.setActive({ organizationId })
 *   authClient.organization.list()  → { data: Organization[] }
 *   authClient.organization.create({ name, slug })
 *   authClient.organization.inviteMember({ email, role, organizationId })
 *   authClient.useActiveOrganization()  (React hook → { data: { id, name, members } })
 *   authClient.useListOrganizations()   (React hook → { data: Organization[] })
 */

'use client';

import { authClient } from './client';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
}

/**
 * Returns the active organization ID from the Neon Auth session.
 * Shape: data.session.activeOrganizationId (better-auth org plugin).
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  try {
    const result = await authClient.getSession();
    return (result as any)?.data?.session?.activeOrganizationId ?? null;
  } catch {
    return null;
  }
}

/**
 * Sets the active organization using the better-auth organization plugin.
 */
export async function setActiveOrganization(orgId: string): Promise<void> {
  try {
    await authClient.organization.setActive({ organizationId: orgId });
  } catch (e) {
    console.error('[SmileCorp] setActiveOrganization failed:', e);
  }
}

/**
 * Lists all organizations the current user belongs to.
 * Uses authClient.organization.list() → { data: Organization[] }
 */
export async function listOrganizations(): Promise<Organization[]> {
  try {
    const result = await (authClient as any).organization.list();
    const items: any[] = result?.data ?? [];
    if (!Array.isArray(items)) return [];
    return items.map((o: any) => ({ id: o.id, name: o.name ?? '', slug: o.slug }));
  } catch {
    return [];
  }
}

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.OWNER]: 'Dono',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.DOCTOR]: 'Dentista',
  [ROLES.RECEPTIONIST]: 'Recepcionista',
};

export const ROLE_OPTIONS = [
  { value: ROLES.OWNER, label: ROLE_LABELS[ROLES.OWNER], description: 'Acesso total — apenas Dono pode atribuir' },
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN], description: 'Acesso total à clínica' },
  { value: ROLES.DOCTOR, label: ROLE_LABELS[ROLES.DOCTOR], description: 'Acesso a agendamentos e pacientes' },
  { value: ROLES.RECEPTIONIST, label: ROLE_LABELS[ROLES.RECEPTIONIST], description: 'Acesso limitado à recepção' },
];

export function canManageRoles(role?: string | null): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}

export function isOwnerOrAdmin(role?: string | null): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}

export function getRoleVariant(role?: string | null): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case ROLES.OWNER: return 'default';
    case ROLES.ADMIN: return 'default';
    case ROLES.DOCTOR: return 'secondary';
    case ROLES.RECEPTIONIST: return 'outline';
    default: return 'secondary';
  }
}

export function getRoleBadgeClass(role?: string | null): string {
  switch (role) {
    case ROLES.OWNER: return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
    case ROLES.ADMIN: return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
    case ROLES.DOCTOR: return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    case ROLES.RECEPTIONIST: return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
    default: return '';
  }
}

export async function getCurrentUserRole(_orgId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/user');
    if (!res.ok) return null;
    const data = await res.json();
    return data.role ?? null;
  } catch {
    return null;
  }
}

export async function removeMember(orgId: string, memberId: string): Promise<void> {
  await (authClient as any).organization.removeMember({
    organizationId: orgId,
    memberIdOrEmail: memberId,
  });
}

export async function updateMemberRole(orgId: string, memberId: string, role: string): Promise<void> {
  await (authClient as any).organization.updateMemberRole({
    organizationId: orgId,
    memberId,
    role,
  });
}