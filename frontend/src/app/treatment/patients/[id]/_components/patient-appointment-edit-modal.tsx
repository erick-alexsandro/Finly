"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { toast } from "sonner";

interface AppointmentData {
  id: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  profissionalId: string;
  profissionalNome: string;
  procedimentosIds: string[];
  materiaisIds?: number[];
  materiais?: { produtoId: number; quantidade: number }[];
  observacoes: string;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentData;
  onSuccess?: () => void;
}

export function PatientAppointmentEditModal({ open, onOpenChange, appointment, onSuccess }: Props) {
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
  const [todosProcedimentos, setTodosProcedimentos] = useState<any[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
  const [editouTermino, setEditouTermino] = useState(false);

  // Materials for this appointment: merged from procedures then editable
  const [materiaisAgendamento, setMateriaisAgendamento] = useState<
    { produtoId: number; nome: string; unidade: string; quantidade: number }[]
  >([]);
  const [buscaMaterialExtra, setBuscaMaterialExtra] = useState("");
  const [sugestoesMateriais, setSugestoesMateriais] = useState<any[]>([]);

  const profissionalRef = useRef<HTMLDivElement>(null);
  const prevProcIdsRef = useRef<string[]>([]);
  const loadedFromSavedRef = useRef(false);

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
    if (!open) return;
    const datePart = appointment.data ? appointment.data.split("T")[0] : "";
    setDataConsulta(datePart);
    setHorarioInicio(appointment.horaInicio || "");
    setPrevisaoTermino(appointment.horaFim || "");
    setProfissional(appointment.profissionalNome || "");
    setBuscaProfissional(appointment.profissionalNome || "");
    setIdProfissional(appointment.profissionalId || null);
    setObservacoes(appointment.observacoes || "");
    setEditouTermino(false);
    if (appointment.procedimentosIds?.length) {
      const mapped = appointment.procedimentosIds
        .map((id: string) => todosProcedimentos.find((p) => String(p.id) === String(id)))
        .filter(Boolean);
      setProcedimentosSelecionados(mapped);
    } else {
      setProcedimentosSelecionados([]);
    }
    // Load materials from saved data or compute from procedures
    if (appointment.materiaisIds?.length) {
      // Old format (IDs only) — compute from procedures instead
      loadedFromSavedRef.current = false;
      computeMateriaisFromProcedures(appointment.procedimentosIds || [], todosProcedimentos, todosProdutos);
    } else if (appointment.materiais?.length) {
      loadedFromSavedRef.current = true;
      setMateriaisAgendamento(
        appointment.materiais.map((m: any) => {
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
      computeMateriaisFromProcedures(appointment.procedimentosIds || [], todosProcedimentos, todosProdutos);
    }
  }, [open, appointment, todosProcedimentos, todosProdutos]);

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
        const res = await apiFetch(`/api/proxy/profissionais?nome=${encodeURIComponent(buscaProfissional)}`);
        setSugestoesProfissionais(res.ok ? await res.json() : []);
      } catch { setSugestoesProfissionais([]); }
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

  // Compute materials from selected procedures (merging by product)
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
      // If no procedures have materials, don't override existing manual entries
      if (map.size > 0) {
        setMateriaisAgendamento(Array.from(map.values()));
      }
    },
    [],
  );

  // Recompute materials when procedures are added/removed (only if not loaded from saved data)
  useEffect(() => {
    if (loadedFromSavedRef.current) return;
    const currentIds = procedimentosSelecionados.map((p) => String(p.id));
    const prevIds = prevProcIdsRef.current;
    if (JSON.stringify(currentIds) !== JSON.stringify(prevIds)) {
      prevProcIdsRef.current = currentIds;
      computeMateriaisFromProcedures(currentIds, todosProcedimentos, todosProdutos);
    }
  }, [procedimentosSelecionados, todosProcedimentos, todosProdutos, computeMateriaisFromProcedures]);

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
    if (editouTermino || !horarioInicio || !procedimentosSelecionados.length) return;
    const total = procedimentosSelecionados.reduce((acc, p) => acc + (Number(p.duracao) || 30), 0);
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
    setMateriaisAgendamento([]);
    prevProcIdsRef.current = [];
    loadedFromSavedRef.current = false;
    setSugestoesProfissionais([]);
    setSugestoesProcedimentos([]);
    setSaveError("");
  };

  const handleSalvar = async () => {
    setSaveError("");
    setIsSaving(true);
    try {
      const isoDateTime = `${dataConsulta}T${horarioInicio}:00`;
      const payload = {
        data: isoDateTime,
        horaInicio: horarioInicio,
        horaFim: previsaoTermino,
        profissionalId: idProfissional?.toString(),
        profissionalNome: profissional,
        procedimentosIds: procedimentosSelecionados.map((p) => p.id.toString()),
        materiais: materiaisAgendamento
          .filter((m) => m.quantidade > 0)
          .map((m) => ({ produtoId: m.produtoId, quantidade: m.quantidade })),
        observacoes,
        status: appointment.status,
      };

      const res = await apiFetch(`/api/proxy/agendamentos?id=${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess?.();
        toast.success("Agendamento atualizado com sucesso!");
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
    dataConsulta !== "" && horarioInicio !== "" && profissional.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Agendamento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 py-4">
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
                <Label className="mb-1.5 block">Procedimentos</Label>
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
                    <span key={p.id} className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium">
                      {p.nome}
                      <button type="button" onClick={() => setProcedimentosSelecionados((prev) => prev.filter((x) => x.id !== p.id))}>×</button>
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
                  onChange={(e) => { setBuscaProfissional(e.target.value); setProfissional(e.target.value); setShowSugestoesProfissionais(true); }}
                />
                {showSugestoesProfissionais && sugestoesProfissionais.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md max-h-40 overflow-y-auto">
                    {sugestoesProfissionais.map((p, i) => (
                      <li key={i} className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                        onMouseDown={() => { setProfissional(p.nome); setBuscaProfissional(p.nome); setIdProfissional(p.id); setShowSugestoesProfissionais(false); }}>
                        {p.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Materiais</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Quantidades calculadas dos procedimentos selecionados. Altere conforme necessário.
              </p>

              {materiaisAgendamento.length > 0 && (
                <div className="border rounded-md divide-y mb-3">
                  {materiaisAgendamento.map((mat, i) => (
                    <div key={mat.produtoId} className="flex items-center gap-2 px-3 py-2">
                      <span className="flex-1 text-sm">{mat.nome}</span>
                      <span className="text-xs text-muted-foreground w-10">{mat.unidade}</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20 h-8 text-sm"
                        value={mat.quantidade}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setMateriaisAgendamento((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], quantidade: Math.max(val, 0) };
                            return next;
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="text-destructive text-sm font-medium"
                        onClick={() =>
                          setMateriaisAgendamento((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {materiaisAgendamento.length === 0 && (
                <p className="text-sm text-muted-foreground mb-2">
                  Nenhum material associado. Adicione manualmente abaixo.
                </p>
              )}

              <div className="flex gap-2 items-start">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Adicionar material extra..."
                    value={buscaMaterialExtra}
                    onChange={(e) => setBuscaMaterialExtra(e.target.value)}
                    autoComplete="off"
                  />
                  {sugestoesMateriais.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md max-h-40 overflow-y-auto">
                      {sugestoesMateriais.map((m) => (
                        <li
                          key={m.id}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                          onMouseDown={() => {
                            const existing = materiaisAgendamento.find(
                              (x) => x.produtoId === Number(m.id),
                            );
                            if (existing) {
                              setMateriaisAgendamento((prev) =>
                                prev.map((x) =>
                                  x.produtoId === Number(m.id)
                                    ? { ...x, quantidade: x.quantidade + 1 }
                                    : x,
                                ),
                              );
                            } else {
                              setMateriaisAgendamento((prev) => [
                                ...prev,
                                {
                                  produtoId: Number(m.id),
                                  nome: m.name,
                                  unidade: m.unit || "",
                                  quantidade: 1,
                                },
                              ]);
                            }
                            setBuscaMaterialExtra("");
                          }}
                        >
                          {m.name} {m.unit ? `(${m.unit})` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="h-24" />
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <div className="flex justify-end">
              <Button onClick={handleSalvar} disabled={!formularioValido || isSaving}>
                {isSaving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
    </Dialog>
  );
}
