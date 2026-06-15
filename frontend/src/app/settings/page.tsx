'use client';

import { useState, useEffect, useRef } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const currentPwdRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setName(data.user.name ?? '');
            setRole(data.role ?? null);
          }
        }
      } catch {
        router.push('/auth/sign-in');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPassword('');
      if (currentPwdRef.current) currentPwdRef.current.value = '';
    }, 50);
    return () => clearTimeout(t);
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await (authClient as any).updateUser({ name });
      if (error) {
        toast.error(error.message || 'Erro ao salvar');
        return;
      }
      toast.success('Nome atualizado com sucesso');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    setChangingPassword(true);
    try {
      const result = await (authClient as any).changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result?.error) {
        toast.error(result.error.message || result.error.statusText || 'Erro ao alterar senha');
        return;
      }
      toast.success('Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'CONFIRMAR') return;
    setDeleting(true);
    try {
      if (role === 'owner') {
        const res = await fetch('/api/delete-owner-account', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Erro ao excluir conta');
          return;
        }
        toast.success(`Clínica "${data.clinicName}" e sua conta foram excluídas.`);
      } else {
        const { error } = await (authClient as any).deleteUser({ callbackURL: '/' });
        if (error) {
          toast.error(error.message || 'Erro ao excluir conta');
          return;
        }
        toast.success('Conta excluída');
      }
      router.push('/');
    } catch {
      toast.error('Erro ao excluir conta');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return null;

  if (!user) {
    router.push('/auth/sign-in');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
        <p className="text-muted-foreground italic text-sm mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" /> Perfil
          </CardTitle>
          <CardDescription>Atualize suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <Button type="submit" disabled={savingProfile || !name.trim()}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" /> Segurança
          </CardTitle>
          <CardDescription>Altere sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              {/* Dummy input to trap browser autofill */}
              <input type="password" tabIndex={-1} style={{ position: 'absolute', left: '-9999px' }} readOnly aria-hidden="true" />
              <Input
                ref={currentPwdRef}
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha atual"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Trash2 className="h-5 w-5" /> Zona de perigo
          </CardTitle>
          <CardDescription>Excluir permanentemente sua conta e todos os dados associados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {role === 'owner' && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm space-y-2">
              <p className="font-semibold text-destructive">Atenção: você é o Dono da clínica</p>
              <p className="text-muted-foreground">
                Ao excluir sua conta, toda a clínica será permanentemente removida,
                incluindo todos os membros, pacientes, agendamentos, procedimentos e
                dados financeiros vinculados a ela. Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="confirmDelete">
              Digite               <span className="font-mono font-bold">CONFIRMAR</span> para excluir {role === 'owner' ? 'sua clínica e sua conta' : 'sua conta'}
            </Label>
            <Input
              id="confirmDelete"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="CONFIRMAR"
              className="border-destructive/50"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting || confirmDelete !== 'CONFIRMAR'}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
