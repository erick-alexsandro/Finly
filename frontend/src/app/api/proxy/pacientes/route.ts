import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/proxy-helper";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("nome")) params.append("nome", searchParams.get("nome")!);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pacientes?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[pacientes GET]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pacientes`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    console.error(`Backend error (${res.status}):`, errorText);
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[pacientes POST]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pacientes/${id}`;

    const res = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[pacientes PUT]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/pacientes/${id}`;

    const res = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok || res.status === 204) return new NextResponse(null, { status: 204 });
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[pacientes DELETE]", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
