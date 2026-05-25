"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, DollarSign, Save } from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

interface RestockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RestockModal({ open, onOpenChange, onSuccess }: RestockModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [precoCompra, setPrecoCompra] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (open) {
      setLoadingList(true);
      fetch("http://localhost:8080/api/produtos")
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setProducts(data))
        .catch(() => {})
        .finally(() => setLoadingList(false));
      setSelectedId("");
      setQuantidade("");
      setPrecoCompra("");
    }
  }, [open]);

  useEffect(() => {
    if (selected && precoCompra === "") {
      setPrecoCompra(selected.price?.toString() ?? "");
    }
  }, [selectedId]);

  const selected = products.find((p) => p.id === Number(selectedId));

  const addQty = Number(quantidade);
  const purchasePrice = Number(precoCompra);
  const weightedAvg = selected && addQty > 0 && purchasePrice > 0
    ? (selected.quantity * selected.price + addQty * purchasePrice) / (selected.quantity + addQty)
    : null;

  const handleSubmit = async () => {
    if (!selectedId || !quantidade) return;
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8080/api/produtos/${selectedId}/repor-estoque`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantidade: addQty,
          precoCompra: purchasePrice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Estoque de "${selected!.name}" atualizado: +${addQty} unidades\n` +
          `Preço médio atualizado: R$ ${data.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        );
        onSuccess?.();
        onOpenChange(false);
      } else {
        alert("Erro ao atualizar estoque.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const valido = selectedId !== "" && Number(quantidade) > 0 && Number(precoCompra) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-left flex items-center gap-2">
            <Package className="h-5 w-5" />
            Repor Estoque
          </DialogTitle>
          <DialogDescription className="text-left">
            Selecione o material e informe a quantidade a ser adicionada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-5">
          <div className="grid gap-2 text-left">
            <Label htmlFor="produto-select">
              Material<span className="text-red-500">*</span>
            </Label>
            {loadingList ? (
              <div className="text-sm text-slate-400 italic py-2">Carregando materiais...</div>
            ) : (
              <select
                id="produto-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione um material</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) — estoque: {p.quantity}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-2 text-left">
            <Label htmlFor="qty-add">
              Quantidade a adicionar<span className="text-red-500">*</span>
            </Label>
            <Input
              id="qty-add"
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 10"
            />
            {selected && quantidade && Number(quantidade) > 0 && (
              <p className="text-xs text-slate-500">
                Estoque atual: {selected.quantity} → Novo: {selected.quantity + Number(quantidade)}
              </p>
            )}
          </div>

          <div className="grid gap-2 text-left">
            <Label htmlFor="preco-compra">
              Preço da compra (R$/unidade)<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="preco-compra"
                type="number"
                step="0.01"
                min="0.01"
                value={precoCompra}
                onChange={(e) => setPrecoCompra(e.target.value)}
                placeholder="0,00"
                className="pl-9"
              />
            </div>
            {selected && (
              <p className="text-xs text-slate-400">
                Sugestão: R$ {selected.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (preço atual)
              </p>
            )}
            {weightedAvg !== null && (
              <p className="text-xs text-blue-600 font-medium">
                Novo preço médio: R$ {weightedAvg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!valido || loading}
            className="gap-2 bg-[#1E293B] hover:bg-[#0F172A]"
          >
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : "Adicionar ao Estoque"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
