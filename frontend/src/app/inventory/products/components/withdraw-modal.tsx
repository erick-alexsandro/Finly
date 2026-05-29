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
import { ArrowUpFromLine, Save } from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  quantity: number;
}

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WithdrawModal({ open, onOpenChange, onSuccess }: WithdrawModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantidade, setQuantidade] = useState("");
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
    }
  }, [open]);

  const selected = products.find((p) => p.id === Number(selectedId));
  const removeQty = Number(quantidade);
  const newQty = selected ? selected.quantity - removeQty : 0;
  const valido = selectedId !== "" && removeQty > 0 && removeQty <= (selected?.quantity ?? 0);

  const handleSubmit = async () => {
    if (!valido) return;
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8080/api/produtos/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (response.ok) {
        alert(`Retirada de "${selected!.name}" registrada: -${removeQty} unidades`);
        onSuccess?.();
        onOpenChange(false);
      } else {
        alert("Erro ao registrar retirada.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-left flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5" />
            Retirar do Estoque
          </DialogTitle>
          <DialogDescription className="text-left">
            Selecione o material e informe a quantidade a ser retirada.
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
            <Label htmlFor="qty-remove">
              Quantidade a retirar<span className="text-red-500">*</span>
            </Label>
            <Input
              id="qty-remove"
              type="number"
              min="1"
              max={selected?.quantity ?? 0}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 5"
            />
            {selected && quantidade && removeQty > 0 && (
              <p className={`text-xs ${removeQty > selected.quantity ? "text-red-500" : "text-slate-500"}`}>
                Estoque atual: {selected.quantity} → Novo: {newQty}
                {removeQty > selected.quantity && " (estoque insuficiente!)"}
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
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : "Registrar Retirada"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
