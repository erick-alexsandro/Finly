'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import { getActiveOrganizationId } from '@/lib/auth/organization';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Building2, Mail, Copy, Check, Users } from 'lucide-react';

interface Member {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function EquipePage() {
  const [clinicName, setClinicName] = useState<string>('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Load clinic / org info ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setClinicName(data.clinic?.name ?? '');
        }

        const id = await getActiveOrganizationId();
        setOrgId(id);

        if (id) await loadMembers(id);
      } catch (e) {
        console.error('[Equipe] init error', e);
      } finally {
        setIsLoadingMembers(false);
      }
    })();
  }, []);

  // ── Load members ───────────────────────────────────────────────────────────
  const loadMembers = async (id: string) => {
    try {
      // Try organization.listMembers (better-auth org plugin)
      if (typeof (authClient as any).organization?.listMembers === 'function') {
        const res = await (authClient as any).organization.listMembers({ organizationId: id });
        const list = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setMembers(
            list.map((m: any) => ({
              id: m.id ?? m.userId,
              name: m.user?.name ?? m.name,
              email: m.user?.email ?? m.email,
              role: m.role,
            }))
          );
          return;
        }
      }

      // Fallback: Stack Auth team members
      if (typeof (authClient as any).getUser === 'function') {
        const { data: user } = await (authClient as any).getUser?.() ?? {};
        const teamsRes = await user?.listTeams?.();
        const teams = Array.isArray(teamsRes) ? teamsRes : teamsRes?.data ?? [];
        const team = teams.find((t: any) => t.id === id);
        const membersRes = await team?.listMembers?.();
        const mList = Array.isArray(membersRes) ? membersRes : membersRes?.data ?? [];
        setMembers(
          mList.map((m: any) => ({
            id: m.userId ?? m.id,
            name: m.user?.displayName ?? m.displayName ?? m.name,
            email: m.user?.primaryEmail ?? m.email,
            role: m.teamRole ?? m.role,
          }))
        );
      }
    } catch (e) {
      console.warn('[Equipe] loadMembers error', e);
    }
  };

  // ── Send invite by email ───────────────────────────────────────────────────
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !orgId) return;
    setFeedback(null);
    setIsSendingInvite(true);

    try {
      // Try better-auth organization.inviteUser
      if (typeof (authClient as any).organization?.inviteUser === 'function') {
        const { error } = await (authClient as any).organization.inviteUser({
          organizationId: orgId,
          email: inviteEmail.trim(),
          role: 'member',
        });
        if (error) throw new Error(error.message ?? JSON.stringify(error));
        setFeedback({ type: 'success', message: `Convite enviado para ${inviteEmail}!` });
        setInviteEmail('');
        return;
      }

      // Fallback: Stack Auth team invitation
      if (typeof (authClient as any).getUser === 'function') {
        const { data: user } = await (authClient as any).getUser?.() ?? {};
        const teamsRes = await user?.listTeams?.();
        const teams = Array.isArray(teamsRes) ? teamsRes : teamsRes?.data ?? [];
        const team = teams.find((t: any) => t.id === orgId);
        await team?.inviteUser?.({ email: inviteEmail.trim(), role: 'member' });
        setFeedback({ type: 'success', message: `Convite enviado para ${inviteEmail}!` });
        setInviteEmail('');
        return;
      }

      throw new Error('Envio de convite não suportado. Use o link de convite abaixo.');
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Erro ao enviar convite.' });
    } finally {
      setIsSendingInvite(false);
    }
  };

  // ── Generate invite link ───────────────────────────────────────────────────
  const handleGenerateLink = async () => {
    if (!orgId) return;
    setFeedback(null);
    setIsGeneratingLink(true);

    try {
      // better-auth
      if (typeof (authClient as any).organization?.createInvitation === 'function') {
        const res = await (authClient as any).organization.createInvitation({
          organizationId: orgId,
          role: 'member',
        });
        const link =
          res?.data?.invitationLink ??
          res?.invitationLink ??
          res?.data?.url ??
          res?.url ??
          null;
        if (link) { setInviteLink(link); return; }
      }

      // Stack Auth
      if (typeof (authClient as any).getUser === 'function') {
        const { data: user } = await (authClient as any).getUser?.() ?? {};
        const teamsRes = await user?.listTeams?.();
        const teams = Array.isArray(teamsRes) ? teamsRes : teamsRes?.data ?? [];
        const team = teams.find((t: any) => t.id === orgId);
        const linkRes = await team?.createInvitationLink?.();
        const link = linkRes?.url ?? linkRes?.invitationLink ?? linkRes?.data?.url ?? null;
        if (link) { setInviteLink(link); return; }
      }

      throw new Error('Geração de link não suportada. Use o campo de e-mail para convidar.');
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Erro ao gerar link de convite.' });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-3xl">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Equipe</h2>
        <p className="text-muted-foreground italic text-sm mt-1">
          Gerencie os membros que têm acesso à sua clínica
        </p>
      </div>

      {/* Clinic info */}
      {clinicName && (
        <div className="flex items-center gap-2 rounded-lg border bg-accent/30 px-4 py-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{clinicName}</span>
          <Badge variant="secondary" className="ml-auto text-xs">Sua clínica</Badge>
        </div>
      )}

      {/* Invite by email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" /> Convidar membro por e-mail
          </CardTitle>
          <CardDescription>
            O convidado receberá um e-mail para criar a conta e já entrará na sua clínica automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="inviteEmail" className="sr-only">E-mail do convidado</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSendingInvite || !orgId}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              {isSendingInvite ? 'Enviando…' : 'Convidar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invite link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Copy className="h-4 w-4" /> Link de convite
          </CardTitle>
          <CardDescription>
            Gere um link que qualquer pessoa pode usar para entrar na sua clínica. Compartilhe com sua equipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inviteLink ? (
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={handleGenerateLink} disabled={isGeneratingLink || !orgId}>
              {isGeneratingLink ? 'Gerando…' : 'Gerar link de convite'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-md border px-4 py-3 text-sm ${
          feedback.type === 'success'
            ? 'border-green-300 bg-green-50 text-green-800'
            : 'border-destructive/30 bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Current members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Membros da clínica
          </CardTitle>
          <CardDescription>
            Todos os usuários com acesso à {clinicName || 'sua clínica'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2.5 w-48 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <ul className="space-y-3">
              {members.map((m, i) => (
                <li key={m.id ?? i}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                        {(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name || '(sem nome)'}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    {m.role && (
                      <Badge variant={m.role === 'owner' || m.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {m.role === 'owner' ? 'Dono' : m.role === 'admin' ? 'Admin' : 'Membro'}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p>Nenhum membro encontrado ainda.</p>
              <p className="text-xs mt-1">Convide sua equipe usando os campos acima.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}