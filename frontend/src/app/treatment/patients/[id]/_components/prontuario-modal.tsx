"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: any;
  pacienteId: string;
  onSuccess?: () => void;
}

export function ProntuarioModal({ open, onOpenChange, agendamento, pacienteId, onSuccess }: Props) {
  const [conteudo, setConteudo] = useState("");
  const [data, setData] = useState("");
  const [profissional, setProfissional] = useState("");
  const [dente, setDente] = useState("");
  const [procedimentosIds, setProcedimentosIds] = useState<string[]>([]);
  const [nomesProcedimentos, setNomesProcedimentos] = useState<any[]>([]);
  const [todosProcedimentos, setTodosProcedimentos] = useState<any[]>([]);
  const [buscaProcedimento, setBuscaProcedimento] = useState("");
  const [sugestoesProcedimentos, setSugestoesProcedimentos] = useState<any[]>([]);
  const [secao, setSecao] = useState("");
  const [detalhesProximaConsulta, setDetalhesProximaConsulta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [prontuarioId, setProntuarioId] = useState<string | null>(null);

  const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
  const [materiaisAgendamento, setMateriaisAgendamento] = useState<
    { produtoId: number; nome: string; unidade: string; quantidade: number }[]
  >([]);
  const [buscaMaterialExtra, setBuscaMaterialExtra] = useState("");
  const [sugestoesMateriais, setSugestoesMateriais] = useState<any[]>([]);

  const prevProcIdsRef = useRef<string[]>([]);
  const loadedFromSavedRef = useRef(false);

  const computeMateriaisFromProcedures = useCallback(
    (procIds: string[], todosProc: any[], todosProd: any[]) => {
      const map = new Map<number, { produtoId: number; nome: string; unidade: string; quantidade: number }>();
      for (const p of todosProc) {
        if (!procIds.includes(String(p.id))) continue;
        if (p.materiais) {
          for (const m of p.materiais) {
            const id = Number(m.materialId);
            if (map.has(id)) {
              map.get(id)!.quantidade += Number(m.quantidade) || 1;
            } else {
              map.set(id, {
                produtoId: id,
                nome: m.materialNome || `Material #${id}`,
                unidade: m.materialUnidade || "",
                quantidade: Number(m.quantidade) || 1,
              });
            }
          }
        }
      }
      if (map.size > 0) {
        setMateriaisAgendamento(Array.from(map.values()));
      }
    },
    [],
  );

  const initMateriais = (procIds: string[]) => {
    if (agendamento.materiais?.length) {
      loadedFromSavedRef.current = true;
      setMateriaisAgendamento(
        agendamento.materiais.map((m: any) => {
          const prod = todosProdutos.find((p: any) => Number(p.id) === Number(m.produtoId));
          return {
            produtoId: Number(m.produtoId),
            nome: prod?.name || `Material #${m.produtoId}`,
            unidade: prod?.unit || "",
            quantidade: Number(m.quantidade) || 1,
          };
        }),
      );
    } else {
      loadedFromSavedRef.current = false;
      computeMateriaisFromProcedures(procIds, todosProcedimentos, todosProdutos);
    }
  };

  useEffect(() => {
    apiFetch("/api/proxy/procedimentos")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTodosProcedimentos)
      .catch(() => {});
    apiFetch("/api/proxy/produtos")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTodosProdutos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!buscaProcedimento.trim()) {
      setSugestoesProcedimentos([]);
      return;
    }
    apiFetch(`/api/proxy/procedimentos?nome=${encodeURIComponent(buscaProcedimento)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSugestoesProcedimentos)
      .catch(() => setSugestoesProcedimentos([]));
  }, [buscaProcedimento]);

  useEffect(() => {
    if (loadedFromSavedRef.current) return;
    const currentIds = procedimentosIds;
    const prevIds = prevProcIdsRef.current;
    if (JSON.stringify(currentIds) !== JSON.stringify(prevIds)) {
      prevProcIdsRef.current = currentIds;
      computeMateriaisFromProcedures(currentIds, todosProcedimentos, todosProdutos);
    }
  }, [procedimentosIds, todosProcedimentos, todosProdutos, computeMateriaisFromProcedures]);

  useEffect(() => {
    if (!buscaMaterialExtra.trim()) {
      setSugestoesMateriais([]);
      return;
    }
    const q = buscaMaterialExtra.toLowerCase();
    const filtrados = todosProdutos.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.id?.toString().includes(q),
    );
    setSugestoesMateriais(filtrados);
  }, [buscaMaterialExtra, todosProdutos]);

  useEffect(() => {
    if (!open) return;
    const aptDate = agendamento.data ? agendamento.data.split("T")[0] : "";
    setData(aptDate);
    setProfissional(agendamento.profissionalNome || "");
    setDente("");
    setProcedimentosIds([]);
    setNomesProcedimentos([]);
    setMateriaisAgendamento([]);
    setSecao("");
    setDetalhesProximaConsulta("");
    setObservacoes("");
    setConteudo("");
    setProntuarioId(null);
    loadedFromSavedRef.current = false;
    prevProcIdsRef.current = [];

    const fetchProntuario = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`/api/proxy/prontuarios?agendamentoId=${agendamento.id}`);
        if (res.ok) {
          const r = await res.json();
          if (r.conteudo) setConteudo(r.conteudo);
          if (r.data) setData(r.data);
          const execIds = Array.isArray(r.procedimentosExecutados) && r.procedimentosExecutados.length ? r.procedimentosExecutados : Array.isArray(agendamento.procedimentosIds) ? agendamento.procedimentosIds : [];
          if (execIds.length) {
            setProcedimentosIds(execIds);
            const mapped = execIds
              .map((id: string) => todosProcedimentos.find((p) => String(p.id) === String(id)))
              .filter(Boolean);
            setNomesProcedimentos(mapped);
          }
          if (r.dente) setDente(r.dente);
          if (r.secao) setSecao(r.secao);
          if (r.detalhesProximaConsulta) setDetalhesProximaConsulta(r.detalhesProximaConsulta);
          if (r.observacoes) setObservacoes(r.observacoes);
          setProntuarioId(r.id);
          initMateriais(execIds);
        } else {
          initMateriais(agendamento.procedimentosIds || []);
        }
      } catch {
        initMateriais(agendamento.procedimentosIds || []);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProntuario();
  }, [open, agendamento, todosProcedimentos, todosProdutos, computeMateriaisFromProcedures]);

  const resetForm = () => {
    setConteudo(""); setData(""); setProfissional(""); setDente("");
    setProcedimentosIds([]); setNomesProcedimentos([]); setMateriaisAgendamento([]);
    setSecao(""); setDetalhesProximaConsulta(""); setObservacoes("");
    setSaveError(""); setProntuarioId(null);
    loadedFromSavedRef.current = false;
    prevProcIdsRef.current = [];
  };

  const adicionarProcedimento = (proc: any) => {
    if (!procedimentosIds.find((id) => String(id) === String(proc.id))) {
      setProcedimentosIds((prev) => [...prev, String(proc.id)]);
      setNomesProcedimentos((prev) => [...prev, proc]);
    }
    setBuscaProcedimento("");
  };

  const removerProcedimento = (id: string) => {
    setProcedimentosIds((prev) => prev.filter((p) => p !== id));
    setNomesProcedimentos((prev) => prev.filter((p) => String(p.id) !== id));
  };

  const handleSalvar = async () => {
    setSaveError("");
    setIsSaving(true);

    const payload: any = {
      conteudo,
      data: data || null,
      profissionalId: agendamento.profissionalId || null,
      dente,
      procedimentosExecutados: procedimentosIds,
      secao,
      detalhesProximaConsulta,
      observacoes,
    };

    try {
      if (prontuarioId) {
        const res = await apiFetch(`/api/proxy/prontuarios?id=${prontuarioId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          setSaveError(`Erro ${res.status}: ${text || res.statusText}`);
          setIsSaving(false);
          return;
        }
      } else {
        const res = await apiFetch(`/api/proxy/prontuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agendamentoId: agendamento.id, pacienteId, ...payload }),
        });
        if (!res.ok) {
          const text = await res.text();
          setSaveError(`Erro ${res.status}: ${text || res.statusText}`);
          setIsSaving(false);
          return;
        }
        const created = await res.json();
        setProntuarioId(created.id);
      }

      const materiaisPayload = materiaisAgendamento
        .filter((m) => m.quantidade > 0)
        .map((m) => ({ produtoId: m.produtoId, quantidade: m.quantidade }));
      await apiFetch(`/api/proxy/agendamentos?id=${agendamento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materiais: materiaisPayload }),
      });

      onSuccess?.();
      toast.success("Prontuário salvo com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      setSaveError(err?.message || "Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prontuário da Consulta
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="mb-1.5 block">Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
              <div><Label className="mb-1.5 block">Profissional</Label><Input value={profissional} onChange={(e) => setProfissional(e.target.value)} /></div>
              <div><Label className="mb-1.5 block">Dente</Label><Input value={dente} onChange={(e) => setDente(e.target.value)} /></div>
              <div><Label className="mb-1.5 block">Seção</Label><Input value={secao} onChange={(e) => setSecao(e.target.value)} /></div>
            </div>

            <div>
              <Label className="mb-1.5 block">Procedimentos Executados</Label>
              <div className="relative">
                <Input
                  placeholder="Buscar procedimento..."
                  value={buscaProcedimento}
                  onChange={(e) => setBuscaProcedimento(e.target.value)}
                  autoComplete="off"
                />
                {sugestoesProcedimentos.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md max-h-40 overflow-y-auto">
                    {sugestoesProcedimentos.map((p) => (
                      <li
                        key={p.id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                        onMouseDown={() => adicionarProcedimento(p)}
                      >
                        {p.nome} ({p.duracao} min)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {nomesProcedimentos.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium">
                    {p.nome}
                    <button type="button" onClick={() => removerProcedimento(String(p.id))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div><Label className="mb-1.5 block">Prontuário</Label><Textarea placeholder="Descreva o prontuário da consulta..." value={conteudo} onChange={(e) => setConteudo(e.target.value)} className="min-h-[120px]" /></div>
            <div><Label className="mb-1.5 block">Detalhes da Próxima Consulta</Label><Textarea value={detalhesProximaConsulta} onChange={(e) => setDetalhesProximaConsulta(e.target.value)} className="min-h-[60px]" /></div>
            <div><Label className="mb-1.5 block">Observações</Label><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="min-h-[60px]" /></div>
            <div className="rounded-lg bg-muted/50 p-4">
              <Label className="mb-3 block font-semibold">Materiais Utilizados</Label>
              <div className="space-y-2">
                {materiaisAgendamento.map((m) => (
                  <div key={m.produtoId} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                    <span className="font-medium">{m.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{m.unidade}</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="h-8 w-20 text-center bg-background [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={m.quantidade}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setMateriaisAgendamento((prev) =>
                            prev.map((item) =>
                              item.produtoId === m.produtoId ? { ...item, quantidade: Math.max(0, v) } : item,
                            ),
                          );
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          setMateriaisAgendamento((prev) => prev.filter((x) => x.produtoId !== m.produtoId))
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="relative">
                  <Input
                    placeholder="Adicionar material extra..."
                    value={buscaMaterialExtra}
                    onChange={(e) => setBuscaMaterialExtra(e.target.value)}
                    autoComplete="off"
                    className="bg-background"
                  />
                  {sugestoesMateriais.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md max-h-40 overflow-y-auto">
                      {sugestoesMateriais.filter((p) => !materiaisAgendamento.find((m) => m.produtoId === Number(p.id))).map((p) => (
                        <li
                          key={p.id}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                          onMouseDown={() => {
                            setMateriaisAgendamento((prev) => [
                              ...prev,
                              { produtoId: Number(p.id), nome: p.name, unidade: p.unit || "", quantidade: 1 },
                            ]);
                            setBuscaMaterialExtra("");
                          }}
                        >
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <div className="flex justify-end">
              <Button onClick={handleSalvar} disabled={isSaving}>
                {isSaving ? "Salvando…" : prontuarioId ? "Atualizar Prontuário" : "Criar Prontuário"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
