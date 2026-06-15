import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/proxy-helper";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);

    if (searchParams.get("movimentos") !== null) {
      const params = new URLSearchParams();
      if (searchParams.get("produtoId")) params.append("produtoId", searchParams.get("produtoId")!);
      const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/movimentos?${params}`;
      const res = await fetch(backendUrl, {
        headers: { "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
      });
      if (res.ok) return NextResponse.json(await res.json());
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }

    const params = new URLSearchParams();
    if (searchParams.get("name")) params.append("name", searchParams.get("name")!);
    if (searchParams.get("id")) {
      const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/produtos/${searchParams.get("id")}`;
      const res = await fetch(backendUrl, {
        headers: { "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
      });
      if (res.ok) return NextResponse.json(await res.json());
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/produtos?${params}`;
    const res = await fetch(backendUrl, {
      headers: { "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
    });
    if (res.ok) return NextResponse.json(await res.json());
    return NextResponse.json({ error: "Backend error" }, { status: res.status });
  } catch (error) {
    console.error("[produtos GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    const body = await req.json();

    let backendUrl: string;
    if (action === "repor-estoque" && id) {
      backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/produtos/${id}/repor-estoque`;
    } else {
      backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/produtos`;
    }

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: { "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[produtos POST]", error);
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
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/produtos/${id}`;

    const res = await fetch(backendUrl, {
      method: "PUT",
      headers: { "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
    const errorText = await res.text();
    return NextResponse.json({ error: "Backend error", details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[produtos PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/produtos/${id}`;

    const res = await fetch(backendUrl, {
      method: "DELETE",
      headers: { "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId, "Content-Type": "application/json" },
    });
    if (res.ok || res.status === 204) return new NextResponse(null, { status: 204 });
    const errorText = await res.text();
    console.error(`[produtos DELETE] Backend returned ${res.status}: ${errorText.slice(0, 500)}`);
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[produtos DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

