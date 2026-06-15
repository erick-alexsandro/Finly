import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/proxy-helper";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("pacienteId")) params.append("pacienteId", searchParams.get("pacienteId")!);
    if (searchParams.get("agendamentoId")) params.append("agendamentoId", searchParams.get("agendamentoId")!);
    if (searchParams.get("exists")) params.append("exists", searchParams.get("exists")!);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/prontuarios?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) return NextResponse.json(await res.json());
    if (res.status === 404) return NextResponse.json(null, { status: 404 });
    return NextResponse.json({ error: "Backend error" }, { status: res.status });
  } catch (error) {
    console.error("[prontuarios GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/prontuarios`;

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
    return NextResponse.json({ error: "Backend error", details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[prontuarios POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/prontuarios/${id}`;

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
    return NextResponse.json({ error: "Backend error", details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[prontuarios PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
