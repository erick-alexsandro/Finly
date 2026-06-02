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