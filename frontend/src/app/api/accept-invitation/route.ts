import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { invitationId } = await request.json();
    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId é obrigatório' }, { status: 400 });
    }

    const invResult = await query(
      `SELECT * FROM neon_auth.invitation WHERE id = $1`,
      [invitationId]
    );

    const invitation = invResult.rows[0];
    if (!invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Convite já foi aceito ou cancelado' }, { status: 400 });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 400 });
    }

    if (invitation.email.toLowerCase() !== session.user.email!.toLowerCase()) {
      return NextResponse.json({ error: 'Este convite não é para o seu e-mail' }, { status: 403 });
    }

    const existingMember = await query(
      `SELECT id FROM neon_auth.member WHERE "userId" = $1 AND "organizationId" = $2`,
      [session.user.id, invitation.organizationId]
    );

    if (existingMember.rows.length > 0) {
      return NextResponse.json({ error: 'Você já é membro desta organização' }, { status: 400 });
    }

    const crypto = await import('node:crypto');
    const memberId = crypto.randomUUID();

    await query('UPDATE neon_auth.invitation SET status = $1 WHERE id = $2', ['accepted', invitationId]);

    await query(
      `INSERT INTO neon_auth.member (id, "organizationId", "userId", role, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [memberId, invitation.organizationId, session.user.id, invitation.role]
    );

    return NextResponse.json({
      data: { member: { id: memberId, organizationId: invitation.organizationId, userId: session.user.id, role: invitation.role } }
    });
  } catch (error: any) {
    console.error('[api/accept-invitation] Error:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
