"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";

interface Props {
  /** Called after a successful save so the parent calendar can refresh. */
  onSuccess?: () => void;
}

export function NewQueryForms({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);

  // ── Form fields ────────────────────────────────────────────────────────────
  const [idPaciente, setIdPaciente] = useState<number | null>(null);
  const [nomePaciente, setNomePaciente] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataConsulta, setDataConsulta] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [previsaoTermino, setPrevisaoTermino] = useState("");
  const [idProfissional, setIdProfissional] = useState<number | null>(null);
  const [profissional, setProfissional] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState<
    any[]
  >([]);

  // ── Autocomplete state ────────────────────────────────────────────────────
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [sugestoesPacientes, setSugestoesPacientes] = useState<any[]>([]);
  const [showSugestoesPacientes, setShowSugestoesPacientes] = useState(false);

  const [buscaProfissional, setBuscaProfissional] = useState("");
  const [sugestoesProfissionais, setSugestoesProfissionais] = useState<any[]>(
    [],
  );
  const [showSugestoesProfissionais, setShowSugestoesProfissionais] =
    useState(false);

  const [buscaProcedimento, setBuscaProcedimento] = useState("");
  const [sugestoesProcedimentos, setSugestoesProcedimentos] = useState<any[]>(
    [],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const pacienteRef = useRef<HTMLDivElement>(null);
  const profissionalRef = useRef<HTMLDivElement>(null);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!pacienteRef.current?.contains(e.target as Node))
        setShowSugestoesPacientes(false);
      if (!profissionalRef.current?.contains(e.target as Node))
        setShowSugestoesProfissionais(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Reset form ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setIdPaciente(null);
    setNomePaciente("");
    setBuscaPaciente("");
    setEmail("");
    setTelefone("");
    setDataConsulta("");
    setHorarioInicio("");
    setPrevisaoTermino("");
    setIdProfissional(null);
    setProfissional("");
    setBuscaProfissional("");
    setObservacoes("");
    setProcedimentosSelecionados([]);
    setSugestoesPacientes([]);
    setSugestoesProfissionais([]);
    setSugestoesProcedimentos([]);
    setSaveError("");
    setSaved(false);
  };

  // ── Patient autocomplete (using relative path like calendar) ──────────────
  useEffect(() => {
    if (!buscaPaciente.trim()) {
      setSugestoesPacientes([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/api/proxy/pacientes?nome=${encodeURIComponent(buscaPaciente)}`,
        );
        setSugestoesPacientes(res.ok ? await res.json() : []);
      } catch {
        setSugestoesPacientes([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [buscaPaciente]);

  // ── Professional autocomplete ─────────────────────────────────────────────
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

  // ── Procedure search ──────────────────────────────────────────────────────
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

  // ── Auto-calculate end time ───────────────────────────────────────────────
  useEffect(() => {
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
  }, [procedimentosSelecionados, horarioInicio]);

  const maskPhone = (v: string) =>
    v
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);

  // ── Save (Aligned with calendar's base URL /api/agendamentos) ─────────────
  // ── Save (Aligned with calendar's base URL /api/agendamentos) ─────────────
const handleSalvar = async () => {
  setSaveError("");
  setIsSaving(true);
  try {
    // Combine date and time into ISO datetime format
    // data comes as "2026-04-10", horarioInicio as "09:00"
    const isoDateTime = `${dataConsulta}T${horarioInicio}:00`;
    
    const payload = {
      pacienteId: idPaciente?.toString(), // Convert to string as DTO expects String
      pacienteNome: nomePaciente,
      email: email,                       // ← NEW: Send email for auto-create
      telefone: telefone,                 // ← NEW: Send phone for auto-create
      profissionalId: idProfissional?.toString(), // Convert to string
      profissionalNome: profissional,
      data: isoDateTime, // Send as ISO datetime like "2026-04-10T09:00:00"
      horaInicio: horarioInicio, // Time string like "09:00"
      horaFim: previsaoTermino, // Time string like "09:30"
      procedimentosIds: procedimentosSelecionados.map((p) => p.id.toString()),
      observacoes,
      status: "agendado",
      confirmado: false,
    };

    console.log("[handleSalvar] Sending payload:", payload);

    const res = await apiFetch(`/api/proxy/agendamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSaved(true);
      onSuccess?.();
      setTimeout(() => {
        resetForm();
        setOpen(false);
      }, 1500);
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
    nomePaciente.trim().length > 0 &&
    telefone.replace(/\D/g, "").length >= 10 &&
    dataConsulta !== "" &&
    horarioInicio !== "" &&
    profissional.trim().length > 0 &&
    procedimentosSelecionados.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>Agendar Nova Consulta</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nova Consulta</DialogTitle>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">
              Agendamento salvo com sucesso!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 py-4">
            {/* Bloco 1: Paciente */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative" ref={pacienteRef}>
                <Label htmlFor="nomePaciente" className="mb-1.5 block">
                  Paciente <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomePaciente"
                  placeholder="Digite para buscar..."
                  value={buscaPaciente || nomePaciente}
                  autoComplete="off"
                  onChange={(e) => {
                    const v = e.target.value;
                    setBuscaPaciente(v);
                    setNomePaciente(v);
                    setIdPaciente(null);
                    setShowSugestoesPacientes(true);
                  }}
                  onFocus={() => {
                    if (buscaPaciente || nomePaciente)
                      setShowSugestoesPacientes(true);
                  }}
                />
                {showSugestoesPacientes && sugestoesPacientes.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md max-h-40 overflow-y-auto">
                    {sugestoesPacientes.map((p, i) => (
                      <li
                        key={i}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                        onMouseDown={() => {
                          setNomePaciente(p.nome);
                          setBuscaPaciente(p.nome);
                          setEmail(p.email || "");
                          setTelefone(maskPhone(p.telefone || ""));
                          setIdPaciente(p.id);
                          setShowSugestoesPacientes(false);
                        }}
                      >
                        <span className="font-medium">{p.nome}</span>
                        {p.telefone && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            {p.telefone}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex-1">
                <Label htmlFor="email" className="mb-1.5 block">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="telefone" className="mb-1.5 block">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(xx) xxxxx-xxxx"
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                />
              </div>
            </div>

            {/* Bloco 2: Data e horário */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="data" className="mb-1.5 block">
                  Data *
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="inicio" className="mb-1.5 block">
                  Início *
                </Label>
                <Input
                  id="inicio"
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="termino" className="mb-1.5 block">
                  Término estimado
                </Label>
                <Input
                  id="termino"
                  type="time"
                  value={previsaoTermino}
                  readOnly
                  className="bg-muted cursor-default"
                />
              </div>
            </div>

            {/* Bloco 3: Procedimentos + Profissional */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 relative">
                <Label className="mb-1.5 block">Procedimentos *</Label>
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
                        onMouseDown={() => {
                          if (
                            !procedimentosSelecionados.find(
                              (x) => x.id === p.id,
                            )
                          )
                            setProcedimentosSelecionados((prev) => [
                              ...prev,
                              p,
                            ]);
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
                <Label htmlFor="profissional" className="mb-1.5 block">
                  Profissional *
                </Label>
                <Input
                  id="profissional"
                  placeholder="Buscar dentista..."
                  value={buscaProfissional || profissional}
                  autoComplete="off"
                  onChange={(e) => {
                    setBuscaProfissional(e.target.value);
                    setProfissional(e.target.value);
                    setShowSugestoesProfissionais(true);
                  }}
                />
                {showSugestoesProfissionais &&
                  sugestoesProfissionais.length > 0 && (
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
              <Label htmlFor="obs" className="mb-1.5 block">
                Observações
              </Label>
              <Textarea
                id="obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="h-24"
              />
            </div>

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSalvar}
                disabled={!formularioValido || isSaving}
              >
                {isSaving ? "Salvando…" : "Salvar Agendamento"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
