import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { email, role, organizationId: bodyOrgId } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email e role são obrigatórios' }, { status: 400 });
    }

    const organizationId = bodyOrgId || (session.session as any).activeOrganizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Nenhuma organização ativa' }, { status: 400 });
    }

    const memberResult = await query(
      `SELECT role FROM neon_auth.member WHERE "userId" = $1 AND "organizationId" = $2`,
      [session.user.id, organizationId]
    );

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Você não é membro desta organização' }, { status: 403 });
    }

    const inviterRole = memberResult.rows[0].role;
    if (inviterRole !== 'owner' && inviterRole !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão para convidar' }, { status: 403 });
    }
    if (role === 'owner' && inviterRole !== 'owner') {
      return NextResponse.json({ error: 'Apenas o Dono pode convidar outro Dono' }, { status: 403 });
    }

    const existingUser = await query(
      `SELECT u.id FROM neon_auth.user u WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const existingMembership = await query(
        `SELECT id FROM neon_auth.member WHERE "userId" = $1`,
        [existingUser.rows[0].id]
      );
      if (existingMembership.rows.length > 0) {
        return NextResponse.json(
          { error: `${email} já é membro de outra clínica.` },
          { status: 409 }
        );
      }
    }

    const existing = await query(
      `SELECT id, status FROM neon_auth.invitation WHERE "email" = $1 AND "organizationId" = $2 AND "status" = 'pending' AND "expiresAt" > NOW()`,
      [email.toLowerCase(), organizationId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({
        data: existing.rows[0],
        message: 'Já existe um convite pendente para este email'
      });
    }

    const crypto = await import('node:crypto');
    const id = crypto.randomUUID();

    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);

    await query(
      `INSERT INTO neon_auth.invitation (id, "organizationId", email, role, status, "inviterId", "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW())`,
      [id, organizationId, email.toLowerCase(), role, session.user.id, expiresAt]
    );

    return NextResponse.json({
      data: {
        id,
        email: email.toLowerCase(),
        role,
        organizationId,
        inviterId: session.user.id,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('[api/invite] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
