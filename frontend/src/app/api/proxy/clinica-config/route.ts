import { auth } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizations } from '@/lib/db';

async function getJwtToken(sessionId: string): Promise<string | null> {
  try {
    const neonAuthUrl = process.env.NEON_AUTH_BASE_URL;
    if (!neonAuthUrl) return null;
    const res = await fetch(`${neonAuthUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.token || null;
  } catch { return null; }
}

async function resolveSession(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return { error: "Unauthorized", status: 401 };
    let orgId = (session.session as any)?.activeOrganizationId;
    const sessionId = session.session?.id;
    let token = await getJwtToken(sessionId);
    if (!token) { token = "dev-mode-token"; }
    if (!orgId) {
      try {
        const orgs = await getOrganizations(session.user?.id);
        if (orgs.length > 0) orgId = orgs[0].id;
      } catch {}
    }
    if (!orgId) return { error: "No active organization", status: 403 };
    return { orgId, token };
  } catch {
    return { error: "Internal server error", status: 500 };
  }
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveSession(req);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    const { orgId, token } = resolved;
    const { searchParams } = new URL(req.url);
    const chave = searchParams.get("chave");
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/config${chave ? '/' + chave : ''}`;
    const res = await fetch(backendUrl, {
      headers: { 'Authorization': `Bearer ${token}`, 'X-Organization-Id': orgId, 'Content-Type': 'application/json' },
    });
    if (res.ok) return NextResponse.json(await res.json());
    const err = await res.text();
    return NextResponse.json({ error: 'Backend error', details: err.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[clinica-config GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const resolved = await resolveSession(req);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    const { orgId, token } = resolved;
    const { searchParams } = new URL(req.url);
    const chave = searchParams.get("chave");
    if (!chave) return NextResponse.json({ error: "Missing chave parameter" }, { status: 400 });
    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/config/${chave}`;
    const res = await fetch(backendUrl, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'X-Organization-Id': orgId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
    const err = await res.text();
    return NextResponse.json({ error: 'Backend error', details: err.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[clinica-config PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
