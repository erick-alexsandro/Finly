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

export async function GET(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession(req);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let orgId = session.session?.activeOrganizationId;
    const sessionId = session.session?.id;

    let token = await getJwtToken(sessionId);
    
    if (!token) {
      console.warn("[procedimentos GET] JWT token unavailable, using dev-mode token");
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
      return NextResponse.json(
        { error: "No active organization" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("nome")) params.append("nome", searchParams.get("nome")!);

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
    console.error("[procedimentos]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
