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
import { CheckCircle2, FileText } from "lucide-react";

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
  const [procedimentosExecutados, setProcedimentosExecutados] = useState("");
  const [secao, setSecao] = useState("");
  const [detalhesProximaConsulta, setDetalhesProximaConsulta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [prontuarioId, setProntuarioId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const aptDate = agendamento.data ? agendamento.data.split("T")[0] : "";
    setData(aptDate);
    setProfissional(agendamento.profissionalNome || "");
    setDente("");
    setProcedimentosExecutados("");
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
          if (r.procedimentosExecutados) setProcedimentosExecutados(r.procedimentosExecutados);
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
  }, [open, agendamento]);

  const resetForm = () => {
    setConteudo(""); setData(""); setProfissional(""); setDente("");
    setProcedimentosExecutados(""); setSecao(""); setDetalhesProximaConsulta(""); setObservacoes("");
    setSaveError(""); setSaved(false); setProntuarioId(null);
  };

  const handleSalvar = async () => {
    setSaveError("");
    setIsSaving(true);

    const payload: any = {
      conteudo,
      data: data || null,
      profissionalId: agendamento.profissionalId || null,
      dente,
      procedimentosExecutados,
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
      setSaved(true);
      onSuccess?.();
      setTimeout(() => { resetForm(); onOpenChange(false); }, 1500);
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

        {saved ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Prontuário salvo com sucesso!</p>
          </div>
        ) : isLoading ? (
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
            <div><Label className="mb-1.5 block">Procedimentos Executados</Label><Textarea value={procedimentosExecutados} onChange={(e) => setProcedimentosExecutados(e.target.value)} className="min-h-[60px]" /></div>
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
