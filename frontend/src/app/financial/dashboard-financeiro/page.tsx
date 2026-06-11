"use client";

import { useState, useEffect, useMemo } from "react";
import { format, getMonth, getYear, parseISO, startOfMonth, endOfMonth, addMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank, CalendarDays,
  PieChart, BarChart3, Activity, AlertTriangle, CheckCircle2,
  Clock, ArrowUpRight, ArrowDownRight, Layers, Target,
  Wallet, CreditCard, Landmark, Receipt, Percent,
  ChevronRight, ChevronLeft, TrendingUpDown, ChartNoAxesColumn,
  ChartPie, ChartLine, Eye, ArrowRightLeft, BadgeCheck, Ban,
  AlertCircle, Sparkles, Scale, Gauge, CircleDollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TipoTransacao = "receita" | "despesa";
type StatusTransacao = "pago" | "pendente" | "previsto";

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
  status: "ativa" | "inativa";
  observacao?: string;
}

const CATEGORIAS_RECEITA = ["Consultas", "Procedimentos", "Exames", "Planos", "Outros"] as const;
const CATEGORIAS_DESPESA = ["Aluguel", "Água", "Luz", "Internet", "Material", "Salários", "Impostos", "Marketing", "Manutenção", "Outros"] as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value: number) {
  const signal = value >= 0 ? "+" : "";
  return `${signal}${value.toFixed(1)}%`;
}

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return (a / b) * 100;
}

const MESES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(2024, i), "MMMM", { locale: ptBR }) }));
const ANOS = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 3 + i);

