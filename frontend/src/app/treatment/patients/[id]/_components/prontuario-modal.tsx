"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    apiFetch("/api/proxy/procedimentos")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTodosProcedimentos)
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
    if (!open) return;
    const aptDate = agendamento.data ? agendamento.data.split("T")[0] : "";
    setData(aptDate);
    setProfissional(agendamento.profissionalNome || "");
    setDente("");
    setProcedimentosIds([]);
    setNomesProcedimentos([]);
    setSecao("");
    setDetalhesProximaConsulta("");
    setObservacoes("");
    setConteudo("");
    setProntuarioId(null);

    const fetchProntuario = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`/api/proxy/prontuarios?agendamentoId=${agendamento.id}`);
        if (res.ok) {
          const r = await res.json();
          if (r.conteudo) setConteudo(r.conteudo);
          if (r.data) setData(r.data);
          if (r.procedimentosExecutados?.length) {
            setProcedimentosIds(r.procedimentosExecutados);
            const mapped = r.procedimentosExecutados
              .map((id: string) => todosProcedimentos.find((p) => String(p.id) === String(id)))
              .filter(Boolean);
            setNomesProcedimentos(mapped);
          }
          if (r.dente) setDente(r.dente);
          if (r.secao) setSecao(r.secao);
          if (r.detalhesProximaConsulta) setDetalhesProximaConsulta(r.detalhesProximaConsulta);
          if (r.observacoes) setObservacoes(r.observacoes);
          setProntuarioId(r.id);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    fetchProntuario();
  }, [open, agendamento, todosProcedimentos]);

  const resetForm = () => {
    setConteudo(""); setData(""); setProfissional(""); setDente("");
    setProcedimentosIds([]); setNomesProcedimentos([]); setSecao("");
    setDetalhesProximaConsulta(""); setObservacoes("");
    setSaveError(""); setProntuarioId(null);
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
