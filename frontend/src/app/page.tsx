'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            router.replace('/treatment/scheduling');
            return;
          }
        }
      } catch {
        // not logged in — show landing
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <h1 className="text-4xl font-bold">Bem-vindo a SmileCorp</h1>
      <p className="text-gray-500">Entre com o seu usuário e senha para acessar a plataforma</p>

      <div className="flex gap-4">
        <Link href="/auth/sign-in">
          <Button size="lg">Entrar</Button>
        </Link>
      </div>
    </div>
  );
}
