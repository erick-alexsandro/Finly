"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  FlaskConical,
  Microscope,
  DollarSign,
  Percent,
  CreditCard,
  User,
  Handshake,
  Goal,
  TrendingUp,
  Calculator,
  Info,
} from "lucide-react";

const VALOR_HORA_CLINICA_DEFAULT = 100;

/** Calcula a taxa da maquininha com base no número de parcelas
 *  Usa as taxas cadastradas ou fallback para fórmula hardcoded */
function calcularTaxaMaquininha(parcelas: number, taxas: Record<number, number>): number {
  if (parcelas < 1) return 0;
  return taxas[parcelas] ?? (2 + (parcelas - 1) * 1.5);
}

/** Cálculo por dentro (Markup reverso): os percentuais incidem sobre o preço final.
 *  Dado um preço P, os custos percentuais são P * (somaPercentuais / 100)
 *  e os custos fixos são somados diretamente.
 *  Lucro = P - P * (somaPct / 100) - custosFixos */
function calcularLucro(
  preco: number,
  somaPercentuais: number,
  custosFixos: number
): { lucro: number; margem: number } {
  if (preco <= 0) return { lucro: 0, margem: 0 };
  const deducao = preco * (somaPercentuais / 100);
  const lucro = preco - deducao - custosFixos;
  const margem = (lucro / preco) * 100;
  return { lucro, margem };
}

/** Cálculo de preço ideal via markup reverso:
 *  Queremos Lucro = L desejado.
 *  L = P - P * (somaPct / 100) - custosFixos
 *  L = P * (1 - somaPct/100) - custosFixos
 *  P = (L + custosFixos) / (1 - somaPct/100)
 */
function calcularPrecoIdeal(
  lucroDesejado: number,
  somaPercentuais: number,
  custosFixos: number
): number {
  const fator = 1 - somaPercentuais / 100;
  if (fator <= 0) return 0;
  const preco = (lucroDesejado + custosFixos) / fator;
  return preco;
}

const parcelaOptions = Array.from({ length: 12 }, (_, i) => i + 1);

