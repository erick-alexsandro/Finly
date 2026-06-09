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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, X } from "lucide-react";
import type { ProcedimentoMaterial } from "../page";
import { checkMaterialStock } from "@/lib/stock";
import { StockWarningDialog } from "@/components/stock-warning-dialog";
import type { StockWarning } from "@/lib/stock";

interface MaterialOption {
  id: number;
  name: string;
  unit: string;
}

interface ProcedureModalProps {
  trigger?: React.ReactNode;
  mode: "add" | "edit";
  initialData?: {
    id: string;
    nome: string;
    descricao?: string;
    duracaoMinutos: number;
    preco: number;
    categoria?: string;
    especialidade?: string;
    ativo: boolean;
    materiais?: ProcedimentoMaterial[];
  };
  onSuccess?: () => void;
}

const CATEGORIA_OPTIONS = ["consulta", "exame", "cirurgia", "tratamento", "manutenção", "outro"];

export function ProcedureModal({
  trigger,
  mode,
  initialData,
  onSuccess,
}: ProcedureModalProps) {
  const isEdit = mode === "edit";

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categoriaCustom, setCategoriaCustom] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const [materiais, setMateriais] = useState<ProcedimentoMaterial[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [stockWarnings, setStockWarnings] = useState<StockWarning[]>([]);
  const [showStockWarning, setShowStockWarning] = useState(false);

  const isCustomCategoria = categoria === "__custom__";

  useEffect(() => {
    if (open) {
      fetch("/api/proxy/produtos")
        .then((res) => res.ok ? res.json() : [])
        .then((data: MaterialOption[]) => {
          setAvailableMaterials(Array.isArray(data) ? data : []);
        })
        .catch(() => setAvailableMaterials([]));
    }
  }, [open]);

  useEffect(() => {
    if (isEdit && initialData) {
      setNome(initialData.nome);
      if (CATEGORIA_OPTIONS.includes(initialData.categoria || "")) {
        setCategoria(initialData.categoria || "");
        setCategoriaCustom("");
      } else {
        setCategoria("__custom__");
        setCategoriaCustom(initialData.categoria || "");
      }
      setEspecialidade(initialData.especialidade || "");
      setDescricao(initialData.descricao || "");
      setPreco(initialData.preco?.toString() || "");
      setDuracao(initialData.duracaoMinutos?.toString() || "");
      setAtivo(initialData.ativo);
      setMateriais(initialData.materiais?.map(m => ({ ...m })) || []);
    } else {
      setNome("");
      setCategoria("");
      setCategoriaCustom("");
      setEspecialidade("");
      setDescricao("");
      setPreco("");
      setDuracao("");
      setAtivo(true);
      setMateriais([]);
    }
    setErrors({});
    setSelectedMaterialId("");
  }, [initialData, isEdit, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!preco.trim() || Number(preco) <= 0) newErrors.preco = "Preço deve ser maior que zero";
    if (!duracao.trim() || Number(duracao) <= 0) newErrors.duracao = "Duração deve ser maior que zero";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMaterial = () => {
    if (!selectedMaterialId) return;

    const materialId = Number(selectedMaterialId);
    if (materiais.some((m) => m.materialId === materialId)) {
      toast.error("Este material já foi adicionado");
      return;
    }

    const material = availableMaterials.find((m) => m.id === materialId);
    if (!material) return;

    setMateriais([
      ...materiais,
      { materialId, materialNome: material.name, materialUnidade: material.unit, quantidade: 1 },
    ]);
    setSelectedMaterialId("");
  };

  const handleRemoveMaterial = (materialId: number) => {
    setMateriais(materiais.filter((m) => m.materialId !== materialId));
  };

  const handleQuantidadeChange = (materialId: number, quantidade: number) => {
    if (quantidade < 1) return;
    setMateriais(
      materiais.map((m) =>
        m.materialId === materialId ? { ...m, quantidade } : m
      )
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const effectiveCategoria = isCustomCategoria ? categoriaCustom : categoria;

    const procedureData = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      duracaoMinutos: Number(duracao),
      preco: Number(preco),
      categoria: effectiveCategoria || null,
      especialidade: especialidade.trim() || null,
      ativo,
      materiais: materiais.map((m) => ({
        materialId: m.materialId,
        quantidade: m.quantidade,
      })),
    };

    try {
      const url = isEdit
        ? `/api/proxy/procedimentos?id=${initialData?.id}`
        : "/api/proxy/procedimentos";

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(procedureData),
      });

      if (response.ok || response.status === 201) {
        toast.success(
          isEdit
            ? "Procedimento atualizado com sucesso!"
            : "Procedimento cadastrado com sucesso!"
        );
        onSuccess?.();
        if (materiais.length > 0) {
          const warnings = await checkMaterialStock(materiais);
          if (warnings.length > 0) {
            setStockWarnings(warnings);
            setShowStockWarning(true);
          } else {
            setOpen(false);
          }
        } else {
          setOpen(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = errorData?.error || "Erro desconhecido";
        if (errorData?.details) {
          try {
            const parsed = JSON.parse(errorData.details);
            errorMsg = parsed.message || parsed.details || errorData.details;
          } catch {
            errorMsg = errorData.details;
          }
        }
        toast.error(`Erro ao salvar procedimento: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/proxy/procedimentos?id=${initialData?.id}`,
        { method: "DELETE" }
      );

      if (response.ok || response.status === 204) {
        toast.success("Procedimento removido com sucesso!");
        onSuccess?.();
        setOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = errorData?.error || "Erro desconhecido";
        if (errorData?.details) {
          try {
            const parsed = JSON.parse(errorData.details);
            errorMsg = parsed.message || parsed.details || errorData.details;
          } catch {
            errorMsg = errorData.details;
          }
        }
        toast.error(`Erro ao excluir procedimento: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button className="gap-2 bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold">
              <Plus className="h-4 w-4" />
              Novo Procedimento
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-left">
            {isEdit ? "Editar Procedimento" : "Novo Procedimento"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {isEdit
              ? "Atualize as informações ou exclua o procedimento."
              : "Preencha os dados para cadastrar um novo procedimento."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2 text-left">
            <Label htmlFor="nome">
              Nome do Procedimento<span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Limpeza Dental"
              autoComplete="off"
            />
            {errors.nome && <p className="text-red-500 text-xs">{errors.nome}</p>}
          </div>

          <div className="flex gap-3">
            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIA_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Outro...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCustomCategoria && (
              <div className="grid gap-2 flex-1 text-left">
                <Label htmlFor="categoria-custom">Informe a categoria</Label>
                <Input
                  id="categoria-custom"
                  value={categoriaCustom}
                  onChange={(e) => setCategoriaCustom(e.target.value)}
                  placeholder="Ex: profilaxia"
                />
              </div>
            )}

            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                placeholder="Ex: Ortodontia"
              />
            </div>
          </div>

          <div className="grid gap-2 text-left">
            <Label htmlFor="descricao">Descricao</Label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional do procedimento..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="preco">
                Preço (R$)<span className="text-red-500">*</span>
              </Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
              />
              {errors.preco && <p className="text-red-500 text-xs">{errors.preco}</p>}
            </div>

            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="duracao">
                Duração (min)<span className="text-red-500">*</span>
              </Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                placeholder="30"
              />
              {errors.duracao && <p className="text-red-500 text-xs">{errors.duracao}</p>}
            </div>
          </div>

          <div className="grid gap-3 text-left border rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-slate-700">Materiais Utilizados</Label>
            </div>

            <div className="flex gap-2">
              <Select value={selectedMaterialId} onValueChange={(v) => setSelectedMaterialId(v ?? "")}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um material...">
                    {selectedMaterialId
                      ? availableMaterials.find((m) => m.id === Number(selectedMaterialId))?.name
                      : ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableMaterials
                    .filter((m) => !materiais.some((pm) => pm.materialId === m.id))
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name} ({m.unit})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAddMaterial}
                disabled={!selectedMaterialId}
                size="sm"
                className="gap-1 bg-[#1E293B] hover:bg-[#0F172A] text-white"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            {materiais.length > 0 && (
              <div className="space-y-2 mt-1">
                {materiais.map((mat) => (
                  <div
                    key={mat.materialId}
                    className="flex items-center gap-2 bg-white rounded-md border px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-800">
                        {mat.materialNome || `Material #${mat.materialId}`}
                      </span>
                      {mat.materialUnidade && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({mat.materialUnidade})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-500">Qtd:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={mat.quantidade}
                        onChange={(e) =>
                          handleQuantidadeChange(mat.materialId, Number(e.target.value))
                        }
                        className="w-20 h-8 text-sm text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(mat.materialId)}
                        className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {materiais.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                Nenhum material vinculado. Selecione materiais acima.
              </p>
            )}
          </div>

          {isEdit && (
            <div className="grid gap-2 text-left">
              <Label htmlFor="status">Status</Label>
              <Select
                value={ativo ? "Ativo" : "Inativo"}
                onValueChange={(v) => setAtivo(v === "Ativo")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

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
      <StockWarningDialog
        open={showStockWarning}
        onClose={() => { setShowStockWarning(false); setOpen(false); }}
        warnings={stockWarnings}
      />
    </>
  );
}
