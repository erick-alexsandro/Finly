import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrganizations } from "@/lib/db";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

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
    console.warn("[suppliers] JWT token unavailable, using dev-mode token");
    token = "dev-mode-token";
  }

  if (!orgId) {
    try {
      const orgs = await getOrganizations(session.user?.id);
      if (orgs.length > 0) orgId = orgs[0].id;
    } catch (dbError) {
      console.error("[suppliers] Error fetching org:", dbError);
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
    if (searchParams.get("nome")) params.append("nome", searchParams.get("nome")!);
    if (searchParams.get("status")) params.append("status", searchParams.get("status")!);

    const res = await fetch(`${BACKEND_URL}/api/suppliers?${params}`, {
      headers: { Authorization: `Bearer ${ctx.token}`, "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/suppliers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.token}`, "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getSessionContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing supplier ID" }, { status: 400 });

    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/suppliers/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${ctx.token}`, "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getSessionContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing supplier ID" }, { status: 400 });

    const res = await fetch(`${BACKEND_URL}/api/suppliers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ctx.token}`, "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
    });

    if (res.ok || res.status === 204) return new NextResponse(null, { status: 204 });
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

