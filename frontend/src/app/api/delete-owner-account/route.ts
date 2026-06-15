import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Find the organization where this user is owner
    const orgResult = await query(
      `SELECT o.id, o.name FROM neon_auth.organization o
       INNER JOIN neon_auth.member m ON o.id = m."organizationId"
       WHERE m."userId" = $1 AND m.role = 'owner'`,
      [user.id]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Você não é o Dono de nenhuma clínica.' }, { status: 403 });
    }

    const org = orgResult.rows[0];

    // Delete invitations, members, then the organization
    await query(`DELETE FROM neon_auth.invitation WHERE "organizationId" = $1`, [org.id]);
    await query(`DELETE FROM neon_auth.member WHERE "organizationId" = $1`, [org.id]);
    await query(`DELETE FROM neon_auth.organization WHERE id = $1`, [org.id]);

    // Forward delete-user to Neon Auth
    const baseUrl = process.env.NEON_AUTH_BASE_URL!;
    const cookieHeader = request.headers.get('cookie') || '';

    const res = await fetch(`${baseUrl}/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ callbackURL: '/' }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[/api/delete-owner-account] Neon Auth delete-user failed:', body);
      return NextResponse.json(
        { error: body.message || body.error || 'Erro ao excluir conta' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, clinicDeleted: true, clinicName: org.name });
  } catch (error: any) {
    console.error('[/api/delete-owner-account]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
