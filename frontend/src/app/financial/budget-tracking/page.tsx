"use client";

import { useState, useEffect, useMemo } from "react";
import { format, getMonth, getYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Repeat, Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, DollarSign, PiggyBank, CalendarDays, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

type TipoTransacao = "receita" | "despesa";
type StatusTransacao = "pago" | "pendente" | "previsto";
type StatusContaFixa = "ativa" | "inativa";
type Visao = "mensal" | "anual";

interface TransacaoFinanceira {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  status: StatusTransacao;
  contaFixaId?: string;
  observacao?: string;
}

interface ContaFixa {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  categoria: string;
  valor: number;
  diaVencimento: number;
  dataInicio: string;
  dataFim?: string;
  status: StatusContaFixa;
  observacao?: string;
}

const CATEGORIAS_RECEITA = ["Consultas", "Procedimentos", "Exames", "Planos", "Outros"];
const CATEGORIAS_DESPESA = ["Aluguel", "Água", "Luz", "Internet", "Material", "Salários", "Impostos", "Marketing", "Manutenção", "Outros"];
const MESES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(2024, i), "MMMM", { locale: ptBR }) }));
const ANOS = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 3 + i);

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

const API = {
  async transacoes(filters?: Record<string, string>) {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    const res = await fetch(`/api/proxy/budget/transacoes${params}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<TransacaoFinanceira[]>;
  },
  async criarTransacao(dto: Omit<TransacaoFinanceira, "id">) {
    const res = await fetch("/api/proxy/budget/transacoes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<TransacaoFinanceira>;
  },
  async atualizarTransacao(id: string, dto: Partial<TransacaoFinanceira>) {
    const res = await fetch(`/api/proxy/budget/transacoes?id=${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<TransacaoFinanceira>;
  },
  async excluirTransacao(id: string) {
    const res = await fetch(`/api/proxy/budget/transacoes?id=${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
  },
  async contasFixas(filters?: Record<string, string>) {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    const res = await fetch(`/api/proxy/budget/contas-fixas${params}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ContaFixa[]>;
  },
  async criarContaFixa(dto: Omit<ContaFixa, "id">) {
    const res = await fetch("/api/proxy/budget/contas-fixas", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ContaFixa>;
  },
  async atualizarContaFixa(id: string, dto: Partial<ContaFixa>) {
    const res = await fetch(`/api/proxy/budget/contas-fixas?id=${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ContaFixa>;
  },
  async excluirContaFixa(id: string) {
    const res = await fetch(`/api/proxy/budget/contas-fixas?id=${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
  },
};

export default function BudgetTrackingPage() {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [activeTab, setActiveTab] = useState<TipoTransacao | "contas-fixas">("receita");
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()) + 1);
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [visao, setVisao] = useState<Visao>("mensal");
  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalTipo, setModalTipo] = useState<TipoTransacao>("receita");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formData, setFormData] = useState("");
  const [formStatus, setFormStatus] = useState<StatusTransacao>("pago");
  const [formObservacao, setFormObservacao] = useState("");

  const [contaFixaModalOpen, setContaFixaModalOpen] = useState(false);
  const [editingContaFixaId, setEditingContaFixaId] = useState<string | null>(null);
  const [cfForm, setCfForm] = useState({
    tipo: "despesa" as TipoTransacao,
    descricao: "",
    categoria: "Aluguel",
    valor: "",
    diaVencimento: "15",
    dataInicio: "",
    dataFim: "",
    status: "ativa" as StatusContaFixa,
    observacao: "",
  });

  function updateCfField<K extends keyof typeof cfForm>(field: K, value: typeof cfForm[K]) {
    setCfForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetCfForm(tipo?: TipoTransacao, data?: string) {
    setCfForm({
      tipo: tipo ?? "despesa",
      descricao: "",
      categoria: tipo === "receita" ? "Consultas" : "Aluguel",
      valor: "",
      diaVencimento: "15",
      dataInicio: data ?? format(new Date(selectedYear, selectedMonth - 1), "yyyy-MM-dd"),
      dataFim: "",
      status: "ativa",
      observacao: "",
    });
  }

  useEffect(() => {
    API.transacoes().then(setTransacoes).catch(console.error);
    API.contasFixas().then(setContasFixas).catch(console.error);
  }, []);

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      const data = parseISO(t.data);
      const mesOk = getMonth(data) + 1 === selectedMonth;
      const anoOk = getYear(data) === selectedYear;
      const tipoOk = activeTab === "contas-fixas" || t.tipo === activeTab;
      const searchOk = !searchTerm || t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      return mesOk && anoOk && tipoOk && searchOk;
    });
  }, [transacoes, selectedMonth, selectedYear, activeTab, searchTerm]);

  const contasFixasFiltradas = useMemo(() => {
    return contasFixas.filter((c) => {
      const searchOk = !searchTerm || c.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      return searchOk;
    });
  }, [contasFixas, searchTerm]);

  const totais = useMemo(() => {
    const receitas = transacoes.filter((t) => {
      const data = parseISO(t.data);
      return getMonth(data) + 1 === selectedMonth && getYear(data) === selectedYear && t.tipo === "receita";
    }).reduce((acc, t) => acc + t.valor, 0);
    const despesas = transacoes.filter((t) => {
      const data = parseISO(t.data);
      return getMonth(data) + 1 === selectedMonth && getYear(data) === selectedYear && t.tipo === "despesa";
    }).reduce((acc, t) => acc + t.valor, 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [transacoes, selectedMonth, selectedYear]);

  const agruparPorDia = useMemo(() => {
    const grupos: Record<string, TransacaoFinanceira[]> = {};
    transacoesFiltradas.forEach((t) => {
      const chave = t.data.substring(0, 10);
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(t);
    });
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  }, [transacoesFiltradas]);

  const agruparPorMes = useMemo(() => {
    if (visao !== "anual") return [];
    const grupos: Record<string, { mes: number; ano: number; receitas: number; despesas: number; saldo: number; itens: TransacaoFinanceira[] }> = {};
    transacoes.forEach((t) => {
      const d = parseISO(t.data);
      if (getYear(d) !== selectedYear) return;
      const chave = `${getYear(d)}-${getMonth(d)}`;
      if (!grupos[chave]) grupos[chave] = { mes: getMonth(d), ano: getYear(d), receitas: 0, despesas: 0, saldo: 0, itens: [] };
      grupos[chave].itens.push(t);
      if (t.tipo === "receita") grupos[chave].receitas += t.valor;
      else grupos[chave].despesas += t.valor;
    });
    return Object.entries(grupos)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, saldo: v.receitas - v.despesas }));
  }, [transacoes, selectedYear, visao]);

  const abrirNovaTransacao = (tipo: TipoTransacao) => {
    setEditingId(null);
    setModalTipo(tipo);
    setFormDescricao("");
    setFormCategoria(tipo === "receita" ? "Consultas" : "Aluguel");
    setFormValor("");
    setFormData(format(new Date(selectedYear, selectedMonth - 1), "yyyy-MM-dd"));
    setFormStatus("pago");
    setFormObservacao("");
    setModalOpen(true);
  };

  const abrirEditarTransacao = (t: TransacaoFinanceira) => {
    setEditingId(t.id);
    setModalTipo(t.tipo);
    setFormDescricao(t.descricao);
    setFormCategoria(t.categoria);
    setFormValor(String(t.valor));
    setFormData(t.data.substring(0, 10));
    setFormStatus(t.status);
    setFormObservacao(t.observacao || "");
    setModalOpen(true);
  };

  const salvarTransacao = async () => {
    if (!formDescricao || !formValor || !formData) return;
    const valor = parseFloat(formValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) return;

    const dto = { tipo: modalTipo, descricao: formDescricao, categoria: formCategoria, valor, data: formData, status: formStatus, observacao: formObservacao };

    try {
      if (editingId) {
        await API.atualizarTransacao(editingId, dto);
      } else {
        await API.criarTransacao(dto);
      }
      setTransacoes(await API.transacoes());
      setModalOpen(false);
    } catch (e) {
      console.error("Erro ao salvar transação:", e);
    }
  };

  const excluirTransacao = async (id: string) => {
    try {
      await API.excluirTransacao(id);
      setTransacoes(await API.transacoes());
    } catch (e) {
      console.error("Erro ao excluir transação:", e);
    }
  };

  const abrirNovaContaFixa = () => {
    setEditingContaFixaId(null);
    resetCfForm(undefined, format(new Date(selectedYear, selectedMonth - 1), "yyyy-MM-dd"));
    setContaFixaModalOpen(true);
  };

  const abrirEditarContaFixa = (c: ContaFixa) => {
    setEditingContaFixaId(c.id);
    setCfForm({
      tipo: c.tipo,
      descricao: c.descricao,
      categoria: c.categoria,
      valor: String(c.valor),
      diaVencimento: String(c.diaVencimento),
      dataInicio: c.dataInicio.substring(0, 10),
      dataFim: c.dataFim ? c.dataFim.substring(0, 10) : "",
      status: c.status,
      observacao: c.observacao || "",
    });
    setContaFixaModalOpen(true);
  };

  const salvarContaFixa = async () => {
    if (!cfForm.descricao || !cfForm.valor || !cfForm.diaVencimento || !cfForm.dataInicio) return;
    const valor = parseFloat(cfForm.valor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) return;
    const dia = parseInt(cfForm.diaVencimento);
    if (isNaN(dia) || dia < 1 || dia > 31) return;

    const dto = {
      tipo: cfForm.tipo,
      descricao: cfForm.descricao,
      categoria: cfForm.categoria,
      valor,
      diaVencimento: dia,
      dataInicio: cfForm.dataInicio,
      dataFim: cfForm.dataFim || undefined,
      status: cfForm.status,
      observacao: cfForm.observacao,
    };

    try {
      if (editingContaFixaId) {
        await API.atualizarContaFixa(editingContaFixaId, dto);
      } else {
        await API.criarContaFixa(dto);
      }
      setContasFixas(await API.contasFixas());
      setTransacoes(await API.transacoes());
      setContaFixaModalOpen(false);
    } catch (e) {
      console.error("Erro ao salvar conta fixa:", e);
    }
  };

  const excluirContaFixa = async (id: string) => {
    try {
      await API.excluirContaFixa(id);
      setContasFixas(await API.contasFixas());
      setTransacoes(await API.transacoes());
    } catch (e) {
      console.error("Erro ao excluir conta fixa:", e);
    }
  };

  const tabs = [
    { id: "receita" as const, label: "Receitas", icon: TrendingUp },
    { id: "despesa" as const, label: "Despesas", icon: TrendingDown },
    { id: "contas-fixas" as const, label: "Contas Fixas", icon: Repeat },
  ];

  const statusBadgeVariant = (status: StatusTransacao) => {
    switch (status) {
      case "pago": return "default" as const;
      case "pendente": return "secondary" as const;
      case "previsto": return "outline" as const;
    }
  };

  const statusLabel = (status: StatusTransacao) => {
    switch (status) {
      case "pago": return "Pago";
      case "pendente": return "Pendente";
      case "previsto": return "Previsto";
    }
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Controle de Entradas e Saídas</h2>
          <p className="text-muted-foreground italic text-sm mt-1">Gerencie as receitas e despesas da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue>{MESES.find(m => m.value === selectedMonth)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => { setSelectedMonth((m) => m === 1 ? 12 : m - 1); if (selectedMonth === 1) setSelectedYear((y) => y - 1); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setSelectedMonth((m) => m === 12 ? 1 : m + 1); if (selectedMonth === 12) setSelectedYear((y) => y + 1); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select value={visao} onValueChange={(v) => setVisao(v as Visao)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totais.receitas)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {visao === "mensal" ? "Total do mês" : "Total acumulado"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totais.despesas)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {visao === "mensal" ? "Total do mês" : "Total acumulado"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
            <PiggyBank className={cn("h-4 w-4", totais.saldo >= 0 ? "text-emerald-500" : "text-red-500")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totais.saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
              {formatCurrency(totais.saldo)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totais.saldo >= 0 ? "Positivo" : "Negativo"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-all hover:text-foreground",
                activeTab === tab.id ? "bg-background text-foreground shadow-xs" : ""
              )}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 w-48"
            />
          </div>

          {activeTab === "contas-fixas" ? (
            <Button onClick={abrirNovaContaFixa}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta Fixa
            </Button>
          ) : (
            <Button onClick={() => abrirNovaTransacao(activeTab)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {activeTab !== "contas-fixas" && visao === "mensal" && (
            <>
              {agruparPorDia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhuma transação encontrada</p>
                  <p className="text-sm">Clique em "Nova Transação" para adicionar a primeira.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {agruparPorDia.map(([data, itens]) => {
                    const avulsos = itens.filter(t => !t.contaFixaId);
                    const fixos = itens.filter(t => t.contaFixaId);
                    const totalAvulsos = avulsos.reduce((acc, t) => acc + t.valor, 0);
                    const totalFixos = fixos.reduce((acc, t) => acc + t.valor, 0);
                    const totalDia = totalAvulsos + totalFixos;

                    function renderTabela(titulo: string, lista: TransacaoFinanceira[], iconCls: string) {
                      if (lista.length === 0) return null;
                      return (
                        <div className="mb-4 last:mb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn("h-2 w-2 rounded-full", iconCls)} />
                              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{titulo}</span>
                            </div>
                            <span className={cn("text-xs font-semibold", iconCls)}>{formatCurrency(lista.reduce((s, t) => s + t.valor, 0))}</span>
                          </div>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full caption-bottom text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Descrição</th>
                                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Categoria</th>
                                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Valor</th>
                                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-20">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lista.map((t) => (
                                  <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">{t.descricao}</td>
                                    <td className="p-4 align-middle">
                                      <Badge variant="outline">{t.categoria}</Badge>
                                    </td>
                                    <td className={cn("p-4 align-middle font-medium", t.tipo === "receita" ? "text-emerald-600" : "text-red-600")}>
                                      {formatCurrency(t.valor)}
                                    </td>
                                    <td className="p-4 align-middle">
                                      <Badge variant={statusBadgeVariant(t.status)}>{statusLabel(t.status)}</Badge>
                                    </td>
                                    <td className="p-4 align-middle">
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon-sm" onClick={() => abrirEditarTransacao(t)}>
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon-sm" onClick={() => excluirTransacao(t.id)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={data}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              <CalendarDays className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{format(parseISO(data), "dd 'de' MMMM", { locale: ptBR })}</p>
                              <p className="text-xs text-muted-foreground">{itens.length} transação(ões)</p>
                            </div>
                          </div>
                          <div className={cn("text-sm font-semibold", totalDia >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {formatCurrency(totalDia)}
                          </div>
                        </div>
                        {renderTabela("Avulsos", avulsos, activeTab === "receita" ? "text-emerald-500" : "text-red-500")}
                        {renderTabela("Fixos", fixos, "text-blue-500")}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab !== "contas-fixas" && visao === "anual" && (
            <>
              {agruparPorMes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileDown className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhuma transação para {selectedYear}</p>
                  <p className="text-sm">Os dados aparecerão conforme você adicionar transações.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Mês</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Receitas</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Despesas</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Saldo</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Qtd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agruparPorMes.map((g) => (
                          <tr key={`${g.ano}-${g.mes}`} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle font-medium">
                              {format(new Date(g.ano, g.mes), "MMMM", { locale: ptBR })}
                            </td>
                            <td className="p-4 align-middle text-emerald-600 font-medium">{formatCurrency(g.receitas)}</td>
                            <td className="p-4 align-middle text-red-600 font-medium">{formatCurrency(g.despesas)}</td>
                            <td className={cn("p-4 align-middle font-medium", g.saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                              {formatCurrency(g.saldo)}
                            </td>
                            <td className="p-4 align-middle">{g.itens.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "contas-fixas" && (
            <>
              {contasFixasFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Repeat className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhuma conta fixa cadastrada</p>
                  <p className="text-sm">Clique em "Nova Conta Fixa" para adicionar contas recorrentes.</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Descrição</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Categoria</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Valor</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Vencimento</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Período</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-20">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contasFixasFiltradas.map((c) => (
                        <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            {c.tipo === "receita" ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Receita</Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Despesa</Badge>
                            )}
                          </td>
                          <td className="p-4 align-middle font-medium">{c.descricao}</td>
                          <td className="p-4 align-middle">
                            <Badge variant="secondary">{c.categoria}</Badge>
                          </td>
                          <td className={cn("p-4 align-middle font-medium", c.tipo === "receita" ? "text-emerald-600" : "text-red-600")}>
                            {formatCurrency(c.valor)}
                          </td>
                          <td className="p-4 align-middle">Dia {c.diaVencimento}</td>
                          <td className="p-4 align-middle text-xs text-muted-foreground">
                            {formatDate(c.dataInicio)}
                            {c.dataFim ? ` — ${formatDate(c.dataFim)}` : " — ∞"}
                          </td>
                          <td className="p-4 align-middle">
                            {c.status === "ativa" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Ativa</Badge>
                            ) : (
                              <Badge variant="secondary">Inativa</Badge>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon-sm" onClick={() => abrirEditarContaFixa(c)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" onClick={() => excluirContaFixa(c.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nova"} Transação</DialogTitle>
            <DialogDescription>
              {editingId ? "Altere as informações da transação." : "Preencha os dados para adicionar uma nova transação."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={modalTipo} onValueChange={(v) => { setModalTipo(v as TipoTransacao); setFormCategoria(v === "receita" ? "Consultas" : "Aluguel"); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as StatusTransacao)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="previsto">Previsto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Ex: Consulta particular" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formCategoria} onValueChange={(v) => v && setFormCategoria(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(modalTipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input value={formValor} onChange={(e) => setFormValor(e.target.value)} placeholder="0,00" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData} onChange={(e) => setFormData(e.target.value)} type="date" />
            </div>

            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea value={formObservacao} onChange={(e) => setFormObservacao(e.target.value)} placeholder="Observações adicionais..." rows={2} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={salvarTransacao} disabled={!formDescricao || !formValor || !formData}>
              {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contaFixaModalOpen} onOpenChange={setContaFixaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContaFixaId ? "Editar" : "Nova"} Conta Fixa</DialogTitle>
            <DialogDescription>
              {editingContaFixaId ? "Altere as informações da conta fixa." : "Cadastre uma conta recorrente para gerar transações automaticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={cfForm.tipo} onValueChange={(v) => { updateCfField("tipo", v as TipoTransacao); updateCfField("categoria", v === "receita" ? "Consultas" : "Aluguel"); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={cfForm.status} onValueChange={(v) => updateCfField("status", v as StatusContaFixa)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={cfForm.descricao} onChange={(e) => updateCfField("descricao", e.target.value)} placeholder="Ex: Aluguel da clínica" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={cfForm.categoria} onValueChange={(v) => v && updateCfField("categoria", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(cfForm.tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input value={cfForm.valor} onChange={(e) => updateCfField("valor", e.target.value)} placeholder="0,00" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia de Vencimento</Label>
                <Input value={cfForm.diaVencimento} onChange={(e) => updateCfField("diaVencimento", e.target.value)} placeholder="15" type="number" min={1} max={31} />
              </div>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input value={cfForm.dataInicio} onChange={(e) => updateCfField("dataInicio", e.target.value)} type="date" />
              </div>
              <div className="space-y-2">
                <Label>Data de Fim (opcional)</Label>
                <Input value={cfForm.dataFim} onChange={(e) => updateCfField("dataFim", e.target.value)} type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea value={cfForm.observacao} onChange={(e) => updateCfField("observacao", e.target.value)} placeholder="Observações adicionais..." rows={2} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={salvarContaFixa} disabled={!cfForm.descricao || !cfForm.valor || !cfForm.diaVencimento || !cfForm.dataInicio}>
              {editingContaFixaId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
