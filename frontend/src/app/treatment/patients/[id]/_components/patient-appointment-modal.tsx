"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

interface PatientData {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PatientData;
  onSuccess?: () => void;
}

function maskPhone(v: string) {
  return v
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

export function PatientAppointmentModal({ open, onOpenChange, patient, onSuccess }: Props) {
  const [dataConsulta, setDataConsulta] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [previsaoTermino, setPrevisaoTermino] = useState("");
  const [idProfissional, setIdProfissional] = useState<string | null>(null);
  const [profissional, setProfissional] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [buscaProfissional, setBuscaProfissional] = useState("");
  const [sugestoesProfissionais, setSugestoesProfissionais] = useState<any[]>([]);
  const [showSugestoesProfissionais, setShowSugestoesProfissionais] = useState(false);

  const [buscaProcedimento, setBuscaProcedimento] = useState("");
  const [sugestoesProcedimentos, setSugestoesProcedimentos] = useState<any[]>([]);
  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editouTermino, setEditouTermino] = useState(false);

  const profissionalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!profissionalRef.current?.contains(e.target as Node))
        setShowSugestoesProfissionais(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!buscaProfissional.trim()) {
      setSugestoesProfissionais([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/api/proxy/profissionais?nome=${encodeURIComponent(buscaProfissional)}`,
        );
        setSugestoesProfissionais(res.ok ? await res.json() : []);
      } catch {
        setSugestoesProfissionais([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [buscaProfissional]);

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
    if (editouTermino) return;
    if (!horarioInicio || !procedimentosSelecionados.length) {
      setPrevisaoTermino("");
      return;
    }
    const total = procedimentosSelecionados.reduce(
      (acc, p) => acc + (Number(p.duracao) || 30),
      0,
    );
    const [h, m] = horarioInicio.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const end = h * 60 + m + total;
    setPrevisaoTermino(
      `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
    );
  }, [procedimentosSelecionados, horarioInicio, editouTermino]);

  const resetForm = () => {
    setDataConsulta("");
    setHorarioInicio("");
    setPrevisaoTermino("");
    setIdProfissional(null);
    setProfissional("");
    setBuscaProfissional("");
    setObservacoes("");
    setProcedimentosSelecionados([]);
    setSugestoesProfissionais([]);
    setSugestoesProcedimentos([]);
    setSaveError("");
    setEditouTermino(false);
  };

  const handleSalvar = async () => {
    setSaveError("");
    setIsSaving(true);
    try {
      const isoDateTime = `${dataConsulta}T${horarioInicio}:00`;
      const payload = {
        pacienteId: patient.id,
        pacienteNome: patient.nome,
        email: patient.email,
        telefone: patient.telefone.replace(/\D/g, ""),
        profissionalId: idProfissional?.toString(),
        profissionalNome: profissional,
        data: isoDateTime,
        horaInicio: horarioInicio,
        horaFim: previsaoTermino,
        procedimentosIds: procedimentosSelecionados.map((p) => p.id.toString()),
        observacoes,
        status: "agendado",
        confirmado: false,
      };

      const res = await apiFetch(`/api/proxy/agendamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess?.();
        toast.success("Agendamento salvo com sucesso!");
        resetForm();
        onOpenChange(false);
      } else {
        const text = await res.text();
        setSaveError(`Erro ${res.status}: ${text || res.statusText}`);
      }
    } catch (err: any) {
      setSaveError(err?.message || "Servidor offline ou erro de rede.");
    } finally {
      setIsSaving(false);
    }
  };

  const formularioValido =
    dataConsulta !== "" &&
    horarioInicio !== "" &&
    profissional.trim().length > 0 &&
    procedimentosSelecionados.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Novo Agendamento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="mb-1.5 block">Paciente</Label>
                <Input value={patient.nome} readOnly className="bg-muted cursor-default" />
              </div>
              <div className="flex-1">
                <Label className="mb-1.5 block">E-mail</Label>
                <Input value={patient.email || ""} readOnly className="bg-muted cursor-default" />
              </div>
              <div className="flex-1">
                <Label className="mb-1.5 block">Telefone</Label>
                <Input value={maskPhone(patient.telefone)} readOnly className="bg-muted cursor-default" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="mb-1.5 block">Data *</Label>
                <Input type="date" value={dataConsulta} onChange={(e) => setDataConsulta(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="mb-1.5 block">Início *</Label>
                <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="mb-1.5 block">Término estimado</Label>
                <Input type="time" value={previsaoTermino} onChange={(e) => { setPrevisaoTermino(e.target.value); setEditouTermino(true); }} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1">
                <Label className="mb-1.5 block">Procedimentos *</Label>
                <Input
                  placeholder="Buscar procedimento..."
                  value={buscaProcedimento}
                  onChange={(e) => setBuscaProcedimento(e.target.value)}
                  autoComplete="off"
                />
                {sugestoesProcedimentos.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md max-h-40 overflow-y-auto" style={{ width: "auto" }}>
                    {sugestoesProcedimentos.map((p) => (
                      <li
                        key={p.id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                        onMouseDown={() => {
                          if (!procedimentosSelecionados.find((x) => x.id === p.id))
                            setProcedimentosSelecionados((prev) => [...prev, p]);
                          setBuscaProcedimento("");
                        }}
                      >
                        {p.nome} ({p.duracao} min)
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {procedimentosSelecionados.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium"
                    >
                      {p.nome}
                      <button
                        type="button"
                        onClick={() =>
                          setProcedimentosSelecionados((prev) =>
                            prev.filter((x) => x.id !== p.id),
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 relative" ref={profissionalRef}>
                <Label className="mb-1.5 block">Profissional *</Label>
                <Input
                  placeholder="Buscar dentista..."
                  value={buscaProfissional || profissional}
                  autoComplete="off"
                  onChange={(e) => {
                    setBuscaProfissional(e.target.value);
                    setProfissional(e.target.value);
                    setShowSugestoesProfissionais(true);
                  }}
                />
                {showSugestoesProfissionais && sugestoesProfissionais.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md max-h-40 overflow-y-auto">
                    {sugestoesProfissionais.map((p, i) => (
                      <li
                        key={i}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                        onMouseDown={() => {
                          setProfissional(p.nome);
                          setBuscaProfissional(p.nome);
                          setIdProfissional(p.id);
                          setShowSugestoesProfissionais(false);
                        }}
                      >
                        {p.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="h-24"
              />
            </div>

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSalvar} disabled={!formularioValido || isSaving}>
                {isSaving ? "Salvando…" : "Salvar Agendamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
    </Dialog>
  );
}
