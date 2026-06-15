import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from "@/lib/proxy-helper";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = ctx;
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    const nome = searchParams.get("nome");
    const categoria = searchParams.get("categoria");
    const especialidade = searchParams.get("especialidade");
    const ativo = searchParams.get("ativo");

    if (nome) params.append("nome", nome);
    if (categoria) params.append("categoria", categoria);
    if (especialidade) params.append("especialidade", especialidade);
    if (ativo) params.append("ativo", ativo);

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos?${params}`;

    const res = await fetch(backendUrl, {
      headers: {
        'X-Proxy-Secret': process.env.PROXY_SECRET || '',
        'X-User-Id': ctx.userId,
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
    console.error("[procedimentos GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = ctx;
    const body = await req.json();

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'X-Proxy-Secret': process.env.PROXY_SECRET || '',
        'X-User-Id': ctx.userId,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 201) {
      return NextResponse.json(await res.json(), { status: 201 });
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Backend error', status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[procedimentos POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = ctx;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const body = await req.json();

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos/${id}`;

    const res = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'X-Proxy-Secret': process.env.PROXY_SECRET || '',
        'X-User-Id': ctx.userId,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Backend error', status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[procedimentos PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = ctx;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const backendUrl = `${process.env.BACKEND_URL || "http://localhost:8080"}/api/procedimentos/${id}`;

    const res = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'X-Proxy-Secret': process.env.PROXY_SECRET || '',
        'X-User-Id': ctx.userId,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok || res.status === 204) {
      return new NextResponse(null, { status: 204 });
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: 'Backend error', status: res.status, details: errorText.slice(0, 500) }, { status: res.status });
    }
  } catch (error) {
    console.error("[procedimentos DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

