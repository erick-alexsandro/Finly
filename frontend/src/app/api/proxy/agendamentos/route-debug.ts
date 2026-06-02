import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession(req);

    // === COMPREHENSIVE DEBUGGING ===
    console.log("=== SESSION DEBUG ===");
    console.log("Full session object:", JSON.stringify(session, null, 2));
    console.log("session.session type:", typeof session?.session);
    console.log("session.user type:", typeof session?.user);
    
    if (session?.session) {
      console.log("Keys in session.session:", Object.keys(session.session));
      console.log("session.session:", session.session);
    }
    if (session?.user) {
      console.log("Keys in session.user:", Object.keys(session.user));
      console.log("session.user:", session.user);
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to find org ID - check EVERY possible location
    const orgId = 
      (session?.session as any)?.activeOrganizationId ||
      (session?.session as any)?.active_organization_id ||
      (session?.session as any)?.organizationId ||
      (session?.session as any)?.organization_id ||
      (session?.user as any)?.activeOrganizationId ||
      (session?.user as any)?.active_organization_id ||
      (session?.user as any)?.organizationId ||
      (session?.user as any)?.organization_id ||
      (session as any)?.activeOrganizationId ||
      (session as any)?.active_organization_id ||
      null;

    const token = (session?.session as any)?.token;

    console.log("[GET] OrgId candidates:", {
      'session.session?.activeOrganizationId': (session?.session as any)?.activeOrganizationId,
      'session.session?.organizationId': (session?.session as any)?.organizationId,
      'session.user?.activeOrganizationId': (session?.user as any)?.activeOrganizationId,
      'session.user?.organizationId': (session?.user as any)?.organizationId,
      'Result orgId': orgId,
    });

    console.log("[GET] Token:", token ? "✓" : "✗");
    console.log("[GET] User ID:", session.user?.id);

    if (!token) {
      console.error("[GET] No token");
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    if (!orgId) {
      console.error("[GET] No org ID - full session dump:", JSON.stringify(session, null, 2));
      return NextResponse.json(
        { error: "No active organization - full session:" + JSON.stringify(session, null, 2).slice(0, 200) },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("doctor")) params.append("doctor", searchParams.get("doctor")!);
    if (searchParams.get("patient")) params.append("patient", searchParams.get("patient")!);
    if (searchParams.get("startDate")) params.append("startDate", searchParams.get("startDate")!);
    if (searchParams.get("endDate")) params.append("endDate", searchParams.get("endDate")!);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/agendamentos?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Organization-Id": orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    } else {
      const errorText = await res.text();
      console.error(`Backend error (${res.status}):`, errorText);
      return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[GET] Exception:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession(req);

    const orgId = 
      (session?.session as any)?.activeOrganizationId ||
      (session?.session as any)?.organizationId ||
      (session?.user as any)?.activeOrganizationId ||
      (session?.user as any)?.organizationId ||
      (session as any)?.activeOrganizationId ||
      null;

    const token = (session?.session as any)?.token;

    console.log("[POST] User:", session?.user?.id, "OrgId:", orgId, "Token:", token ? "✓" : "✗");

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    if (!orgId) {
      console.error("[POST] No org ID found");
      return NextResponse.json({ error: "No active organization" }, { status: 403 });
    }

    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/agendamentos`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Organization-Id": orgId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: "Backend error", status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[POST] Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
