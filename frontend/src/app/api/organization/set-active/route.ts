import { auth } from '@/lib/auth/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orgId = body?.organizationId ?? body?.organization_id ?? body?.id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Missing organizationId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if ((auth as any).organization && typeof (auth as any).organization.setActive === 'function') {
      const result = await (auth as any).organization.setActive({ organizationId: orgId });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Organization setActive not supported on server' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[Organization set-active]', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