const API = {
  async transacoes(filters?: Record<string, string>) {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    const res = await fetch(`/api/proxy/budget/transacoes${params}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<TransacaoFinanceira[]>;
  },
  async contasFixas(filters?: Record<string, string>) {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    const res = await fetch(`/api/proxy/budget/contas-fixas${params}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ContaFixa[]>;
  },
};

export default function DashboardFinanceiroPage() {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()) + 1);
  const [chartView, setChartView] = useState<"12meses" | "anual">("12meses");

  useEffect(() => {
    API.transacoes().then(setTransacoes).catch(console.error);
    API.contasFixas().then(setContasFixas).catch(console.error);
  }, []);

  const mesesPeriodo = useMemo(() => {
    return Array.from({ length: chartView === "12meses" ? 12 : 6 }, (_, i) => {
      const d = addMonths(startOfMonth(new Date(selectedYear, selectedMonth - 1)), chartView === "12meses" ? -11 + i : -5 + i);
      return {
        mes: getMonth(d) + 1,
        ano: getYear(d),
        label: `${format(d, "MMM", { locale: ptBR })}/${getYear(d)}`,
      };
    });
  }, [selectedYear, selectedMonth, chartView]);

  const dadosPorMes = useMemo(() => {
    return mesesPeriodo.map((periodo) => {
      const filtradas = transacoes.filter((t) => {
        const d = parseISO(t.data);
        return getMonth(d) + 1 === periodo.mes && getYear(d) === periodo.ano;
      });
      const receitas = filtradas.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
      const despesas = filtradas.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
      return { ...periodo, receitas, despesas, saldo: receitas - despesas, qtd: filtradas.length };
    });
  }, [transacoes, mesesPeriodo]);

  const maxValor = useMemo(() => Math.max(...dadosPorMes.map((d) => Math.max(d.receitas, d.despesas)), 1), [dadosPorMes]);

  const transacoesMes = useMemo(() => {
    return transacoes.filter((t) => {
      const d = parseISO(t.data);
      return getMonth(d) + 1 === selectedMonth && getYear(d) === selectedYear;
    });
  }, [transacoes, selectedMonth, selectedYear]);

  const totaisMes = useMemo(() => {
    const receitas = transacoesMes.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
    const despesas = transacoesMes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
    const receitasPendentes = transacoesMes.filter((t) => t.tipo === "receita" && t.status !== "pago").reduce((s, t) => s + t.valor, 0);
    const despesasPendentes = transacoesMes.filter((t) => t.tipo === "despesa" && t.status !== "pago").reduce((s, t) => s + t.valor, 0);
    const receitasPago = transacoesMes.filter((t) => t.tipo === "receita" && t.status === "pago").reduce((s, t) => s + t.valor, 0);
    const despesasPago = transacoesMes.filter((t) => t.tipo === "despesa" && t.status === "pago").reduce((s, t) => s + t.valor, 0);
    return { receitas, despesas, saldo: receitas - despesas, receitasPendentes, despesasPendentes, receitasPago, despesasPago };
  }, [transacoesMes]);

  const margemLiquida = useMemo(() => {
    if (totaisMes.receitas === 0) return 0;
    return (totaisMes.saldo / totaisMes.receitas) * 100;
  }, [totaisMes]);

  const despesasPorCategoria = useMemo(() => {
    const categorias: Record<string, { valor: number; qtd: number }> = {};
    transacoesMes.filter((t) => t.tipo === "despesa").forEach((t) => {
      if (!categorias[t.categoria]) categorias[t.categoria] = { valor: 0, qtd: 0 };
      categorias[t.categoria].valor += t.valor;
      categorias[t.categoria].qtd += 1;
    });
    return Object.entries(categorias).sort(([, a], [, b]) => b.valor - a.valor);
  }, [transacoesMes]);

  const receitasPorCategoria = useMemo(() => {
    const categorias: Record<string, { valor: number; qtd: number }> = {};
    transacoesMes.filter((t) => t.tipo === "receita").forEach((t) => {
      if (!categorias[t.categoria]) categorias[t.categoria] = { valor: 0, qtd: 0 };
      categorias[t.categoria].valor += t.valor;
      categorias[t.categoria].qtd += 1;
    });
    return Object.entries(categorias).sort(([, a], [, b]) => b.valor - a.valor);
  }, [transacoesMes]);

  const maxCatDespesa = useMemo(() => Math.max(...despesasPorCategoria.map(([, v]) => v.valor), 1), [despesasPorCategoria]);
  const maxCatReceita = useMemo(() => Math.max(...receitasPorCategoria.map(([, v]) => v.valor), 1), [receitasPorCategoria]);

  const statusDistribuicao = useMemo(() => {
    const pago = transacoesMes.filter((t) => t.status === "pago").reduce((s, t) => s + t.valor, 0);
    const pendente = transacoesMes.filter((t) => t.status === "pendente").reduce((s, t) => s + t.valor, 0);
    const previsto = transacoesMes.filter((t) => t.status === "previsto").reduce((s, t) => s + t.valor, 0);
    const total = pago + pendente + previsto || 1;
    return { pago, pendente, previsto, total, pagoPct: (pago / total) * 100, pendentePct: (pendente / total) * 100, previstoPct: (previsto / total) * 100 };
  }, [transacoesMes]);

  const totaisAno = useMemo(() => {
    const doAno = transacoes.filter((t) => getYear(parseISO(t.data)) === selectedYear);
    const receitas = doAno.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
    const despesas = doAno.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
    return { receitas, despesas, saldo: receitas - despesas, qtd: doAno.length };
  }, [transacoes, selectedYear]);

  const periodosAnteriores = useMemo(() => {
    const mesAnterior = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const anoAnterior = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const transacoesMA = transacoes.filter((t) => {
      const d = parseISO(t.data);
      return getMonth(d) + 1 === mesAnterior && getYear(d) === anoAnterior;
    });
    const rec = transacoesMA.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
    const desp = transacoesMA.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
    return { receitas: rec, despesas: desp, saldo: rec - desp };
  }, [transacoes, selectedMonth, selectedYear]);

  const variacaoReceitas = useMemo(() => {
    if (periodosAnteriores.receitas === 0) return totaisMes.receitas > 0 ? 100 : 0;
    return ((totaisMes.receitas - periodosAnteriores.receitas) / periodosAnteriores.receitas) * 100;
  }, [totaisMes.receitas, periodosAnteriores.receitas]);

  const variacaoDespesas = useMemo(() => {
    if (periodosAnteriores.despesas === 0) return totaisMes.despesas > 0 ? 100 : 0;
    return ((totaisMes.despesas - periodosAnteriores.despesas) / periodosAnteriores.despesas) * 100;
  }, [totaisMes.despesas, periodosAnteriores.despesas]);

  const ticketMedio = useMemo(() => {
    const receitas = transacoesMes.filter((t) => t.tipo === "receita");
    if (receitas.length === 0) return 0;
    return receitas.reduce((s, t) => s + t.valor, 0) / receitas.length;
  }, [transacoesMes]);

  const custoFixoTotal = useMemo(() => {
    return contasFixas
      .filter((c) => c.status === "ativa" && c.tipo === "despesa")
      .reduce((s, c) => s + c.valor, 0);
  }, [contasFixas]);

  const indicadorSaude = useMemo(() => {
    let score = 50;
    if (totaisMes.saldo > 0) score += 20;
    if (margemLiquida > 20) score += 15;
    else if (margemLiquida > 10) score += 10;
    else if (margemLiquida > 5) score += 5;
    if (statusDistribuicao.pendentePct < 20) score += 10;
    if (totaisMes.receitas > custoFixoTotal * 2) score += 5;
    if (totaisAno.saldo > 0) score += 10;
    if (variacaoReceitas > 0) score += 5;
    if (variacaoDespesas < 0) score += 5;
    return Math.min(100, Math.max(0, score));
  }, [totaisMes, totaisAno, margemLiquida, statusDistribuicao, custoFixoTotal, variacaoReceitas, variacaoDespesas]);

  const saudeCor = useMemo(() => {
    if (indicadorSaude >= 70) return "text-emerald-500";
    if (indicadorSaude >= 40) return "text-amber-500";
    return "text-red-500";
  }, [indicadorSaude]);

  const saudeLabel = useMemo(() => {
    if (indicadorSaude >= 70) return "Saudável";
    if (indicadorSaude >= 40) return "Atenção";
    return "Crítico";
  }, [indicadorSaude]);

  const saudeBg = useMemo(() => {
    if (indicadorSaude >= 70) return "bg-emerald-500";
    if (indicadorSaude >= 40) return "bg-amber-500";
    return "bg-red-500";
  }, [indicadorSaude]);

  const burnRate = useMemo(() => {
    if (transacoesMes.length === 0) return 0;
    const totalDespesas = transacoesMes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
    return totalDespesas;
  }, [transacoesMes]);

  const mesAtual = MESES.find((m) => m.value === selectedMonth);

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard Financeiro</h2>
          <p className="text-muted-foreground italic text-sm mt-1">
            Análises, indicadores e insights financeiros da clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
              else setSelectedMonth((m) => m - 1);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue>{mesAtual?.label}</SelectValue>
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
              else setSelectedMonth((m) => m + 1);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totaisMes.receitas)}</div>
            <div className="flex items-center gap-1 mt-1">
              {variacaoReceitas >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={cn("text-xs font-medium", variacaoReceitas >= 0 ? "text-emerald-600" : "text-red-600")}>
                {formatPercent(variacaoReceitas)} vs mês anterior
              </span>
            </div>
            {totaisMes.receitasPendentes > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {formatCurrency(totaisMes.receitasPendentes)} pendentes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totaisMes.despesas)}</div>
            <div className="flex items-center gap-1 mt-1">
              {variacaoDespesas > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-red-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-emerald-500" />
              )}
              <span className={cn("text-xs font-medium", variacaoDespesas > 0 ? "text-red-600" : "text-emerald-600")}>
                {formatPercent(variacaoDespesas)} vs mês anterior
              </span>
            </div>
            {totaisMes.despesasPendentes > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {formatCurrency(totaisMes.despesasPendentes)} pendentes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do Mês</CardTitle>
            <Scale className={cn("h-4 w-4", totaisMes.saldo >= 0 ? "text-emerald-500" : "text-red-500")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totaisMes.saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
              {formatCurrency(totaisMes.saldo)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Percent className="h-3 w-3 text-muted-foreground" />
              <span className={cn("text-xs font-medium", margemLiquida >= 0 ? "text-emerald-600" : "text-red-600")}>
                Margem {formatPercent(margemLiquida)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saúde Financeira</CardTitle>
            <Gauge className={cn("h-4 w-4", saudeCor)} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${(indicadorSaude / 100) * 97.4} 97.4`}
                    strokeLinecap="round"
                    className={saudeCor}
                  />
                </svg>
                <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", saudeCor)}>
                  {indicadorSaude}
                </span>
              </div>
              <div>
                <Badge className={cn("text-xs", saudeBg.replace("bg-", "bg-").replace("text-", "text-white "))}>
                  {saudeLabel}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {totaisAno.saldo >= 0 ? "Ano positivo" : "Ano negativo"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
              <CardDescription>Comparativo mensal</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-3 w-3 rounded bg-emerald-500" />
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span>Despesas</span>
              </div>
              <Select value={chartView} onValueChange={(v) => setChartView(v as typeof chartView)}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12meses">12 meses</SelectItem>
                  <SelectItem value="anual">6 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-56">
              <div className="absolute inset-0 flex items-end gap-1.5 px-2 pb-6">
                {dadosPorMes.map((d, i) => {
                  const alturaRec = maxValor > 0 ? (d.receitas / maxValor) * 95 : 0;
                  const alturaDesp = maxValor > 0 ? (d.despesas / maxValor) * 95 : 0;
                  const alturaSaldoPx = maxValor > 0 ? Math.abs(d.saldo) / maxValor * 95 : 0;
                  const isSaldoPos = d.saldo >= 0;
                  const posSaldo = maxValor > 0 ? (d.saldo / maxValor) * 95 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                      <div className="flex items-end w-full gap-0.5 h-full" style={{ maxHeight: "95%" }}>
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full rounded-t bg-emerald-500 transition-all duration-300 min-h-[3px] group-hover:bg-emerald-400"
                            style={{ height: `${alturaRec}%` }}
                          >
                            {d.receitas > 0 && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-medium px-2 py-1 rounded shadow-xs border whitespace-nowrap z-10">
                                Receita: {formatCurrency(d.receitas)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full rounded-t bg-red-500 transition-all duration-300 min-h-[3px] group-hover:bg-red-400"
                            style={{ height: `${alturaDesp}%` }}
                          >
                            {d.despesas > 0 && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-medium px-2 py-1 rounded shadow-xs border whitespace-nowrap z-10">
                                Despesa: {formatCurrency(d.despesas)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {d.saldo !== 0 && (
                        <div
                          className={cn(
                            "absolute w-full h-0.5 transition-all duration-300 group-hover:h-1 z-20",
                            isSaldoPos ? "bg-emerald-400" : "bg-red-400"
                          )}
                          style={{ bottom: `${posSaldo + 6}%` }}
                        >
                          <div
                            className={cn(
                              "absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-background",
                              isSaldoPos ? "bg-emerald-400" : "bg-red-400"
                            )}
                          />
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 right-0 bg-popover text-popover-foreground text-[10px] font-medium px-2 py-1 rounded shadow-xs border whitespace-nowrap z-30">
                            Saldo: {formatCurrency(d.saldo)}
                          </div>
                        </div>
                      )}
                      <span className={cn(
                        "text-[10px] pt-1 font-medium",
                        d.saldo >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ChartPie className="h-4 w-4 text-blue-500" />
              Status dos Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${statusDistribuicao.pagoPct}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${statusDistribuicao.pendentePct}%` }}
                />
                <div
                  className="h-full bg-blue-300 transition-all"
                  style={{ width: `${statusDistribuicao.previstoPct}%` }}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>Pago</span>
                  </div>
                  <span className="font-medium">{formatCurrency(statusDistribuicao.pago)} ({statusDistribuicao.pagoPct.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span>Pendente</span>
                  </div>
                  <span className="font-medium">{formatCurrency(statusDistribuicao.pendente)} ({statusDistribuicao.pendentePct.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-blue-400" />
                    <span>Previsto</span>
                  </div>
                  <span className="font-medium">{formatCurrency(statusDistribuicao.previsto)} ({statusDistribuicao.previstoPct.toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(ticketMedio)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio por receita recebida no mês
            </p>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Custo fixo mensal</span>
                <span className="font-medium text-red-600">{formatCurrency(custoFixoTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Ponto de equilíbrio</span>
                <span className="font-medium">
                  {custoFixoTotal > 0 && ticketMedio > 0
                    ? `${Math.ceil(custoFixoTotal / ticketMedio)} consultas/mês`
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Indicadores Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Transações no mês</span>
                </div>
                <span className="text-sm font-medium">{transacoesMes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Contas fixas ativas</span>
                </div>
                <span className="text-sm font-medium">{contasFixas.filter((c) => c.status === "ativa").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Receitas acumuladas (ano)</span>
                </div>
                <span className="text-sm font-medium text-emerald-600">{formatCurrency(totaisAno.receitas)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Despesas acumuladas (ano)</span>
                </div>
                <span className="text-sm font-medium text-red-600">{formatCurrency(totaisAno.despesas)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Saldo acumulado (ano)</span>
                </div>
                <span className={cn("text-sm font-medium", totaisAno.saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatCurrency(totaisAno.saldo)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Receitas por Categoria
            </CardTitle>
            <CardDescription>Distribuição das receitas do mês</CardDescription>
          </CardHeader>
          <CardContent>
            {receitasPorCategoria.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Nenhuma receita no período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {receitasPorCategoria.map(([cat, dados]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-medium">{formatCurrency(dados.valor)}</span>
                        <span className="text-muted-foreground">({dados.qtd}x)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct(dados.valor, maxCatReceita)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-red-500" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>Distribuição das despesas do mês</CardDescription>
          </CardHeader>
          <CardContent>
            {despesasPorCategoria.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingDown className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Nenhuma despesa no período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {despesasPorCategoria.map(([cat, dados]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-medium">{formatCurrency(dados.valor)}</span>
                        <span className="text-muted-foreground">({dados.qtd}x)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${pct(dados.valor, maxCatDespesa)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {totaisMes.receitas > totaisMes.despesas * 1.5 && (
                <div className="flex items-start gap-2 text-xs">
                  <BadgeCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Receitas são <strong className="text-emerald-600">{(totaisMes.receitas / Math.max(totaisMes.despesas, 1)).toFixed(1)}x</strong> maiores que despesas — margem confortável.
                  </span>
                </div>
              )}
              {totaisMes.receitas < totaisMes.despesas && (
                <div className="flex items-start gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Despesas <strong className="text-red-600">superam</strong> receitas neste mês. Reveja custos ou aumente o faturamento.
                  </span>
                </div>
              )}
              {statusDistribuicao.pendentePct > 30 && (
                <div className="flex items-start gap-2 text-xs">
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-amber-600">{statusDistribuicao.pendentePct.toFixed(0)}%</strong> dos valores estão pendentes — priorize a cobrança.
                  </span>
                </div>
              )}
              {receitasPorCategoria.length > 0 && receitasPorCategoria[0] && (
                <div className="flex items-start gap-2 text-xs">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Principal fonte de receita: <strong className="text-emerald-600">{receitasPorCategoria[0][0]}</strong>
                    {receitasPorCategoria[0][1].valor > 0 && totaisMes.receitas > 0 && (
                      <span> ({pct(receitasPorCategoria[0][1].valor, totaisMes.receitas).toFixed(0)}% do total)</span>
                    )}
                  </span>
                </div>
              )}
              {despesasPorCategoria.length > 0 && despesasPorCategoria[0] && (
                <div className="flex items-start gap-2 text-xs">
                  <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Maior despesa: <strong className="text-red-600">{despesasPorCategoria[0][0]}</strong>
                    {despesasPorCategoria[0][1].valor > 0 && totaisMes.despesas > 0 && (
                      <span> ({pct(despesasPorCategoria[0][1].valor, totaisMes.despesas).toFixed(0)}% do total)</span>
                    )}
                  </span>
                </div>
              )}
              {contasFixas.filter((c) => c.status === "ativa").length === 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Nenhuma conta fixa cadastrada — cadastre contas recorrentes para melhor previsibilidade.
                  </span>
                </div>
              )}
              {transacoesMes.length === 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <Ban className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Nenhuma transação registrada neste mês. Adicione transações para gerar análises.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Previsão & Projeção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Receita média mensal (12m)</span>
                <span className="text-sm font-medium">
                  {formatCurrency(
                    dadosPorMes.reduce((s, d) => s + d.receitas, 0) / Math.max(dadosPorMes.length, 1)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Despesa média mensal (12m)</span>
                <span className="text-sm font-medium">
                  {formatCurrency(
                    dadosPorMes.reduce((s, d) => s + d.despesas, 0) / Math.max(dadosPorMes.length, 1)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Saldo médio mensal</span>
                <span className={cn("text-sm font-medium",
                  dadosPorMes.reduce((s, d) => s + d.saldo, 0) >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {formatCurrency(dadosPorMes.reduce((s, d) => s + d.saldo, 0) / Math.max(dadosPorMes.length, 1))}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Burn rate (despesas/mês)</span>
                <span className="text-sm font-medium text-red-600">{formatCurrency(burnRate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
              Meses com Melhor Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(() => {
                const mesesComDados = dadosPorMes.filter((d) => d.qtd > 0 && !(d.mes === selectedMonth && d.ano === selectedYear));
                if (mesesComDados.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">Sem dados suficientes</p>
                    </div>
                  );
                }
                return mesesComDados
                  .slice()
                  .sort((a, b) => b.saldo - a.saldo)
                  .slice(0, 5)
                  .map((d, i) => (
                    <div key={d.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold text-white",
                          i === 0 ? "bg-amber-500" : "bg-muted-foreground/30"
                        )}>
                          {i + 1}
                        </div>
                        <span className="font-medium">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">{formatCurrency(d.receitas)}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-red-600">{formatCurrency(d.despesas)}</span>
                        <span className={cn("font-semibold min-w-[80px] text-right", d.saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {formatCurrency(d.saldo)}
                        </span>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
