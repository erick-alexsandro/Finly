import { auth } from '@/lib/auth/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body?.name;
    if (!name) {
      return new Response(JSON.stringify({ error: 'Missing organization name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Preferred: server-side organization API exposed by the auth library
    if ((auth as any).organization && typeof (auth as any).organization.create === 'function') {
      const created = await (auth as any).organization.create({ name });
      return new Response(JSON.stringify(created), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback: try creating a team via the server-side user object
    if (typeof (auth as any).getUser === 'function') {
      const { data: user } = await (auth as any).getUser();
      if (user?.createTeam && typeof user.createTeam === 'function') {
        const created = await user.createTeam({ displayName: name, urlSlug: name.toLowerCase().replace(/\s+/g, '-') });
        return new Response(JSON.stringify(created), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Organization creation not supported by server auth client' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[Organization create]', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
