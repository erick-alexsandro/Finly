/**
 * GET /api/user
 *
 * Returns the current authenticated user together with their active Neon Auth
 * organization (clinic).  The Navbar and other client components use this
 * route to display the user name and the clinic they are logged into.
 *
 * Response shape:
 * {
 *   user: { id, email, name, ... },
 *   clinic: { id: string, name: string } | null,
 *   clinics: Array<{ id: string, name: string }>
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getOrganizations } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // getSession() is the server-side call provided by @neondatabase/auth
    const { data: session } = await auth.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ user: null, clinic: null, clinics: [] });
    }

    console.log('[/api/user] User ID:', user.id);

    // ─────────────────────────────────────────────────────────────────────
    // Query organizations from the database
    // Neon Auth stores organizations in the "organization" table
    // ─────────────────────────────────────────────────────────────────────
    let clinics: any[] = [];
    let clinic: any = null;

    try {
      const orgs = await getOrganizations(user.id);
      
      if (orgs.length > 0) {
        clinics = orgs.map((row: any) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
        }));

        // The first organization (most recently joined) is the active one
        clinic = clinics[0];
        console.log('[/api/user] Found clinics:', clinics);
        console.log('[/api/user] Active clinic:', clinic);
      } else {
        console.log('[/api/user] No organizations found for user:', user.id);
      }
    } catch (dbError) {
      console.error('[/api/user] Error querying organizations:', dbError);
      // Continue with empty organizations list
    }

    return NextResponse.json({ user, clinic, clinics });
  } catch (error) {
    console.error('[/api/user]', error);
    return NextResponse.json({ user: null, clinic: null, clinics: [] }, { status: 500 });
  }
}