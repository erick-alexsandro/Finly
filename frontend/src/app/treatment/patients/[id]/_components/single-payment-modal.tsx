"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { DollarSign } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: PaymentData) => void;
  defaultNome?: string;
  defaultData?: string;
  defaultValorTotal?: string;
}

export function SinglePaymentModal({ open, onOpenChange, onConfirm, defaultNome, defaultData, defaultValorTotal }: Props) {
  const [nome, setNome] = useState(defaultNome || "");
  const [data, setData] = useState(defaultData || new Date().toISOString().split("T")[0]);
  const [valorTotal, setValorTotal] = useState(defaultValorTotal || "");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [status, setStatus] = useState("pendente");

  useEffect(() => {
    if (open && defaultNome) setNome(defaultNome);
    if (open && defaultData) setData(defaultData);
    if (open && defaultValorTotal) setValorTotal(defaultValorTotal);
  }, [open, defaultNome, defaultData, defaultValorTotal]);

  const reset = () => {
    setNome(defaultNome || "");
    setData(defaultData || new Date().toISOString().split("T")[0]);
    setValorTotal(defaultValorTotal || "");
    setFormaPagamento("");
    setStatus("pendente");
  };

  const handleConfirm = () => {
    if (!nome || !valorTotal || !formaPagamento) return;
    onConfirm({
      nome,
      data,
      valorTotal: parseFloat(valorTotal),
      formaPagamento,
      status,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pagamento Único
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome / Descrição</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Consulta de rotina" />
          </div>
          <div className="grid gap-2">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Valor Total (R$)</Label>
            <Input type="number" step="0.01" min="0" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} placeholder="0,00" />
          </div>
          <div className="grid gap-2">
            <Label>Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credito">Cartão de Crédito</SelectItem>
                <SelectItem value="debito">Cartão de Débito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleConfirm} disabled={!nome || !valorTotal || !formaPagamento}>
            Adicionar Pagamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
