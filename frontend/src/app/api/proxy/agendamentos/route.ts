import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/proxy-helper";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("startDate")) params.append("startDate", searchParams.get("startDate")!);
    if (searchParams.get("endDate")) params.append("endDate", searchParams.get("endDate")!);
    if (searchParams.get("pacienteId")) params.append("pacienteId", searchParams.get("pacienteId")!);
    if (searchParams.get("profissionalId")) params.append("profissionalId", searchParams.get("profissionalId")!);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/agendamentos?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) return NextResponse.json(await res.json());
    return NextResponse.json({ error: "Backend error" }, { status: res.status });
  } catch (error) {
    console.error("[agendamentos GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let orgId = (session.session as any)?.activeOrganizationId;
    const sessionId = session.session?.id;

    let token = await getJwtToken(sessionId);
    if (!token) {
      token = "dev-mode-token";
    }

    if (!orgId) {
      try {
        const orgs = await getOrganizations(session.user?.id);
        if (orgs.length > 0) orgId = orgs[0].id;
      } catch (dbError) {
        console.error("[agendamentos DELETE] Error fetching org:", dbError);
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/agendamentos/${id}`;

    const res = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Organization-Id": orgId,
      },
    });

    if (res.ok || res.status === 204) {
      return NextResponse.json({ success: true }, { status: 204 });
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[agendamentos DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/agendamentos`;

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
    return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
  } catch (error) {
    console.error("[agendamentos POST]", error);
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
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/agendamentos/${id}`;

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
    console.error("[agendamentos PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
