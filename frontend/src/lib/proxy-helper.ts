import { auth } from "@/lib/auth/server";
import { getOrganizations } from "@/lib/db";

export async function getSessionContext() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  const userId = session.user.id;
  let orgId = (session.session as any)?.activeOrganizationId;

  if (!orgId) {
    try {
      const orgs = await getOrganizations(session.user?.id);
      if (orgs.length > 0) orgId = orgs[0].id;
    } catch (dbError) {
      console.error("[proxy] Error fetching org:", dbError);
    }
  }

  if (!orgId) return null;
  return { orgId, userId };
}
