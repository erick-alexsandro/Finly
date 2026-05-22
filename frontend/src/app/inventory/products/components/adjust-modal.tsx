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
import { Equal, Save } from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  quantity: number;
}

interface AdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdjustModal({ open, onOpenChange, onSuccess }: AdjustModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
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
      setNovaQuantidade("");
    }
  }, [open]);

  const selected = products.find((p) => p.id === Number(selectedId));
  const newQty = Number(novaQuantidade);
  const diff = selected ? newQty - selected.quantity : 0;
  const valido = selectedId !== "" && novaQuantidade !== "" && newQty >= 0;

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
        const tipo = diff > 0 ? "adicionadas" : diff < 0 ? "removidas" : "mantidas";
        alert(`Estoque de "${selected!.name}" ajustado: ${Math.abs(diff)} unidades ${tipo}`);
        onSuccess?.();
        onOpenChange(false);
      } else {
        alert("Erro ao ajustar estoque.");
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
            <Equal className="h-5 w-5" />
            Ajustar Estoque
          </DialogTitle>
          <DialogDescription className="text-left">
            Defina manualmente a quantidade exata do item no estoque.
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
            <Label htmlFor="qty-new">
              Nova quantidade<span className="text-red-500">*</span>
            </Label>
            <Input
              id="qty-new"
              type="number"
              min="0"
              value={novaQuantidade}
              onChange={(e) => setNovaQuantidade(e.target.value)}
              placeholder="Ex: 50"
            />
            {selected && novaQuantidade !== "" && newQty >= 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">
                  {selected.quantity} → {newQty}
                </span>
                {diff !== 0 && (
                  <span className={`font-semibold ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
                    ({diff > 0 ? "+" : ""}{diff})
                  </span>
                )}
              </div>
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
            {loading ? "Salvando..." : "Ajustar Estoque"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
