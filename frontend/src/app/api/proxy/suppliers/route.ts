import { NextRequest, NextResponse } from "next/server";

const NEON_AUTH_URL = process.env.NEON_AUTH_BASE_URL || "";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

async function getSessionAndToken(req: NextRequest) {
  const cookie = req.cookies.get("__Secure-neon-auth.session_token")?.value;
  if (!cookie) return null;

  let token = "dev-mode-token";
  try {
    const res = await fetch(`${NEON_AUTH_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: cookie }),
    });
    if (res.ok) {
      const data = await res.json();
      token = data?.token || token;
    }
  } catch {}

  return { token, orgId: "org-dev-test" };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionAndToken(req);
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
    const ctx = await getSessionAndToken(req);
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
    const ctx = await getSessionAndToken(req);
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
    const ctx = await getSessionAndToken(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing supplier ID" }, { status: 400 });

    const res = await fetch(`${BACKEND_URL}/api/suppliers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ctx.token}`, "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
    });

    if (res.ok || res.status === 204) return NextResponse.json({}, { status: 204 });
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
