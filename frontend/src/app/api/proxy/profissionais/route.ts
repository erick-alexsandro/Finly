import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/proxy-helper";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("nome"))
      params.append("nome", searchParams.get("nome")!);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/profissionais?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        "X-Proxy-Secret": process.env.PROXY_SECRET || "",
        "X-User-Id": ctx.userId,
        "X-Organization-Id": ctx.orgId,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    } else {
      const errorText = await res.text();
      return NextResponse.json(
        { error: "Backend error", status: res.status, details: errorText.slice(0, 500) },
        { status: res.status },
      );
    }
  } catch (error) {
    console.error("[profissionais]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
