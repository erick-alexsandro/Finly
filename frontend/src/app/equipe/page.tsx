'use client';

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { AdminOrOwnerOnly } from '@/components/auth/role-gate';
import { authClient } from '@/lib/auth/client';
import { getActiveOrganizationId, ROLES, ROLE_LABELS, ROLE_OPTIONS, getRoleVariant, getRoleBadgeClass, canManageRoles, getCurrentUserRole, removeMember, updateMemberRole } from '@/lib/auth/organization';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UserPlus, Building2, Mail, Copy, Check, Users, Shield, Trash2 } from 'lucide-react';

interface Member {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function EquipePage() {
  const [clinicName, setClinicName] = useState<string>('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>(ROLES.RECEPTIONIST);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [changingRole, setChangingRole] = useState<{ memberId: string; loading: boolean } | null>(null);

  const canManage = canManageRoles(currentUserRole);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        let id: string | null = null;
        let role: string | null = null;
        if (res.ok) {
          const data = await res.json();
          setClinicName(data.clinic?.name ?? '');
          id = data.clinic?.id ?? null;
          role = data.role ?? null;
        }
        if (!id) id = await getActiveOrganizationId();
        if (!role && id) role = await getCurrentUserRole(id);
        setOrgId(id);
        setCurrentUserRole(role);
        if (id) await loadMembers(id);
      } catch (e) {
        console.error('[Equipe] init error', e);
      } finally {
        setIsLoadingMembers(false);
      }
    })();
  }, []);

  const loadMembers = async (id: string) => {
    try {
      const res = await (authClient as any).organization.listMembers({ query: { organizationId: id } });
      const members = res?.data?.members ?? (Array.isArray(res) ? res : []);
      if (Array.isArray(members)) {
        setMembers(
          members.map((m: any) => ({
            id: m.id ?? m.userId,
            userId: m.userId ?? m.id,
            name: m.user?.name ?? m.name,
            email: m.user?.email ?? m.email,
            role: m.role,
          }))
        );
      }
    } catch (e) {
      console.warn('[Equipe] loadMembers error', e);
    }
  };

  const createInvite = async (payload: { organizationId: string; email: string; role: string }) => {
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao criar convite');
    return json.data;
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !orgId) return;
    setIsSendingInvite(true);

    try {
      const invite = await createInvite({
        organizationId: orgId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/accept-invitation?id=${invite.id}`;
      setInviteLink(link);
      toast.success(`Convite criado! Compartilhe o link com ${inviteEmail}.`);
      setInviteEmail('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar convite.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!orgId) return;
    if (!inviteEmail.trim()) {
      toast.error('Informe o e-mail da pessoa que receberá o convite.');
      return;
    }
    setIsGeneratingLink(true);

    try {
      const invite = await createInvite({
        organizationId: orgId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      if (invite?.id) {
        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/accept-invitation?id=${invite.id}`);
      } else {
        throw new Error('Convite criado mas ID não retornado.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar link de convite.');
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

  const handleRemoveMember = async () => {
    if (!memberToRemove || !orgId) return;
    setIsRemoving(true);
    try {
      await removeMember(orgId, memberToRemove.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      toast.success(`Membro removido com sucesso.`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover membro.');
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  const handleChangeRole = async (member: Member, newRole: string) => {
    if (!orgId) return;

    setChangingRole({ memberId: member.id, loading: true });
    try {
      await updateMemberRole(orgId, member.id, newRole);
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
      toast.success(`Cargo de ${member.name || member.email} alterado para ${ROLE_LABELS[newRole] ?? newRole}.`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao alterar cargo.');
    } finally {
      setChangingRole(null);
    }
  };

  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      const session = await authClient.getSession();
      return (session as any)?.data?.user?.id ?? null;
    } catch { return null; }
  };

  return (
    <AdminOrOwnerOnly>
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Equipe</h2>
        <p className="text-muted-foreground italic text-sm mt-1">
          Gerencie os membros que têm acesso à sua clínica
        </p>
      </div>

      {clinicName && (
        <div className="flex items-center gap-2 rounded-lg border bg-accent/30 px-4 py-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{clinicName}</span>
          <Badge variant="secondary" className="ml-auto text-xs">Sua clínica</Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" /> Convidar membro
          </CardTitle>
          <CardDescription>
            Gere um link de convite vinculado ao e-mail da pessoa e compartilhe manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="flex flex-col gap-3">
            <div className="flex gap-2">
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
              <div className="w-44">
                <Label htmlFor="inviteRole" className="sr-only">Cargo</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? ROLES.RECEPTIONIST)}>
                  <SelectTrigger id="inviteRole">
                    <SelectValue>{ROLE_LABELS[inviteRole]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSendingInvite || !orgId}>
                {isSendingInvite ? 'Gerando…' : 'Gerar link de convite'}
              </Button>
            </div>
            {ROLE_OPTIONS.find((o) => o.value === inviteRole)?.description && (
              <p className="text-xs text-muted-foreground">
                {ROLE_OPTIONS.find((o) => o.value === inviteRole)?.description}
              </p>
            )}
          </form>
          {inviteLink && (
            <div className="mt-3 flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
              {[1, 2, 3].map((i) => (
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
                    <div className="flex items-center gap-2">
                      {(!canManage || m.role === ROLES.OWNER) && (
                        <Badge variant={getRoleVariant(m.role)} className={cn('text-xs capitalize border', getRoleBadgeClass(m.role))}>
                          {ROLE_LABELS[m.role ?? ''] ?? m.role ?? 'Membro'}
                        </Badge>
                      )}
                      {canManage && m.role !== ROLES.OWNER && (
                        <div className="flex items-center gap-3">
                          <Select
                            value={m.role}
                            onValueChange={(v) => handleChangeRole(m, v ?? '')}
                            disabled={changingRole?.memberId === m.id}
                          >
                            <SelectTrigger className="h-8 px-2 text-xs gap-1">
                              <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="hidden sm:inline">{ROLE_LABELS[m.role ?? ''] ?? m.role}</span>
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.filter((opt) => opt.value !== ROLES.OWNER || !members.some((m) => m.role === ROLES.OWNER)).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setMemberToRemove(m)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Dialog open={memberToRemove?.id === m.id} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remover membro</DialogTitle>
                                <DialogDescription>
                                  Tem certeza que deseja remover {m.name || m.email || 'este membro'} da clínica?
                                  Esta ação não pode ser desfeita.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setMemberToRemove(null)}>
                                  Cancelar
                                </Button>
                                <Button variant="destructive" onClick={handleRemoveMember} disabled={isRemoving}>
                                  {isRemoving ? 'Removendo…' : 'Remover'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
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
    </AdminOrOwnerOnly>
  );
}

