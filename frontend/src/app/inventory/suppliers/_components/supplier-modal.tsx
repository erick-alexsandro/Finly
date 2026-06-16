"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface SupplierModalProps {
  trigger?: React.ReactNode;
  mode: "add" | "edit";
  initialData?: {
    id: string;
    nome: string;
    cnpjCpf: string;
    telefone: string;
    email: string;
    endereco: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    status: "ativo" | "inativo";
  };
  onSuccess?: () => void;
}

// Funções de validação
const validateCNPJ = (cnpj: string): boolean => {
  const cnpjClean = cnpj.replace(/\D/g, "");
  if (cnpjClean.length !== 14) return false;
  const multiplier1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpjClean[i]) * multiplier1[i];
  }
  let digit = 11 - (sum % 11);
  digit = digit > 9 ? 0 : digit;
  if (digit !== parseInt(cnpjClean[12])) return false;
  sum = 0;
  const multiplier2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpjClean[i]) * multiplier2[i];
  }
  digit = 11 - (sum % 11);
  digit = digit > 9 ? 0 : digit;
  return digit === parseInt(cnpjClean[13]);
};

const validateCPF = (cpf: string): boolean => {
  const cpfClean = cpf.replace(/\D/g, "");
  if (cpfClean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfClean)) return false;
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpfClean.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpfClean.substring(10, 11));
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatCNPJCPF = (value: string): string => {
  const cnpjCpf = value.replace(/\D/g, "");
  if (cnpjCpf.length <= 11) {
    return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export function SupplierModal({
  trigger,
  mode,
  initialData,
  onSuccess,
}: SupplierModalProps) {
  const isEdit = mode === "edit";

  const [name, setName] = useState(initialData?.nome || "");
  const [cnpjCpf, setCnpjCpf] = useState(initialData?.cnpjCpf || "");
  const [phone, setPhone] = useState(initialData?.telefone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [rua, setRua] = useState(initialData?.rua || "");
  const [numero, setNumero] = useState(initialData?.numero || "");
  const [bairro, setBairro] = useState(initialData?.bairro || "");
  const [cidade, setCidade] = useState(initialData?.cidade || "");
  const [status, setStatus] = useState<"ativo" | "inativo">(
    initialData?.status || "ativo"
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.nome);
      setCnpjCpf(initialData.cnpjCpf);
      setPhone(initialData.telefone);
      setEmail(initialData.email);
      setRua(initialData.rua);
      setNumero(initialData.numero);
      setBairro(initialData.bairro);
      setCidade(initialData.cidade);
      setStatus(initialData.status);
    } else {
      setName("");
      setCnpjCpf("");
      setPhone("");
      setEmail("");
      setRua("");
      setNumero("");
      setBairro("");
      setCidade("");
      setStatus("ativo");
    }
    setErrors({});
  }, [initialData, isEdit, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Nome é obrigatório";
    if (!cnpjCpf.trim()) {
      newErrors.cnpjCpf = "CNPJ/CPF é obrigatório";
    } else {
      const isValid = validateCNPJ(cnpjCpf) || validateCPF(cnpjCpf);
      if (!isValid) newErrors.cnpjCpf = "CNPJ/CPF inválido";
    }
    if (!phone.trim()) newErrors.phone = "Telefone é obrigatório";
    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!validateEmail(email)) {
      newErrors.email = "Email inválido";
    }
    if (!rua.trim()) newErrors.rua = "Rua é obrigatória";
    if (!numero.trim()) newErrors.numero = "Número é obrigatório";
    if (!bairro.trim()) newErrors.bairro = "Bairro é obrigatório";
    if (!cidade.trim()) newErrors.cidade = "Cidade é obrigatória";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const supplierData = {
      nome: name,
      cnpjCpf: cnpjCpf.replace(/\D/g, ""),
      telefone: phone,
      email,
      rua,
      numero,
      bairro,
      cidade,
      status,
    };

    try {
      const url = isEdit
        ? `/api/proxy/suppliers?id=${initialData?.id}`
        : "/api/proxy/suppliers";

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierData),
      });

      if (response.ok) {
        toast.success(
          isEdit
            ? "Fornecedor atualizado com sucesso!"
            : "Fornecedor cadastrado com sucesso!"
        );
        onSuccess?.();
        setOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(`Erro ao salvar fornecedor: ${errorData?.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/proxy/suppliers?id=${initialData?.id}`,
        { method: "DELETE" }
      );

      if (response.ok || response.status === 204) {
        toast.success("Fornecedor removido com sucesso!");
        onSuccess?.();
        setOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(`Erro ao excluir fornecedor: ${errorData?.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  function formatPHONE(value: string): React.SetStateAction<string> {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (!digits) return "";
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-[#1E293B] flex items-center justify-center text-white shadow-xl z-50 hover:bg-[#0F172A] transition-all active:scale-95">
          <Plus className="h-7 w-7" strokeWidth={3} />
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-left">
            {isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {isEdit
              ? "Atualize as informações ou exclua o fornecedor."
              : "Preencha os dados para cadastrar um novo fornecedor."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nome */}
          <div className="grid gap-2 text-left">
            <Label htmlFor="name">
              Nome/Razão Social<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Empresa XYZ LTDA"
              autoComplete="off"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          {/* CNPJ/CPF */}
          <div className="grid gap-2 text-left">
            <Label htmlFor="cnpj">
              CNPJ/CPF<span className="text-red-500">*</span>
            </Label>
            <Input
              id="cnpj"
              value={cnpjCpf}
              onChange={(e) => setCnpjCpf(formatCNPJCPF(e.target.value))}
              placeholder="00.000.000/0000-00 ou 000.000.000-00"
              autoComplete="off"
              maxLength={18}
            />
            {errors.cnpjCpf && (
              <p className="text-red-500 text-xs">{errors.cnpjCpf}</p>
            )}
          </div>

          {/* Telefone e Email */}
          <div className="flex gap-3">
            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="phone">
                Telefone<span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(formatPHONE(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs">{errors.phone}</p>
              )}
            </div>

            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="email">
                Email<span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Endereço - Rua, Número, Bairro, Cidade */}
          <div className="grid gap-2 text-left">
            <Label htmlFor="rua">
              Rua<span className="text-red-500">*</span>
            </Label>
            <Input
              id="rua"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              placeholder="Ex: Rua Principal"
            />
            {errors.rua && (
              <p className="text-red-500 text-xs">{errors.rua}</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="numero">
                Número<span className="text-red-500">*</span>
              </Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: 123"
              />
              {errors.numero && (
                <p className="text-red-500 text-xs">{errors.numero}</p>
              )}
            </div>

            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="bairro">
                Bairro<span className="text-red-500">*</span>
              </Label>
              <Input
                id="bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Ex: Centro"
              />
              {errors.bairro && (
                <p className="text-red-500 text-xs">{errors.bairro}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2 text-left">
            <Label htmlFor="cidade">
              Cidade<span className="text-red-500">*</span>
            </Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: São Paulo"
            />
            {errors.cidade && (
              <p className="text-red-500 text-xs">{errors.cidade}</p>
            )}
          </div>

          {/* Status */}
          {isEdit && (
            <div className="grid gap-2 text-left">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-2 border-t pt-4">
          {isEdit ? (
            <DialogClose
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-bold text-white transition-colors bg-destructive hover:bg-destructive/90 h-10 px-4 py-2 gap-2 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DialogClose>
          ) : (
            <div />
          )}

          <Button
            onClick={handleSave}
            disabled={loading}
            className="gap-2 bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold"
          >
            <Save className="h-4 w-4" />
            {isEdit ? "Salvar Alterações" : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
