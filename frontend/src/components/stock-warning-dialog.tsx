"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PackageX } from "lucide-react";
import type { StockWarning } from "@/lib/stock";

interface Props {
  open: boolean;
  onClose: () => void;
  warnings: StockWarning[];
}

export function StockWarningDialog({ open, onClose, warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <DialogTitle className="text-lg">Alerta de Estoque</DialogTitle>
          </div>
          <DialogDescription>
            Os materiais abaixo estão com estoque baixo ou insuficiente para o procedimento:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {warnings.map((w, i) => {
            const isOut = w.quantidadeDisponivel < w.quantidadeNeeded;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  isOut ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                }`}
              >
                <PackageX className={`h-5 w-5 mt-0.5 ${isOut ? "text-red-500" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800">{w.materialNome}</p>
                  {w.materialUnidade && (
                    <p className="text-xs text-slate-500">{w.materialUnidade}</p>
                  )}
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className={isOut ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                      {isOut ? "Indisponível" : "Estoque baixo"}
                    </span>
                    <span className="text-slate-500">
                      Necessário: <strong>{w.quantidadeNeeded}</strong>
                    </span>
                    <span className="text-slate-500">
                      Disponível: <strong>{w.quantidadeDisponivel}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
