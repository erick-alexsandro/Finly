import { auth } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizations } from '@/lib/db';

async function getJwtToken(sessionId: string): Promise<string | null> {
  try {
    const neonAuthUrl = process.env.NEON_AUTH_BASE_URL;
    if (!neonAuthUrl) {
      console.error("[getJwtToken] NEON_AUTH_BASE_URL not set");
      return null;
    }

    const response = await fetch(`${neonAuthUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      console.error("[getJwtToken] Failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data?.token || null;
  } catch (error) {
    console.error("[getJwtToken] Error:", error);
    return null;
  }
}

async function resolveSession(req: NextRequest) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  let orgId = (session.session as any)?.activeOrganizationId;
  const sessionId = session.session?.id;

  let token = await getJwtToken(sessionId);
  if (!token) {
    console.warn("[procedimentos] JWT token unavailable, using dev-mode token");
    token = "dev-mode-token";
  }

  if (!orgId) {
    try {
      const orgs = await getOrganizations(session.user?.id);
      if (orgs.length > 0) {
        orgId = orgs[0].id;
      }
    } catch (dbError) {
      console.error("[procedimentos] Error fetching org:", dbError);
    }
  }

  if (!orgId) {
    return { error: "No active organization", status: 403 };
  }

  return { orgId, token };
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveSession(req);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { orgId, token } = resolved;
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    const nome = searchParams.get("nome");
    const categoria = searchParams.get("categoria");
    const especialidade = searchParams.get("especialidade");
    const ativo = searchParams.get("ativo");

    if (nome) params.append("nome", nome);
    if (categoria) params.append("categoria", categoria);
    if (especialidade) params.append("especialidade", especialidade);
    if (ativo) params.append("ativo", ativo);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Backend error', status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[procedimentos GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveSession(req);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { orgId, token } = resolved;
    const body = await req.json();

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 201) {
      return NextResponse.json(await res.json(), { status: 201 });
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Backend error', status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[procedimentos POST]", error);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const body = await req.json();

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos/${id}`;

    const res = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Backend error', status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[procedimentos PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const resolved = await resolveSession(req);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { orgId, token } = resolved;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos/${id}`;

    const res = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok || res.status === 204) {
      return new NextResponse(null, { status: 204 });
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Backend error', status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[procedimentos DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

