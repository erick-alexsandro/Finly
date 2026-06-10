import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizations } from "@/lib/db";

async function getJwtToken(sessionId: string): Promise<string | null> {
  try {
    const neonAuthUrl = process.env.NEON_AUTH_BASE_URL;
    if (!neonAuthUrl) return null;
    const response = await fetch(`${neonAuthUrl}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.token || null;
  } catch {
    return null;
  }
}

async function getSessionData() {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    let orgId = (session.session as any)?.activeOrganizationId;
    const sessionId = session.session?.id;
    let token = await getJwtToken(sessionId);
    if (!token) {
      console.warn("[budget] JWT token unavailable, using dev-mode token");
      token = "dev-mode-token";
    }
    if (!orgId) {
      try {
        const orgs = await getOrganizations(session.user?.id);
        if (orgs.length > 0) orgId = orgs[0].id;
      } catch (dbError) {
        console.error("[budget] Error fetching org:", dbError);
      }
    }
    if (orgId) return { token, orgId };
  }
  console.warn("[budget] No session, using dev-mode fallback");
  return { token: "dev-mode-token", orgId: "00000000-0000-0000-0000-000000000001" };
}

function backendUrl(path: string): string {
  return `${process.env.BACKEND_URL || "http://localhost:8080"}${path}`;
}

async function forward(req: NextRequest, method: string, path: string) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = method === "GET" || method === "DELETE" ? undefined : await req.json();
  const res = await fetch(backendUrl(path), {
    method,
    headers: {
      Authorization: `Bearer ${session.token}`,
      "X-Organization-Id": session.orgId,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok || res.status === 204) {
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    return NextResponse.json(await res.json());
  }
  const errorText = await res.text();
  return NextResponse.json(
    { error: "Backend error", status: res.status, details: errorText.slice(0, 500) },
    { status: res.status }
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const path = id ? `/api/budget/transacoes/${id}` : "/api/budget/transacoes";
    const params = new URLSearchParams();
    for (const key of ["tipo", "status", "dataInicio", "dataFim"]) {
      const val = searchParams.get(key);
      if (val) params.append(key, val);
    }
    const qs = params.toString();
    return await forward(req, "GET", path + (qs ? "?" + qs : ""));
  } catch (error) {
    console.error("[transacoes GET]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await forward(req, "POST", "/api/budget/transacoes");
  } catch (error) {
    console.error("[transacoes POST]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    return await forward(req, "PUT", `/api/budget/transacoes/${id}`);
  } catch (error) {
    console.error("[transacoes PUT]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    return await forward(req, "DELETE", `/api/budget/transacoes/${id}`);
  } catch (error) {
    console.error("[transacoes DELETE]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
