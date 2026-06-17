"use client";

import React, { useState } from "react";
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
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function maskCPF(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function maskPhone(v: string) {
  return v
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

export function PatientModal({ open, onOpenChange, onSuccess }: PatientModalProps) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const cpfDigits = cpf.replace(/\D/g, "");

  const resetForm = () => {
    setNome("");
    setCpf("");
    setDataNascimento("");
    setTelefone("");
    setSaveError("");
  };

  const handleSalvar = async () => {
    setSaveError("");
    setIsSaving(true);

    try {
      const res = await apiFetch(`/api/proxy/pacientes`);
      if (!res.ok) {
        setSaveError("Erro ao conectar com o servidor.");
        setIsSaving(false);
        return;
      }

      const pacientes = await res.json();
      const cpfExists = pacientes.some(
        (p: any) => p.cpf === cpfDigits
      );

      if (cpfExists) {
        setSaveError("Este CPF já está cadastrado");
        setIsSaving(false);
        return;
      }

      const createRes = await apiFetch(`/api/proxy/pacientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: cpfDigits,
          dataNascimento: dataNascimento || null,
          telefone: telefone.replace(/\D/g, ""),
        }),
      });

      if (createRes.ok) {
        onSuccess?.();
        toast.success("Paciente cadastrado com sucesso!");
        resetForm();
        onOpenChange(false);
      } else {
        const text = await createRes.text();
        setSaveError(`Erro ${createRes.status}: ${text || createRes.statusText}`);
      }
    } catch (err: any) {
      setSaveError(err?.message || "Erro de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const formularioValido =
    nome.trim().length > 0 &&
    cpfDigits.length === 11 &&
    telefone.replace(/\D/g, "").length >= 10;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Novo Paciente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cpf">
                CPF <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">
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

            {saveError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSalvar}
                disabled={!formularioValido || isSaving}
              >
                {isSaving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
    </Dialog>
  );
}
