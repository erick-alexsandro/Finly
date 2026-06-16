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
import { Plus, DollarSign, Trash2, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ProductModalProps {
  trigger?: React.ReactNode;
  mode: "add" | "edit";
  initialData?: {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
  price: number;
  };
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductModal({ trigger, mode, initialData, onSuccess, open, onOpenChange }: ProductModalProps) {
  const isEdit = mode === "edit";

  const [nome, setNome] = useState(initialData?.name || "");
  const [unidade, setUnidade] = useState(initialData?.unit || "");
  const [preco, setPreco] = useState(initialData?.price?.toString() || "");
  const [quantidade, setQuantidade] = useState(initialData?.quantity?.toString() || "");
  const [minCritico, setMinCritico] = useState(initialData?.minStock?.toString() || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && initialData) {
      setNome(initialData.name);
      setUnidade(initialData.unit);
      setPreco((initialData.price ?? 0).toString());
      setQuantidade((initialData.quantity ?? 0).toString());
      setMinCritico((initialData.minStock ?? 0).toString());
    } else {
        setNome("");
        setUnidade("");
        setPreco("");
        setQuantidade("");
        setMinCritico("");
    }
  }, [initialData, isEdit]);

  const formularioValido =
    nome.trim().length > 0 &&
    unidade !== "" &&
    preco !== "" &&
    quantidade !== "";

  const handleSalvar = async () => {
    setLoading(true);
    const dadosProduto = {
      name: nome,
      unit: unidade,
      price: Number(preco),
      quantity: Number(quantidade),
      minStock: Number(minCritico),
    };
    
    try {
      const url = isEdit 
        ? `/api/proxy/produtos?id=${initialData?.id}` 
        : "/api/proxy/produtos";
      
      const method = isEdit ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosProduto),
      });

      if (response.ok) {
        toast.success(isEdit ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
        onSuccess?.();
        if (!isEdit) {
            setNome("");
            setUnidade("");
            setPreco("");
            setQuantidade("");
            setMinCritico("");
        }
      } else {
        toast.error("Erro na operação com o servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      toast.error("Não foi possível conectar ao servidor.");
    } finally {
        setLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (confirm(`Tem certeza absoluta que deseja excluir "${initialData?.name}" do estoque?`)) {
      setLoading(true);
      try {
        const response = await apiFetch(`/api/proxy/produtos?id=${initialData?.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Material removido com sucesso!");
          onSuccess?.();
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(`Erro ao excluir o material (status ${response.status}): ${errorData?.details || errorData?.error || "Verifique se ele não está sendo usado."}`);
        }
      } catch (error) {
        console.error("Erro de conexão ao excluir:", error);
        toast.error("Erro ao conectar com o servidor.");
      } finally {
        setLoading(false);
      }
    }
  };

  const controlled = open !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {controlled ? null : isEdit ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-[#1E293B] flex items-center justify-center text-white shadow-xl z-50 hover:bg-[#0F172A] transition-all active:scale-95 outline-none" />
          }
        >
          <Plus className="h-7 w-7" strokeWidth={3} />
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-left flex items-center gap-2">
            {isEdit ? "Editar Material" : "Novo Material"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {isEdit
              ? "Atualize as informações ou exclua o item selecionado."
              : "Preencha os dados para cadastrar um novo item no estoque."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-5">
          <div className="grid gap-2 text-left">
            <Label htmlFor="nome">
              Nome do Material<span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Resina Filtek Z350"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 w-full items-start">
            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="unidade-select">Unidade<span className="text-red-500">*</span></Label>
              <select
                id="unidade-select"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Selecione</option>
                {["Unidade", "Caixa", "Rolo", "Pacote", "Mililitros"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="preco">Preço de unidade</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="preco"
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full items-start">
            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="qty">
                {isEdit ? "Estoque Atual" : "Qtd Inicial"}<span className="text-red-500">*</span>
              </Label>
              <Input
                id="qty"
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2 flex-1 text-left">
              <Label htmlFor="min">Mín. Crítico</Label>
              <Input
                id="min"
                type="number"
                value={minCritico}
                onChange={(e) => setMinCritico(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 border-t pt-4">
          {isEdit ? (
            <DialogClose
              onClick={handleExcluir}
              disabled={loading}
              render={
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir item
                </Button>
              }
            />
          ) : (
            <div /> 
          )}

          <Button
            type="button"
            onClick={handleSalvar}
            disabled={!formularioValido || loading}
            className={`gap-2 bg-[#1E293B] hover:bg-[#0F172A] ${!formularioValido || loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Save className="h-4 w-4" />
            {isEdit ? "Salvar Alterações" : "Cadastrar no Estoque"}
          </Button>
        </div>
          
      </DialogContent>
    </Dialog>
  );
}
