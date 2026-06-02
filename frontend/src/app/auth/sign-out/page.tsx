"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await authClient.signOut();
      } catch (e) {
        console.warn("SignOut page: signOut failed", e);
      } finally {
        if (!mounted) return;
        try {
          router.replace("/auth/sign-in");
        } catch (e) {
          window.location.href = "/auth/sign-in";
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return <div className="flex items-center justify-center h-40">Signing out…</div>;
}
