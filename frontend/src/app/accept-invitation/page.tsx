'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'signup' | 'signing' | 'done' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  const id = searchParams.get('id');

  useEffect(() => {
    if (!id) {
      setStatus('error');
      setErrorMsg('Link de convite inválido (ID não encontrado).');
      return;
    }
    setInviteId(id);

    const check = async () => {
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        setStatus('signup');
        return;
      }
      await accept(id);
    };
    check();
  }, [router, searchParams, id]);

  const accept = async (invitationId: string) => {
    setStatus('signing');
    const res = await fetch('/api/accept-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId }),
    });
    const json = await res.json();

    if (!res.ok) {
      setStatus('error');
      setErrorMsg(json.error || 'Erro ao aceitar convite.');
      return;
    }

    setStatus('done');
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  const handleSignUpAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!inviteId) return;
    setIsPending(true);

    try {
      const signUpResult = await authClient.signUp.email({ email, password, name });
      if (signUpResult.error) {
        setErrorMsg(signUpResult.error.message || 'Erro ao criar conta.');
        setIsPending(false);
        return;
      }
      await accept(inviteId);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erro inesperado.');
      setIsPending(false);
    }
  };

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Verificando convite...</p>
      </main>
    );
  }

  if (status === 'signup') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Você foi convidado!</CardTitle>
              <CardDescription>Crie uma conta para aceitar o convite</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUpAndAccept} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
                </div>
                {errorMsg && (
                  <p className="text-sm text-destructive">{errorMsg}</p>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Criando conta…' : 'Criar conta e aceitar convite'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href={`/auth/sign-in?callbackURL=${encodeURIComponent(`/accept-invitation?id=${id}`)}`} className="font-medium underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (status === 'signing') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Aceitando convite...</p>
      </main>
    );
  }

  if (status === 'done') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-green-600">Convite aceito!</p>
          <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-red-600">Erro</p>
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </main>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
