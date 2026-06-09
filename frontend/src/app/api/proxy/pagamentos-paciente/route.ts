import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizations } from "@/lib/db";

async function getJwtToken(sessionId: string): Promise<string | null> {
  try {
    const neonAuthUrl = process.env.NEON_AUTH_BASE_URL;
    if (!neonAuthUrl) return null;
    const response = await fetch(`${neonAuthUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.token || null;
  } catch (error) {
    console.error("[getJwtToken] Error:", error);
    return null;
  }
}

async function getSessionContext(req: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  let orgId = (session.session as any)?.activeOrganizationId;
  const sessionId = session.session?.id;

  let token = await getJwtToken(sessionId);
  if (!token) {
    console.warn("[pagamentos-paciente] JWT token unavailable, using dev-mode token");
    token = "dev-mode-token";
  }

  if (!orgId) {
    try {
      const orgs = await getOrganizations(session.user?.id);
      if (orgs.length > 0) orgId = orgs[0].id;
    } catch (dbError) {
      console.error("[pagamentos-paciente] Error fetching org:", dbError);
    }
  }

  if (!orgId) return null;
  return { orgId, token };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("pacienteId")) params.append("pacienteId", searchParams.get("pacienteId")!);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pagamento-paciente?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) return NextResponse.json(await res.json());
    return NextResponse.json({ error: "Backend error" }, { status: res.status });
  } catch (error) {
    console.error("[pagamentos-paciente GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pagamento-paciente`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[pagamentos-paciente POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getSessionContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pagamento-paciente/${id}`;

    const res = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[pagamentos-paciente PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getSessionContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pagamento-paciente/${id}`;

    const res = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) return NextResponse.json(null, { status: 204 });
    return NextResponse.json({ error: "Backend error" }, { status: res.status });
  } catch (error) {
    console.error("[pagamentos-paciente DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
