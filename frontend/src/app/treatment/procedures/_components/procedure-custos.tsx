"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Percent, DollarSign, Clock, Building2, CreditCard, Banknote, TrendingUp, Calculator, Goal, ChevronDown, ChevronUp, FlaskConical, Handshake, ReceiptText } from "lucide-react";
import type { Procedure } from "../page";

const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface CustoEntry {
  id?: number;
  tipo: string;
  tipoValor: "PERCENTUAL" | "FIXO";
  valor: number;
  descricao: string;
}

interface ProcedimentoCustosProps {
  onBack: () => void;
}

export function ProcedimentoCustos({ onBack }: ProcedimentoCustosProps) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProc, setSelectedProc] = useState<Procedure | null>(null);
  const [custos, setCustos] = useState<CustoEntry[]>([]);
  const [horaClinicaValor, setHoraClinicaValor] = useState(100);
  const [descontoDinheiro, setDescontoDinheiro] = useState(10);
  const [taxasMaquininha, setTaxasMaquininha] = useState<Record<number, number>>({});
  const [savingHoraClinica, setSavingHoraClinica] = useState(false);
  const [savingDesconto, setSavingDesconto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simAberto, setSimAberto] = useState(true);
  const [parcelas, setParcelas] = useState(1);
  const [simParcelas, setSimParcelas] = useState(1);
  const [simPrecoVenda, setSimPrecoVenda] = useState(0);
  const [simLucroDesejado, setSimLucroDesejado] = useState(0);

  function getCusto(tipo: string): CustoEntry | undefined {
    return custos.find((c) => c.tipo === tipo);
  }

  function getCustoValor(tipo: string, fallback = 0): number {
    return getCusto(tipo)?.valor ?? fallback;
  }

  function setCustoValor(tipo: string, tipoValor: "PERCENTUAL" | "FIXO", valor: number) {
    setCustos((prev) => {
      const idx = prev.findIndex((c) => c.tipo === tipo);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], tipoValor, valor };
        return next;
      }
      return [...prev, { tipo, tipoValor, valor, descricao: "" }];
    });
  }

  useEffect(() => {
    fetch("/api/proxy/procedimentos")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Procedure[]) => setProcedures(data))
      .catch(() => setProcedures([]));
    fetch("/api/proxy/clinica-config?chave=hora_clinica_valor")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.valor) setHoraClinicaValor(Number(data.valor)); })
      .catch(() => {});
    fetch("/api/proxy/clinica-config?chave=desconto_dinheiro")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.valor) setDescontoDinheiro(Number(data.valor)); })
      .catch(() => {});
    fetch("/api/proxy/clinica-config?chave=taxas_maquininha")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.valor) {
          try { setTaxasMaquininha(JSON.parse(data.valor)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProc) { setCustos([]); return; }
    setLoading(true);
    fetch(`/api/proxy/procedimentos-custos?procedimentoId=${selectedProc.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: CustoEntry[]) => {
        if (data.length > 0) {
          setCustos(data.filter((c) => c.tipo !== "GASTO_CLINICA"));
        } else {
          setCustos([
            { tipo: "GASTO_MATERIAL", tipoValor: "FIXO", valor: 0, descricao: "" },
            { tipo: "LABORATORIO_PROTESE", tipoValor: "FIXO", valor: 0, descricao: "" },
            { tipo: "NOTA_FISCAL", tipoValor: "PERCENTUAL", valor: 0, descricao: "" },
            { tipo: "COMISSAO_DENTISTA", tipoValor: "PERCENTUAL", valor: 0, descricao: "" },
            { tipo: "COMISSAO_VENDEDOR", tipoValor: "PERCENTUAL", valor: 0, descricao: "" },
            { tipo: "TAXA_MAQUININHA", tipoValor: "PERCENTUAL", valor: 0, descricao: "" },
          ]);
        }
      })
      .catch(() => setCustos([]))
      .finally(() => setLoading(false));
  }, [selectedProc]);

  async function salvarConfig(chave: string, valor: string, label: string, setSaving: (v: boolean) => void) {
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/clinica-config?chave=${chave}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, valor }),
      });
      if (res.ok) toast.success(`${label} salvo!`);
      else { const e = await res.json().catch(() => ({ error: "unknown" })); toast.error(`Erro ao salvar ${label}: ${e?.error || e?.details || "Erro"}`); }
    } catch { toast.error("Erro de conexão"); }
    finally { setSaving(false); }
  }

  async function salvar() {
    if (!selectedProc) return;
    setSaving(true);
    try {
      const payload = custos.map((c) => ({ tipo: c.tipo, tipoValor: c.tipoValor, valor: c.valor, descricao: c.descricao || null }));
      const res = await fetch(`/api/proxy/procedimentos-custos?procedimentoId=${selectedProc.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) toast.success("Custos salvos com sucesso!");
      else { const e = await res.json().catch(() => ({})); toast.error(`Erro ao salvar custos: ${e?.error || "Erro"}`); }
    } catch { toast.error("Erro de conexão com o servidor"); }
    finally { setSaving(false); }
  }

  const duracaoHoras = selectedProc?.duracaoMinutos ? selectedProc.duracaoMinutos / 60 : 0;
  const gastoClinica = duracaoHoras * horaClinicaValor;
  const preco = selectedProc?.preco || 0;

  const custoMateriais = getCustoValor("GASTO_MATERIAL");
  const custoLaboratorio = getCustoValor("LABORATORIO_PROTESE");
  const aliquotaImposto = getCustoValor("NOTA_FISCAL");
  const comissaoDentista = getCustoValor("COMISSAO_DENTISTA");
  const comissaoVendedor = getCustoValor("COMISSAO_VENDEDOR");
  const getTaxaMaq = (n: number) => taxasMaquininha[n] ?? (2 + (n - 1) * 1.5);

  const taxaMaquininha = getTaxaMaq(parcelas);
  const totalPercentual = comissaoDentista + comissaoVendedor + aliquotaImposto + taxaMaquininha;
  const totalPercentualSemTaxa = comissaoDentista + comissaoVendedor + aliquotaImposto;
  const totalPercentualDinheiro = comissaoDentista + comissaoVendedor;
  const totalFixo = custoMateriais + custoLaboratorio;
  const percentualFixo = preco > 0 ? ((totalFixo + gastoClinica) / preco) * 100 : 0;
  const margem = 100 - (totalPercentual + percentualFixo);

  const lucroCartao = preco > 0 ? preco - preco * totalPercentual / 100 - totalFixo - gastoClinica : 0;
  const margemCartao = preco > 0 ? (lucroCartao / preco) * 100 : 0;
  const receitaDinheiroDesc = preco * (1 - descontoDinheiro / 100);
  const lucroDinheiroDesc = receitaDinheiroDesc > 0 ? receitaDinheiroDesc - receitaDinheiroDesc * totalPercentualDinheiro / 100 - totalFixo - gastoClinica : 0;
  const margemDinheiroDesc = receitaDinheiroDesc > 0 ? (lucroDinheiroDesc / receitaDinheiroDesc) * 100 : 0;
  const lucroDinheiro = preco > 0 ? preco - preco * totalPercentualDinheiro / 100 - totalFixo - gastoClinica : 0;
  const margemDinheiro = preco > 0 ? (lucroDinheiro / preco) * 100 : 0;

  const simTaxaMaq = getTaxaMaq(simParcelas);
  const simSomaPct = aliquotaImposto + comissaoDentista + comissaoVendedor + simTaxaMaq;
  const simFixos = gastoClinica + custoMateriais + custoLaboratorio;
  const simLucro = simPrecoVenda > 0 ? simPrecoVenda - simPrecoVenda * simSomaPct / 100 - simFixos : 0;
  const simMargem = simPrecoVenda > 0 ? (simLucro / simPrecoVenda) * 100 : 0;
  const simFator = 1 - simSomaPct / 100;
  const simPrecoIdeal = simLucroDesejado > 0 && simFator > 0 ? (simLucroDesejado + simFixos) / simFator : 0;
  const simLucroIdeal = simPrecoIdeal > 0 ? simPrecoIdeal - simPrecoIdeal * simSomaPct / 100 - simFixos : 0;

  if (!selectedProc) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Planejamento de Custos</h2>
          <Button variant="outline" onClick={onBack}>Voltar</Button>
        </div>
        <div className="rounded-lg border bg-white p-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            <Label className="text-sm text-slate-600 whitespace-nowrap">Valor Hora Clínica:</Label>
            <span className="text-sm text-slate-500">R$</span>
            <Input type="number" step="0.01" min="0" value={horaClinicaValor} onChange={(e) => setHoraClinicaValor(Number(e.target.value))} className="w-24 h-8 text-sm" />
            <span className="text-xs text-slate-400">/h</span>
            <Button onClick={() => salvarConfig("hora_clinica_valor", String(horaClinicaValor), "Valor hora clínica", setSavingHoraClinica)} disabled={savingHoraClinica} variant="outline" size="sm" className="text-xs"><Save className="h-3 w-3 mr-1" />{savingHoraClinica ? "Salvando..." : "Salvar"}</Button>
          </div>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-slate-400" />
            <Label className="text-sm text-slate-600 whitespace-nowrap">Desconto no Dinheiro:</Label>
            <Input type="number" step="0.1" min="0" max="100" value={descontoDinheiro} onChange={(e) => setDescontoDinheiro(Number(e.target.value))} className="w-20 h-8 text-sm text-right" />
            <span className="text-xs text-slate-400">%</span>
            <Button onClick={() => salvarConfig("desconto_dinheiro", String(descontoDinheiro), "Desconto dinheiro", setSavingDesconto)} disabled={savingDesconto} variant="outline" size="sm" className="text-xs"><Save className="h-3 w-3 mr-1" />{savingDesconto ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
        <p className="text-slate-500 text-sm">Selecione um procedimento para planejar seus custos.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {procedures.filter((p) => p.ativo).map((p) => (
            <button key={p.id} onClick={() => setSelectedProc(p)} className="text-left p-4 rounded-lg border border-slate-200 hover:border-[#1E293B] hover:shadow-sm transition-all bg-white">
              <div className="font-medium text-slate-900">{p.nome}</div>
              <div className="text-xs text-slate-400 mt-1">{p.categoria && `${p.categoria}`}{p.especialidade ? ` • ${p.especialidade}` : ""}</div>
              <div className="text-sm font-semibold text-emerald-600 mt-2">{currency(p.preco)}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (<div className="text-center py-20 text-slate-400 font-medium italic">Carregando custos...</div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button onClick={() => setSelectedProc(null)} className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-1">&larr; Voltar para lista</button>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            {selectedProc.nome}
            <Badge variant="outline" className="text-xs font-normal">{currency(preco)}</Badge>
            <Badge variant="outline" className="text-xs font-normal text-slate-400">{selectedProc.duracaoMinutos}min</Badge>
          </h2>
        </div>
        <Button onClick={salvar} disabled={saving} className="gap-2 bg-[#1E293B] hover:bg-[#0F172A] text-white"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar Custos"}</Button>
      </div>

      <div className="rounded-lg border bg-white p-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" />
          <Label className="text-sm text-slate-600 whitespace-nowrap">Valor Hora Clínica:</Label>
          <span className="text-sm text-slate-500">R$</span>
          <Input type="number" step="0.01" min="0" value={horaClinicaValor} onChange={(e) => setHoraClinicaValor(Number(e.target.value))} className="w-24 h-8 text-sm" />
          <span className="text-xs text-slate-400">/h</span>
          <Button onClick={() => salvarConfig("hora_clinica_valor", String(horaClinicaValor), "Valor hora clínica", setSavingHoraClinica)} disabled={savingHoraClinica} variant="outline" size="sm" className="text-xs"><Save className="h-3 w-3 mr-1" />{savingHoraClinica ? "Salvando..." : "Salvar"}</Button>
        </div>
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-slate-400" />
          <Label className="text-sm text-slate-600 whitespace-nowrap">Desconto no Dinheiro:</Label>
          <Input type="number" step="0.1" min="0" max="100" value={descontoDinheiro} onChange={(e) => setDescontoDinheiro(Number(e.target.value))} className="w-20 h-8 text-sm text-right" />
          <span className="text-xs text-slate-400">%</span>
          <Button onClick={() => salvarConfig("desconto_dinheiro", String(descontoDinheiro), "Desconto dinheiro", setSavingDesconto)} disabled={savingDesconto} variant="outline" size="sm" className="text-xs"><Save className="h-3 w-3 mr-1" />{savingDesconto ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4 bg-white"><div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Custo %</div><div className={`text-2xl font-bold ${totalPercentual > 0 ? "text-red-600" : "text-slate-400"}`}>{totalPercentual.toFixed(1)}%</div></div>
        <div className="rounded-lg border p-4 bg-white"><div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Custo Fixo</div><div className={`text-2xl font-bold ${totalFixo + gastoClinica > 0 ? "text-red-600" : "text-slate-400"}`}>{currency(totalFixo + gastoClinica)}</div></div>
        <div className="rounded-lg border p-4 bg-white"><div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Margem Bruta</div><div className={`text-2xl font-bold ${margem >= 0 ? "text-emerald-600" : "text-red-600"}`}>{margem.toFixed(1)}%</div></div>
        <div className="rounded-lg border p-4 bg-slate-50"><div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Preço</div><div className="text-2xl font-bold text-slate-800">{currency(preco)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-sky-500" /> Custos Base</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 font-medium">Custo de Materiais / Kit Clínico</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" min="0" value={custoMateriais || ""} onChange={(e) => setCustoValor("GASTO_MATERIAL", "FIXO", Number(e.target.value))} className="h-9 w-36 text-right" placeholder="0,00" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium">Custo de Laboratório / Prótese</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-slate-400">R$</span>
                <Input type="number" step="0.01" min="0" value={custoLaboratorio || ""} onChange={(e) => setCustoValor("LABORATORIO_PROTESE", "FIXO", Number(e.target.value))} className="h-9 w-36 text-right" placeholder="0,00" />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-800">Gasto da Clínica</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] px-1.5 py-0">Automático</Badge>
                </div>
                <div className="text-right">
                  <span className="font-bold text-base text-slate-900">{currency(gastoClinica)}</span>
                  <p className="text-[10px] text-slate-400 leading-tight">{selectedProc.duracaoMinutos}min × R$ {horaClinicaValor.toFixed(2)}/h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2"><ReceiptText className="h-4 w-4 text-violet-500" /> Regras Financeiras e Taxas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1"><Percent className="h-3.5 w-3.5" /> Alíquota de Imposto / Nota Fiscal</Label>
              <div className="flex items-center gap-1 mt-1">
                <Input type="number" step="0.1" min="0" max="100" value={aliquotaImposto} onChange={(e) => setCustoValor("NOTA_FISCAL", "PERCENTUAL", Number(e.target.value))} className="h-9 w-20 text-right" />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Comissão do Dentista</Label>
              <div className="flex items-center gap-1 mt-1">
                <Input type="number" step="0.1" min="0" max="100" value={comissaoDentista} onChange={(e) => setCustoValor("COMISSAO_DENTISTA", "PERCENTUAL", Number(e.target.value))} className="h-9 w-20 text-right" />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1"><Handshake className="h-3.5 w-3.5" /> Comissão de Venda / Consultor</Label>
              <div className="flex items-center gap-1 mt-1">
                <Input type="number" step="0.1" min="0" max="100" value={comissaoVendedor} onChange={(e) => setCustoValor("COMISSAO_VENDEDOR", "PERCENTUAL", Number(e.target.value))} className="h-9 w-20 text-right" />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Parcelas no Cartão</Label>
              <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className="border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 bg-white mt-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}x {n === 1 ? "(-)" : `(${getTaxaMaq(n).toFixed(1)}%)`}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-lg border-2 p-4 ${lucroCartao >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}>
          <div className="flex items-center gap-2 mb-3"><CreditCard className={`h-5 w-5 ${lucroCartao >= 0 ? "text-emerald-600" : "text-red-600"}`} /><h3 className="font-semibold text-slate-800">Lucro no Cartão</h3></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Receita</span><span className="font-medium text-slate-800">{currency(preco)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Custos (%) <span className="text-xs text-slate-400">(c/ taxa maq.)</span></span><span className="font-medium text-red-600">-{currency(preco * totalPercentual / 100)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Custos fixos</span><span className="font-medium text-red-600">-{currency(totalFixo + gastoClinica)}</span></div>
            <hr className="border-slate-200" />
            <div className="flex justify-between text-base"><span className="font-semibold text-slate-700">Lucro</span><span className={`font-bold text-lg ${lucroCartao >= 0 ? "text-emerald-600" : "text-red-600"}`}>{currency(lucroCartao)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-slate-400">Margem</span><Badge className={margemCartao >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{margemCartao.toFixed(1)}%</Badge></div>
          </div>
        </div>

        <div className={`rounded-lg border-2 p-4 ${lucroDinheiroDesc >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}>
          <div className="flex items-center gap-2 mb-3"><Banknote className={`h-5 w-5 ${lucroDinheiroDesc >= 0 ? "text-emerald-600" : "text-red-600"}`} /><h3 className="font-semibold text-slate-800">Dinheiro c/ Desconto</h3></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Receita <span className="text-xs text-slate-400">(-{descontoDinheiro}%)</span></span><span className="font-medium text-slate-800">{currency(receitaDinheiroDesc)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Custos (%) <span className="text-xs text-slate-400">(sem taxa/NF)</span></span><span className="font-medium text-red-600">-{currency(receitaDinheiroDesc * totalPercentualDinheiro / 100)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Custos fixos</span><span className="font-medium text-red-600">-{currency(totalFixo + gastoClinica)}</span></div>
            <hr className="border-slate-200" />
            <div className="flex justify-between text-base"><span className="font-semibold text-slate-700">Lucro</span><span className={`font-bold text-lg ${lucroDinheiroDesc >= 0 ? "text-emerald-600" : "text-red-600"}`}>{currency(lucroDinheiroDesc)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-slate-400">Margem</span><Badge className={margemDinheiroDesc >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{margemDinheiroDesc.toFixed(1)}%</Badge></div>
          </div>
        </div>

        <div className={`rounded-lg border-2 p-4 ${lucroDinheiro >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}>
          <div className="flex items-center gap-2 mb-3"><Banknote className={`h-5 w-5 ${lucroDinheiro >= 0 ? "text-emerald-600" : "text-red-600"}`} /><h3 className="font-semibold text-slate-800">Dinheiro s/ Desconto</h3></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Receita</span><span className="font-medium text-slate-800">{currency(preco)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Custos (%) <span className="text-xs text-slate-400">(sem taxa/NF)</span></span><span className="font-medium text-red-600">-{currency(preco * totalPercentualDinheiro / 100)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Custos fixos</span><span className="font-medium text-red-600">-{currency(totalFixo + gastoClinica)}</span></div>
            <hr className="border-slate-200" />
            <div className="flex justify-between text-base"><span className="font-semibold text-slate-700">Lucro</span><span className={`font-bold text-lg ${lucroDinheiro >= 0 ? "text-emerald-600" : "text-red-600"}`}>{currency(lucroDinheiro)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-slate-400">Margem</span><Badge className={margemDinheiro >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{margemDinheiro.toFixed(1)}%</Badge></div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <button onClick={() => setSimAberto(!simAberto)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-400" />
            <span className="font-semibold text-slate-800">Simulador de Preços</span>
            <span className="text-xs text-slate-400 font-normal">(calculadora de margem por dentro)</span>
          </div>
          {simAberto ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {simAberto && (
          <div className="px-5 pb-5 space-y-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">Parcelas:</span>
                <select value={simParcelas} onChange={(e) => setSimParcelas(Number(e.target.value))} className="border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-800 bg-white">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>{n}x</option>))}
                </select>
                <span className="text-xs text-slate-400">(taxa maq.: {simTaxaMaq.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input type="checkbox" id="usarPrecoProc" checked={simPrecoVenda === preco} onChange={(e) => setSimPrecoVenda(e.target.checked ? preco : 0)} className="rounded border-slate-300" />
                <label htmlFor="usarPrecoProc" className="text-xs text-slate-500">Usar preço do procedimento ({currency(preco)})</label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-emerald-500" /> Definir Preço de Venda</h4>
                <div className="flex items-center gap-2"><span className="text-sm text-slate-400">R$</span><input type="number" step="0.01" min="0" value={simPrecoVenda || ""} onChange={(e) => setSimPrecoVenda(Number(e.target.value))} className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-right font-semibold text-slate-800" placeholder="0,00" /></div>
                {simPrecoVenda > 0 && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500"><span>Custo Hora</span><span className="text-slate-800">{currency(gastoClinica)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Materiais</span><span className="text-slate-800">{currency(custoMateriais)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Laboratório</span><span className="text-slate-800">{currency(custoLaboratorio)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Custos % ({simSomaPct.toFixed(1)}%)</span><span className="text-slate-800">{currency(simPrecoVenda * simSomaPct / 100)}</span></div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between font-semibold"><span>Lucro</span><span className={simLucro >= 0 ? "text-emerald-600" : "text-red-600"}>{currency(simLucro)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Margem</span><Badge className={simMargem >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{simMargem.toFixed(1)}%</Badge></div>
                  </div>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Goal className="h-4 w-4 text-violet-500" /> Definir Lucro Desejado</h4>
                <div className="flex items-center gap-2"><span className="text-sm text-slate-400">R$</span><input type="number" step="0.01" min="0" value={simLucroDesejado || ""} onChange={(e) => setSimLucroDesejado(Number(e.target.value))} className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-right font-semibold text-slate-800" placeholder="0,00" /></div>
                {simLucroDesejado > 0 && simPrecoIdeal > 0 && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between font-bold text-emerald-700 text-base"><span>Preço Sugerido</span><span>{currency(simPrecoIdeal)}</span></div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between text-slate-500"><span>Custos fixos</span><span className="text-slate-800">{currency(simFixos)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Impostos + taxas ({simSomaPct.toFixed(1)}%)</span><span className="text-slate-800">{currency(simPrecoIdeal * simSomaPct / 100)}</span></div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between font-semibold"><span>Lucro</span><span className="text-emerald-600">{currency(simLucroIdeal)}</span></div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">{(simLucroIdeal / simPrecoIdeal * 100).toFixed(1)}% margem</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