function currency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ProcedimentoSimulador() {
  const [nomeProcedimento, setNomeProcedimento] = useState("");
  const [tempoMinutos, setTempoMinutos] = useState(60);
  const [custoMateriais, setCustoMateriais] = useState(0);
  const [custoLaboratorio, setCustoLaboratorio] = useState(0);
  const [aliquotaImposto, setAliquotaImposto] = useState(6);
  const [comissaoDentista, setComissaoDentista] = useState(30);
  const [comissaoVendedor, setComissaoVendedor] = useState(5);
  const [parcelas, setParcelas] = useState(1);
  const [precoVenda, setPrecoVenda] = useState(0);
  const [lucroDesejado, setLucroDesejado] = useState(0);
  const [horaClinicaValor, setHoraClinicaValor] = useState(VALOR_HORA_CLINICA_DEFAULT);
  const [taxasMaquininha, setTaxasMaquininha] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch("/api/proxy/clinica-config?chave=hora_clinica_valor")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.valor) setHoraClinicaValor(Number(data.valor)); })
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

  const taxaMaquininha = calcularTaxaMaquininha(parcelas, taxasMaquininha);
  const somaPercentuais = aliquotaImposto + comissaoDentista + comissaoVendedor + taxaMaquininha;
  const custoHoraClinica = (tempoMinutos / 60) * horaClinicaValor;
  const custosFixos = custoHoraClinica + custoMateriais + custoLaboratorio;

  const { lucro, margem } = calcularLucro(precoVenda, somaPercentuais, custosFixos);
  const precoIdeal = calcularPrecoIdeal(lucroDesejado, somaPercentuais, custosFixos);
  const lucroIdeal = precoIdeal > 0 ? calcularLucro(precoIdeal, somaPercentuais, custosFixos) : { lucro: 0, margem: 0 };

  const custoHoraClinicaLabel = `${tempoMinutos}min ÷ 60 × R$ ${horaClinicaValor.toFixed(2)}/h`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-slate-400" />
          Simulador de Preços
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Simule custos e defina o preço de venda ideal para cada procedimento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-sky-500" />
              Custos Base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 font-medium">Nome do Procedimento</Label>
              <Input
                value={nomeProcedimento}
                onChange={(e) => setNomeProcedimento(e.target.value)}
                placeholder="Ex: Clareamento a Laser"
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Tempo Estimado
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number" min={1} value={tempoMinutos}
                  onChange={(e) => setTempoMinutos(Number(e.target.value))}
                  className="h-9 w-24 text-right"
                />
                <span className="text-sm text-slate-400">minutos</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" /> Custo de Materiais / Kit Clínico
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-slate-400">R$</span>
                <Input
                  type="number" step="0.01" min={0} value={custoMateriais || ""}
                  onChange={(e) => setCustoMateriais(Number(e.target.value))}
                  className="h-9 w-32 text-right"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Microscope className="h-3.5 w-3.5" /> Custo de Laboratório / Prótese
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-slate-400">R$</span>
                <Input
                  type="number" step="0.01" min={0} value={custoLaboratorio || ""}
                  onChange={(e) => setCustoLaboratorio(Number(e.target.value))}
                  className="h-9 w-32 text-right"
                  placeholder="0,00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Regras Financeiras e Taxas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Percent className="h-3.5 w-3.5" /> Alíquota de Imposto / Nota Fiscal
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number" step="0.1" min={0} max={100} value={aliquotaImposto}
                  onChange={(e) => setAliquotaImposto(Number(e.target.value))}
                  className="h-9 w-20 text-right"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Comissão do Dentista
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number" step="0.1" min={0} max={100} value={comissaoDentista}
                  onChange={(e) => setComissaoDentista(Number(e.target.value))}
                  className="h-9 w-20 text-right"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Handshake className="h-3.5 w-3.5" /> Comissão de Venda / Consultor
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number" step="0.1" min={0} max={100} value={comissaoVendedor}
                  onChange={(e) => setComissaoVendedor(Number(e.target.value))}
                  className="h-9 w-20 text-right"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" /> Limite de Parcelamento
              </Label>
              <Select value={String(parcelas)} onValueChange={(v) => setParcelas(Number(v))}>
                <SelectTrigger className="w-28 h-9 mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {parcelaOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1.5">
                Taxa maquininha: {taxaMaquininha.toFixed(1)}%
                <span className="text-slate-300 ml-1">
                  ({parcelas}x)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Goal className="h-4 w-4 text-emerald-500" />
              Painel de Resultados
            </CardTitle>
            <Badge variant="outline" className="text-xs font-normal text-slate-400 gap-1.5">
              <Info className="h-3 w-3" />
              Cálculo por dentro (impostos e taxas sobre o preço final)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="preco" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTab value="preco" className="text-xs">Definir Preço de Venda</TabsTab>
              <TabsTab value="lucro" className="text-xs">Definir Lucro Desejado</TabsTab>
            </TabsList>

            <TabsPanel value="preco" className="mt-4 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="text-sm text-slate-600 whitespace-nowrap">Qual preço deseja cobrar?</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-400">R$</span>
                  <Input
                    type="number" step="0.01" min={0}
                    value={precoVenda || ""}
                    onChange={(e) => setPrecoVenda(Number(e.target.value))}
                    className="h-9 w-32 text-right text-base font-semibold"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {precoVenda > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Custos Fixos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-md">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-400" /> Hora Clínica
                        </span>
                        <span className="font-medium text-slate-800">{currency(custoHoraClinica)}</span>
                      </div>
                      {custoHoraClinica > 0 && (
                        <p className="text-[10px] text-slate-400 pl-3 -mt-1">{custoHoraClinicaLabel}</p>
                      )}
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-md">
                        <span className="text-slate-500">Materiais</span>
                        <span className="font-medium text-slate-800">{currency(custoMateriais)}</span>
                      </div>
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-md">
                        <span className="text-slate-500">Laboratório</span>
                        <span className="font-medium text-slate-800">{currency(custoLaboratorio)}</span>
                      </div>
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-100 rounded-md font-medium">
                        <span className="text-slate-600">Total Custos Fixos</span>
                        <span className="text-slate-900">{currency(custosFixos)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Custos Variáveis ({somaPercentuais.toFixed(1)}% do preço)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-md">
                        <span className="text-slate-500">Imposto NF ({aliquotaImposto}%)</span>
                        <span className="font-medium text-slate-800">{currency(precoVenda * aliquotaImposto / 100)}</span>
                      </div>
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-md">
                        <span className="text-slate-500">Comissão Dentista ({comissaoDentista}%)</span>
                        <span className="font-medium text-slate-800">{currency(precoVenda * comissaoDentista / 100)}</span>
                      </div>
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-md">
                        <span className="text-slate-500">Comissão Vendedor ({comissaoVendedor}%)</span>
                        <span className="font-medium text-slate-800">{currency(precoVenda * comissaoVendedor / 100)}</span>
                      </div>
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-50 rounded-md">
                        <span className="text-slate-500">Taxa Maquininha ({taxaMaquininha.toFixed(1)}%)</span>
                        <span className="font-medium text-slate-800">{currency(precoVenda * taxaMaquininha / 100)}</span>
                      </div>
                      <div className="flex justify-between text-sm px-3 py-1.5 bg-slate-100 rounded-md font-medium">
                        <span className="text-slate-600">Total Deduções</span>
                        <span className="text-slate-900">{currency(precoVenda * somaPercentuais / 100)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {precoVenda > 0 && (
                <>
                  <Progress
                    value={Math.min(margem + (100 - margem), 100)}
                    className="h-2"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4 bg-white text-center">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Preço de Venda</div>
                      <div className="text-xl font-bold text-slate-800 mt-1">{currency(precoVenda)}</div>
                    </div>
                    <div className="rounded-lg border p-4 bg-white text-center">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Custo Total</div>
                      <div className="text-xl font-bold text-red-500 mt-1">
                        {currency(custosFixos + precoVenda * somaPercentuais / 100)}
                      </div>
                    </div>
                    <div className="rounded-lg border-2 p-4 text-center"
                      style={{
                        borderColor: lucro >= 0 ? "#10B981" : "#EF4444",
                        backgroundColor: lucro >= 0 ? "#F0FDF4" : "#FEF2F2",
                      }}
                    >
                      <div className="text-xs uppercase tracking-wide"
                        style={{ color: lucro >= 0 ? "#059669" : "#DC2626" }}
                      >
                        Lucro Líquido
                      </div>
                      <div className="text-xl font-bold mt-1"
                        style={{ color: lucro >= 0 ? "#059669" : "#DC2626" }}
                      >
                        {currency(lucro)}
                      </div>
                      <Badge
                        className={`mt-1 text-xs ${lucro >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {margem.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </>
              )}

              {precoVenda <= 0 && (
                <div className="text-center py-8 text-sm text-slate-400 italic border border-dashed rounded-lg">
                  Digite um preço de venda para ver a simulação completa
                </div>
              )}
            </TabsPanel>

            <TabsPanel value="lucro" className="mt-4 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="text-sm text-slate-600 whitespace-nowrap">Quanto deseja lucrar por procedimento?</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-400">R$</span>
                  <Input
                    type="number" step="0.01" min={0}
                    value={lucroDesejado || ""}
                    onChange={(e) => setLucroDesejado(Number(e.target.value))}
                    className="h-9 w-32 text-right text-base font-semibold"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {lucroDesejado > 0 && precoIdeal > 0 && (
                <>
                  <Progress
                    value={Math.min(lucroIdeal.margem + (100 - lucroIdeal.margem), 100)}
                    className="h-2"
                  />

                  <div className="rounded-lg border-2 p-6 text-center max-w-md mx-auto"
                    style={{
                      borderColor: "#10B981",
                      backgroundColor: "#F0FDF4",
                    }}
                  >
                    <div className="text-xs text-emerald-600 uppercase tracking-wide font-semibold mb-1">
                      Preço de Venda Sugerido
                    </div>
                    <div className="text-3xl font-bold text-emerald-700 mb-1">
                      {currency(precoIdeal)}
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        Lucro: {currency(lucroIdeal.lucro)}
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                        Margem: {lucroIdeal.margem.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Composição do Preço</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Custos Fixos</td>
                            <td className="py-1.5 text-right font-medium text-slate-800">{currency(custosFixos)}</td>
                            <td className="py-1.5 text-right text-xs text-slate-400">{(custosFixos / precoIdeal * 100).toFixed(1)}%</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Impostos + Taxas</td>
                            <td className="py-1.5 text-right font-medium text-slate-800">{currency(precoIdeal * somaPercentuais / 100)}</td>
                            <td className="py-1.5 text-right text-xs text-slate-400">{somaPercentuais.toFixed(1)}%</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-slate-500 font-medium">Lucro</td>
                            <td className="py-1.5 text-right font-bold text-emerald-600">{currency(lucroIdeal.lucro)}</td>
                            <td className="py-1.5 text-right text-xs font-medium text-emerald-600">{lucroIdeal.margem.toFixed(1)}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detalhamento dos Custos</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Hora Clínica</td>
                            <td className="py-1.5 text-right text-slate-800">{currency(custoHoraClinica)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Materiais</td>
                            <td className="py-1.5 text-right text-slate-800">{currency(custoMateriais)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Laboratório</td>
                            <td className="py-1.5 text-right text-slate-800">{currency(custoLaboratorio)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Imposto ({aliquotaImposto}%)</td>
                            <td className="py-1.5 text-right text-slate-800">{currency(precoIdeal * aliquotaImposto / 100)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Comissão Dentista ({comissaoDentista}%)</td>
                            <td className="py-1.5 text-right text-slate-800">{currency(precoIdeal * comissaoDentista / 100)}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1.5 text-slate-500">Comissão Vendedor ({comissaoVendedor}%)</td>
                            <td className="py-1.5 text-right text-slate-800">{currency(precoIdeal * comissaoVendedor / 100)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-slate-500">Taxa Maquininha ({taxaMaquininha.toFixed(1)}%)</td>
                            <td className="py-1.5 text-right text-slate-800">{currency(precoIdeal * taxaMaquininha / 100)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {lucroDesejado <= 0 && (
                <div className="text-center py-8 text-sm text-slate-400 italic border border-dashed rounded-lg">
                  Digite o lucro desejado para calcular o preço de venda ideal
                </div>
              )}
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
