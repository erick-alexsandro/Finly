"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, CreditCard, Percent } from "lucide-react";

const DEFAULT_TAXAS: Record<number, number> = {
  1: 2, 2: 3.5, 3: 5, 4: 6.5, 5: 8, 6: 9.5,
  7: 11, 8: 12.5, 9: 14, 10: 15.5, 11: 17, 12: 18.5,
};

export function ProcedimentoTaxasMaquininha() {
  const [taxas, setTaxas] = useState<Record<number, number>>(DEFAULT_TAXAS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/clinica-config?chave=taxas_maquininha")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.valor) {
          try {
            const parsed = JSON.parse(data.valor);
            setTaxas((prev) => ({ ...prev, ...parsed }));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const salvar = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/proxy/clinica-config?chave=taxas_maquininha", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "taxas_maquininha", valor: JSON.stringify(taxas) }),
      });
      if (res.ok) {
        toast.success("Taxas da maquininha salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar taxas.");
      }
    } catch {
      toast.error("Erro ao salvar taxas.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-medium italic">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-400" />
            Taxas da Maquininha por Parcela
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Defina a taxa percentual cobrada pela maquininha para cada número de parcelas
          </p>
        </div>
        <Button onClick={salvar} disabled={saving} className="gap-2 bg-[#1E293B] hover:bg-[#0F172A] text-white">
          <Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Percent className="h-4 w-4 text-violet-500" />
            Percentuais por Parcela
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <div key={n} className="border border-slate-200 rounded-lg p-3 bg-white text-center">
                <div className="text-xs text-slate-400 font-medium mb-1">{n}x</div>
                <div className="flex items-center justify-center gap-0.5">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxas[n] ?? 0}
                    onChange={(e) => setTaxas((prev) => ({ ...prev, [n]: Number(e.target.value) }))}
                    className="h-8 w-16 text-right text-sm"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
