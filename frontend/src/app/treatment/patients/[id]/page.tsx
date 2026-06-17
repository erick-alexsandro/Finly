"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, UserRound, Calendar, FileText, DollarSign, Pencil, X, Check, CalendarPlus, Clock, Stethoscope, Activity, Pen, CheckCheck, FileText as FileTextIcon, Search, ArrowUpDown, Split, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PatientAppointmentModal } from "./_components/patient-appointment-modal";
import { PatientAppointmentEditModal } from "./_components/patient-appointment-edit-modal";
import { ProntuarioModal } from "./_components/prontuario-modal";
import { SinglePaymentModal } from "./_components/single-payment-modal";
import { InstallmentPaymentModal } from "./_components/installment-payment-modal";
import { EditPaymentModal } from "./_components/edit-payment-modal";
import { NotReceptionist } from "@/components/auth/role-gate";

interface Patient {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: boolean;
}

function formatCPF(cpf: string) {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function formatPhone(phone: string) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (digits.length === 10)
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return phone;
}

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cadastro");
  const [isEditing, setIsEditing] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editObservacoes, setEditObservacoes] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProntuarioModal, setShowProntuarioModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [procedimentosMap, setProcedimentosMap] = useState<Record<string, string>>({});
  const [procedimentosPrecoMap, setProcedimentosPrecoMap] = useState<Record<string, number>>({});
  const [prontuariosMap, setProntuariosMap] = useState<Record<string, boolean>>({});
  const [prontuarios, setProntuarios] = useState<any[]>([]);
  const [profissionaisMap, setProfissionaisMap] = useState<Record<string, string>>({});
  const [prontuarioSearch, setProntuarioSearch] = useState("");
  const [prontuarioSort, setProntuarioSort] = useState<"asc" | "desc">("desc");
  const [payments, setPayments] = useState<any[]>([]);
  const [showSinglePayment, setShowSinglePayment] = useState(false);
  const [showInstallmentPayment, setShowInstallmentPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [paymentActionAppointmentId, setPaymentActionAppointmentId] = useState<string | null>(null);
  const [paymentFromAppointment, setPaymentFromAppointment] = useState<any | null>(null);
  const [paymentChoiceModal, setPaymentChoiceModal] = useState(false);
  const [paymentDefaultNome, setPaymentDefaultNome] = useState("");
  const [paymentDefaultData, setPaymentDefaultData] = useState("");
  const [paymentDefaultValor, setPaymentDefaultValor] = useState("");
  const [paymentAgendamentoId, setPaymentAgendamentoId] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    const fetchPatient = async () => {
      try {
        const res = await apiFetch("/api/proxy/pacientes");
        if (res.ok) {
          const data: Patient[] = await res.json();
          const found = data.find((p) => p.id === id);
          setPatient(found || null);
        }
      } catch (err) {
        console.error("Erro ao buscar paciente:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [params.id]);

  useEffect(() => {
    const fetchProcedimentos = async () => {
      try {
        const res = await apiFetch("/api/proxy/procedimentos");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          const precos: Record<string, number> = {};
          data.forEach((p: any) => {
            if (p?.id != null) {
              map[String(p.id)] = p.nome || "Procedimento";
              if (p.preco != null) precos[String(p.id)] = Number(p.preco);
            }
          });
          setProcedimentosMap(map);
          setProcedimentosPrecoMap(precos);
        }
      } catch {}
    };
    fetchProcedimentos();
  }, []);

  useEffect(() => {
    const fetchProfissionais = async () => {
      try {
        const res = await apiFetch("/api/proxy/profissionais");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          data.forEach((p: any) => { if (p?.id) map[String(p.id)] = p.nome; });
          setProfissionaisMap(map);
        }
      } catch {}
    };
    fetchProfissionais();
  }, []);

  useEffect(() => {
    if (!patient) return;
    const fetchProntuarios = async () => {
      try {
        const res = await apiFetch(`/api/proxy/prontuarios?pacienteId=${patient.id}`);
        if (res.ok) setProntuarios(await res.json());
      } catch {}
    };
    fetchProntuarios();
  }, [patient]);

  useEffect(() => {
    if (!patient) return;
    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const res = await apiFetch(`/api/proxy/agendamentos?patient=${patient.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
          const reportMap: Record<string, boolean> = {};
          for (const apt of data) {
            try {
              const r = await apiFetch(`/api/proxy/prontuarios?agendamentoId=${apt.id}&exists=true`);
              if (r.ok) {
                const result = await r.json();
                reportMap[apt.id] = result.exists;
              }
            } catch {}
          }
          setProntuariosMap(reportMap);
        }
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, [patient]);

  const startEditing = () => {
    if (!patient) return;
    setEditNome(patient.nome);
    setEditCpf(patient.cpf);
    setEditTelefone(patient.telefone);
    setEditEmail(patient.email || "");
    setEditDataNascimento(patient.dataNascimento || "");
    setEditEndereco(patient.endereco || "");
    setEditObservacoes(patient.observacoes || "");
    setEditAtivo(patient.ativo);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!patient) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`/api/proxy/pacientes?id=${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editNome.trim(),
          cpf: editCpf.replace(/\D/g, ""),
          telefone: editTelefone.replace(/\D/g, ""),
          email: editEmail,
          dataNascimento: editDataNascimento || null,
          endereco: editEndereco,
          observacoes: editObservacoes,
          ativo: editAtivo,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPatient(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Erro ao salvar paciente:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAppointment = async (apt: any) => {
    try {
      const res = await apiFetch(`/api/proxy/agendamentos?id=${apt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmado", confirmado: true }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === apt.id ? { ...a, status: "confirmado", confirmado: true } : a))
        );
      }
    } catch (err) {
      console.error("Erro ao confirmar agendamento:", err);
    }
  };

  const openEditModal = (apt: any) => {
    setSelectedAppointment(apt);
    setShowEditModal(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAppointment = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/proxy/agendamentos?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setAppointments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error("Erro ao excluir agendamento:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openProntuarioModal = (apt: any) => {
    setSelectedAppointment(apt);
    setShowProntuarioModal(true);
  };

  const openProntuarioFromProntuario = (r: any) => {
    setSelectedAppointment({
      id: r.agendamentoId,
      profissionalId: r.profissionalId,
      profissionalNome: profissionaisMap[String(r.profissionalId)] || "",
      data: r.data || "",
    });
    setShowProntuarioModal(true);
  };

  const loadPayments = async () => {
    if (!patient) return;
    try {
      const res = await apiFetch(`/api/proxy/pagamentos-paciente?pacienteId=${patient.id}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.map((p: any) => ({ ...p, status: p.status || "pendente" })));
      } else setPayments([]);
    } catch { setPayments([]); }
  };

  useEffect(() => { loadPayments(); }, [patient]);

  const savePayment = async (payment: any) => {
    if (!patient) return;
    const baseStatus = payment.status || "pendente";
    const agendamentoId = paymentAgendamentoId || payment.agendamentoId || null;
    setPaymentAgendamentoId(null);

    const body = {
      nome: payment.nome,
      data: payment.data,
      valorTotal: payment.valorTotal,
      formaPagamento: payment.formaPagamento,
      parcelas: payment.parcelas,
      pacienteId: patient.id,
      agendamentoId,
      status: baseStatus,
    };

    try {
      if (payment.parcelas && payment.formaPagamento !== "credito") {
        const installmentValue = payment.valorTotal / payment.parcelas;
        for (let i = 0; i < payment.parcelas; i++) {
          const res = await apiFetch("/api/proxy/pagamentos-paciente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...body,
              nome: `${payment.nome} (${i + 1}/${payment.parcelas})`,
              valorTotal: installmentValue,
              parcelas: 1,
            }),
          });
          if (!res.ok) {
            const err = await res.text();
            console.error("Erro ao salvar parcela:", err);
            alert("Erro ao salvar pagamento: " + err.slice(0, 100));
            return;
          }
        }
      } else {
        const res = await apiFetch("/api/proxy/pagamentos-paciente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error("Erro ao salvar pagamento:", err);
          alert("Erro ao salvar pagamento: " + err.slice(0, 100));
          return;
        }
      }
      await loadPayments();
    } catch (e) {
      console.error("Erro ao salvar pagamento:", e);
      alert("Erro ao conectar com o servidor");
    }
  };

  const togglePaymentStatus = async (paymentId: string) => {
    const payment = payments.find((p: any) => p.id === paymentId);
    if (!payment) return;
    const newStatus = payment.status === "pago" ? "pendente" : "pago";
    try {
      await apiFetch(`/api/proxy/pagamentos-paciente?id=${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadPayments();
    } catch {}
  };

  const handleEditPayment = async (updatedPayment: any) => {
    try {
      await apiFetch(`/api/proxy/pagamentos-paciente?id=${updatedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: updatedPayment.nome,
          data: updatedPayment.data,
          valorTotal: updatedPayment.valorTotal,
          formaPagamento: updatedPayment.formaPagamento,
          status: updatedPayment.status,
        }),
      });
      await loadPayments();
    } catch {}
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm("Excluir este pagamento?")) return;
    try {
      await apiFetch(`/api/proxy/pagamentos-paciente?id=${paymentId}`, { method: "DELETE" });
      await loadPayments();
    } catch {}
  };

  const openPaymentChoice = (apt: any) => {
    setPaymentFromAppointment(apt);
    setPaymentAgendamentoId(apt.id);
    const nome = apt.procedimentosIds?.length
      ? apt.procedimentosIds.map((id: string) => procedimentosMap[String(id)] || `ID ${id}`).join(", ")
      : "Consulta";
    setPaymentDefaultNome(nome);
    setPaymentDefaultData(apt.data ? apt.data.split("T")[0] : new Date().toISOString().split("T")[0]);
    const total = apt.procedimentosIds?.length
      ? apt.procedimentosIds.reduce((sum: number, id: string) => sum + (procedimentosPrecoMap[String(id)] || 0), 0)
      : 0;
    setPaymentDefaultValor(total > 0 ? String(total) : "");
    setPaymentChoiceModal(true);
  };

  const createPaymentFromAppointment = (type: "single" | "installment") => {
    setPaymentChoiceModal(false);
    if (type === "single") {
      setShowSinglePayment(true);
    } else {
      setShowInstallmentPayment(true);
    }
  };

  const refreshAppointments = async () => {
    if (!patient) return;
    const [res, resPru] = await Promise.all([
      apiFetch(`/api/proxy/agendamentos?patient=${patient.id}`),
      apiFetch(`/api/proxy/prontuarios?pacienteId=${patient.id}`),
    ]);
    if (res.ok) {
      const data = await res.json();
      setAppointments(data);
      const reportMap: Record<string, boolean> = {};
      for (const apt of data) {
        try {
          const r = await apiFetch(`/api/proxy/prontuarios?agendamentoId=${apt.id}&exists=true`);
          if (r.ok) {
            const result = await r.json();
            reportMap[apt.id] = result.exists;
          }
        } catch {}
      }
      setProntuariosMap(reportMap);
    }
    if (resPru.ok) setProntuarios(await resPru.json());
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/treatment/patients")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {loading ? (
          <div className="rounded-xl border bg-white p-6">
            <div className="mb-6 flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="mb-6 h-10 w-96" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : !patient ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <p className="text-lg text-slate-500">Paciente não encontrado</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-xl border bg-white p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E293B]">{patient.nome}</h1>
                <Badge
                  variant={patient.ativo ? "default" : "secondary"}
                  className={patient.ativo ? "bg-green-100 text-green-700" : ""}
                >
                  {patient.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTab value="cadastro">
                  <UserRound className="mr-1.5 h-4 w-4" />
                  Cadastro
                </TabsTab>
                <TabsTab value="agenda">
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Agenda
                </TabsTab>
                <TabsTab value="prontuario">
                  <FileText className="mr-1.5 h-4 w-4" />
                  Prontuário
                </TabsTab>
                <TabsTab value="financeiro">
                  <DollarSign className="mr-1.5 h-4 w-4" />
                  Financeiro
                </TabsTab>
              </TabsList>

              <TabsPanel value="cadastro">
                <div className="mb-4 flex justify-end">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                        <X className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        <Check className="mr-1 h-4 w-4" />
                        {isSaving ? "Salvando…" : "Salvar"}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={startEditing}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <div className="rounded-xl border bg-white p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Nome</Label>
                        <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>CPF</Label>
                        <Input value={formatCPF(editCpf)} onChange={(e) => setEditCpf(e.target.value.replace(/\D/g, ""))} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Telefone</Label>
                        <Input value={formatPhone(editTelefone)} onChange={(e) => setEditTelefone(e.target.value.replace(/\D/g, ""))} />
                      </div>
                      <div className="grid gap-2">
                        <Label>E-mail</Label>
                        <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Data de Nascimento</Label>
                        <Input type="date" value={editDataNascimento} onChange={(e) => setEditDataNascimento(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                          value={editAtivo ? "ativo" : "inativo"}
                          onValueChange={(v) => setEditAtivo(v === "ativo")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 grid gap-2">
                        <Label>Endereço</Label>
                        <Input value={editEndereco} onChange={(e) => setEditEndereco(e.target.value)} />
                      </div>
                      <div className="sm:col-span-2 grid gap-2">
                        <Label>Observações</Label>
                        <Textarea value={editObservacoes} onChange={(e) => setEditObservacoes(e.target.value)} rows={3} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-white p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">CPF</p>
                        <p className="mt-1 text-sm">{formatCPF(patient.cpf)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Telefone</p>
                        <p className="mt-1 text-sm">{formatPhone(patient.telefone)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">E-mail</p>
                        <p className="mt-1 text-sm">{patient.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data de Nascimento</p>
                        <p className="mt-1 text-sm">
                          {patient.dataNascimento
                            ? new Date(patient.dataNascimento + "T00:00:00").toLocaleDateString("pt-BR")
                            : "-"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Endereço</p>
                        <p className="mt-1 text-sm">{patient.endereco || "-"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</p>
                        <p className="mt-1 text-sm">{patient.observacoes || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsPanel>

              <TabsPanel value="agenda">
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => setShowAppointmentModal(true)}>
                    <CalendarPlus className="mr-1 h-4 w-4" />
                    Novo Agendamento
                  </Button>
                </div>
                {loadingAppointments ? (
                  <div className="rounded-xl border bg-white p-6 space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 text-center">
                    <Calendar className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-lg font-medium text-slate-500">Nenhum agendamento</p>
                    <p className="text-sm text-slate-400">Este paciente não possui consultas agendadas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt: any) => (
                      <div key={apt.id} className="rounded-xl border bg-white p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(apt.data).toLocaleDateString("pt-BR")} • {apt.horaInicio} - {apt.horaFim}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm">
                              <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{apt.profissionalNome || "Não informado"}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <Activity className="h-3.5 w-3.5" />
                              <span>
                                {apt.procedimentosIds?.length
                                  ? apt.procedimentosIds.map((id: string) => procedimentosMap[String(id)] || `ID ${id}`).join(", ")
                                  : "Nenhum procedimento"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge
                              variant={apt.status === "agendado" ? "default" : "secondary"}
                              className={apt.status === "agendado" ? "bg-blue-100 text-blue-700" : apt.status === "confirmado" ? "bg-green-100 text-green-700" : ""}
                            >
                              {apt.status || "agendado"}
                            </Badge>
                            <div className="flex gap-1 mt-1">
                              <NotReceptionist>
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditModal(apt)} title="Editar">
                                  <Pen className="h-3.5 w-3.5" />
                                </Button>
                              </NotReceptionist>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-700" onClick={() => { setDeleteTarget(apt); setShowDeleteConfirm(true); }} title="Excluir">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {apt.status !== "confirmado" && (
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600" onClick={() => handleConfirmAppointment(apt)} title="Confirmar">
                                  <CheckCheck className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 ${!prontuariosMap[apt.id] ? "text-red-500 hover:text-red-700" : ""}`}
                                onClick={() => openProntuarioModal(apt)}
                                title="Prontuário"
                              >
                                <FileTextIcon className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 ${!payments.some((p: any) => p.agendamentoId === apt.id) ? "text-red-500 hover:text-red-700" : ""}`}
                                onClick={() => openPaymentChoice(apt)}
                                title="Pagamento"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {patient && (
                  <PatientAppointmentModal
                    open={showAppointmentModal}
                    onOpenChange={setShowAppointmentModal}
                    patient={{ id: patient.id, nome: patient.nome, email: patient.email, telefone: patient.telefone }}
                    onSuccess={refreshAppointments}
                  />
                )}
                <NotReceptionist>
                {selectedAppointment && (
                  <PatientAppointmentEditModal
                    open={showEditModal}
                    onOpenChange={setShowEditModal}
                    appointment={selectedAppointment}
                    onSuccess={refreshAppointments}
                  />
                )}
                </NotReceptionist>

                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Excluir agendamento</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                      <Button variant="destructive" onClick={handleDeleteAppointment} disabled={isDeleting}>
                        {isDeleting ? "Excluindo…" : "Excluir"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsPanel>

              <TabsPanel value="prontuario">
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar prontuários..."
                      value={prontuarioSearch}
                      onChange={(e) => setProntuarioSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                {(() => {
                  const filtered = prontuarios.filter((r: any) => {
                    const q = prontuarioSearch.toLowerCase();
                    if (!q) return true;
                    return [r.dente, r.procedimentosExecutados, r.conteudo, r.secao, r.detalhesProximaConsulta, r.observacoes, profissionaisMap[String(r.profissionalId)]]
                      .some((v) => v?.toLowerCase().includes(q));
                  });
                  const sorted = [...filtered].sort((a: any, b: any) => {
                    const da = a.data || "";
                    const db = b.data || "";
                    return prontuarioSort === "desc" ? db.localeCompare(da) : da.localeCompare(db);
                  });
                  return sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-20 text-center">
                      <FileText className="mb-4 h-12 w-12 text-slate-300" />
                      <p className="text-lg font-medium text-slate-500">
                        {prontuarioSearch ? "Nenhum prontuário encontrado" : "Nenhum prontuário cadastrado"}
                      </p>
                      <p className="text-sm text-slate-400">Os prontuários criados nas consultas aparecerão aqui.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border bg-white">
                      <Table className="w-full table-fixed [&_td]:px-2 [&_td]:py-2 [&_th]:px-2 [&_th]:py-2">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">
                              <button onClick={() => setProntuarioSort((s) => (s === "asc" ? "desc" : "asc"))} className="flex items-center gap-1 font-medium">
                                Data
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </TableHead>
                            <TableHead className="w-[120px]">Profissional</TableHead>
                            <TableHead className="w-[70px]">Dente</TableHead>
                            <TableHead className="w-[180px]">Procedimentos</TableHead>
                            <TableHead className="w-[200px]">Relatório</TableHead>
                            <TableHead className="w-[90px]">Seção</TableHead>
                            <TableHead className="w-[220px]">Próx. Consulta</TableHead>
                            <TableHead className="w-[200px]">Observações</TableHead>
                            <TableHead className="w-[56px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sorted.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="whitespace-nowrap">{r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-"}</TableCell>
                              <TableCell className="truncate">{r.profissionalId ? profissionaisMap[String(r.profissionalId)] || r.profissionalId.slice(0, 8) + "…" : "-"}</TableCell>
                              <TableCell>{r.dente || "-"}</TableCell>
                              <TableCell className="break-words">{Array.isArray(r.procedimentosExecutados) && r.procedimentosExecutados.length ? r.procedimentosExecutados.map((id: string) => procedimentosMap[String(id)] || `ID ${id}`).join(", ") : "-"}</TableCell>
                              <TableCell className="break-words">{r.conteudo || "-"}</TableCell>
                              <TableCell className="break-words">{r.secao || "-"}</TableCell>
                              <TableCell className="break-words">{r.detalhesProximaConsulta || "-"}</TableCell>
                              <TableCell className="break-words">{r.observacoes || "-"}</TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openProntuarioFromProntuario(r)} title="Editar prontuário">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </TabsPanel>

              <TabsPanel value="financeiro">
                <div className="mb-4 flex justify-end gap-2">
                  <Button onClick={() => setShowSinglePayment(true)}>
                    <DollarSign className="mr-1 h-4 w-4" />
                    Adicionar Pagamento Único
                  </Button>
                  <Button variant="outline" onClick={() => setShowInstallmentPayment(true)}>
                    <Split className="mr-1 h-4 w-4" />
                    Adicionar Pagamento Parcelado
                  </Button>
                </div>
                {payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 text-center">
                    <DollarSign className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-lg font-medium text-slate-500">Nenhum pagamento registrado</p>
                    <p className="text-sm text-slate-400">Histórico de pagamentos e débitos do paciente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border bg-white">
                    <Table className="w-full [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Parcelas</TableHead>
                          <TableHead>Forma de Pagamento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap">{new Date(p.data).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>{p.nome}</TableCell>
                            <TableCell>R$ {Number(p.valorTotal).toFixed(2)}</TableCell>
                            <TableCell>{p.parcelas ? p.parcelas + "x" : "À vista"}</TableCell>
                            <TableCell className="capitalize">{p.formaPagamento}</TableCell>
                            <TableCell>
                              <Badge
                                className={`cursor-pointer select-none ${
                                  p.status === "pago"
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : p.status === "atrasado"
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                }`}
                                onClick={() => togglePaymentStatus(p.id)}
                              >
                                {p.status === "pago"
                                  ? "Pago"
                                  : p.status === "atrasado"
                                  ? "Atrasado"
                                  : "Pendente"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <button
                                  className="text-slate-400 hover:text-slate-700 transition-colors"
                                  onClick={() => {
                                    setEditingPayment(p);
                                    setShowEditPayment(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  onClick={() => handleDeletePayment(p.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsPanel>
            </Tabs>

            {patient && (
              <>
                <SinglePaymentModal
                  open={showSinglePayment}
                  onOpenChange={setShowSinglePayment}
                  onConfirm={savePayment}
                  defaultNome={paymentDefaultNome}
                  defaultData={paymentDefaultData}
                  defaultValorTotal={paymentDefaultValor}
                />
                <InstallmentPaymentModal
                  open={showInstallmentPayment}
                  onOpenChange={setShowInstallmentPayment}
                  onConfirm={savePayment}
                  defaultNome={paymentDefaultNome}
                  defaultData={paymentDefaultData}
                  defaultValorTotal={paymentDefaultValor}
                />
                <EditPaymentModal
                  open={showEditPayment}
                  onOpenChange={setShowEditPayment}
                  payment={editingPayment}
                  onSave={handleEditPayment}
                />
                <Dialog open={paymentChoiceModal} onOpenChange={setPaymentChoiceModal}>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Criar Pagamento</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <p className="text-sm text-muted-foreground">
                        {paymentDefaultNome}
                      </p>
                      <Button onClick={() => createPaymentFromAppointment("single")}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pagamento Único
                      </Button>
                      <Button variant="outline" onClick={() => createPaymentFromAppointment("installment")}>
                        <Split className="mr-2 h-4 w-4" />
                        Pagamento Parcelado
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {selectedAppointment && (
              <ProntuarioModal
                open={showProntuarioModal}
                onOpenChange={setShowProntuarioModal}
                agendamento={selectedAppointment}
                pacienteId={patient?.id || ""}
                onSuccess={refreshAppointments}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

