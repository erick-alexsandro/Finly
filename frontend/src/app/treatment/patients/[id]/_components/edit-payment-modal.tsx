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
import { Pencil } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: any;
  onSave: (payment: any) => void;
}

export function EditPaymentModal({ open, onOpenChange, payment, onSave }: Props) {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (payment) {
      setNome(payment.nome || "");
      setData(payment.data || "");
      setValorTotal(String(payment.valorTotal ?? ""));
      setFormaPagamento(payment.formaPagamento || "");
      setStatus(payment.status || "pendente");
    }
  }, [payment]);

  const handleSave = () => {
    if (!nome || !valorTotal || !formaPagamento) return;
    onSave({
      ...payment,
      nome,
      data,
      valorTotal: parseFloat(valorTotal),
      formaPagamento,
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Pagamento
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
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" min="0" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} placeholder="0,00" />
          </div>
          <div className="grid gap-2">
            <Label>Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v ?? '')}>
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
            <Select value={status} onValueChange={(v) => setStatus(v ?? '')}>
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
          <Button onClick={handleSave} disabled={!nome || !valorTotal || !formaPagamento}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
