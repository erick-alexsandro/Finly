'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clinicName.trim()) {
      setError('O nome da clínica é obrigatório.');
      return;
    }

    setIsPending(true);

    try {
      // 1. Create the user account
      const signUpResult = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (signUpResult.error) {
        setError(signUpResult.error.message || 'Erro ao criar conta.');
        return;
      }

      // 2. Create the clinic (organization) — the user is now signed in
      const slug = clinicName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      let orgId: string | null = null;

      try {
        const orgResult = await (authClient as any).organization.create({
          name: clinicName.trim(),
          slug: slug || 'clinica',
        });
        // Normalize response shape
        const orgData = orgResult?.data ?? orgResult ?? null;
        orgId =
          orgData?.id ??
          orgData?.organization?.id ??
          orgData?.team?.id ??
          null;
      } catch (orgErr: any) {
        console.warn('[SignUp] organization.create failed, trying team creation:', orgErr);
        // Fallback: some Stack Auth versions expose team creation differently
        try {
          const userRes = await (authClient as any).getUser?.();
          const user = userRes?.data ?? userRes;
          const teamResult = await user?.createTeam?.({
            displayName: clinicName.trim(),
            urlSlug: slug || 'clinica',
          });
          orgId = teamResult?.id ?? teamResult?.data?.id ?? null;
        } catch (teamErr) {
          console.warn('[SignUp] team creation fallback also failed:', teamErr);
        }
      }

      // 3. Set the new clinic as the active organization
      if (orgId) {
        try {
          await (authClient as any).organization?.setActive?.({ organizationId: orgId });
          console.log('[SignUp] Organization set as active:', orgId);
          
          // Refresh session to ensure the active organization is in the session
          if (typeof (authClient as any).getSession === 'function') {
            await (authClient as any).getSession();
          }
        } catch (setActiveErr) {
          console.warn('[SignUp] setActive failed:', setActiveErr);
        }
      }

      // 4. Redirect to the app
      router.replace('/');
    } catch (e: any) {
      setError(e?.message || 'Erro inesperado. Tente novamente.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src="/logo.svg" width={40} height={40} alt="SmileCorp logo" />
          </div>
          <span className="text-xl font-semibold tracking-tight">SmileCorp</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Criar conta</CardTitle>
            <CardDescription>
              Crie sua conta e registre a clínica que você gerencia
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clinicName">
                  Nome da clínica <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clinicName"
                  type="text"
                  placeholder="Ex: Clínica Sorriso"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Todos os dados cadastrados ficarão vinculados a esta clínica.
                </p>
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Criando conta…' : 'Criar conta'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            Já tem uma conta?&nbsp;
            <Link
              href="/auth/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}