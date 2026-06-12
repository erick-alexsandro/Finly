"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ProcedureModal } from "./_components/procedure-modal";
import { ProcedureTable } from "./_components/procedure-table";
import { ProcedimentoCustos } from "./_components/procedure-custos";
import { ProcedimentoSimulador } from "./_components/procedure-simulador";
import { ProcedimentoTaxasMaquininha } from "./_components/procedure-taxas-maquininha";
import { AdminOrOwnerOnly } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, ReceiptText, Calculator, CreditCard } from "lucide-react";

export interface Procedure {
  id: string;
  nome: string;
  descricao?: string;
  duracaoMinutos: number;
  preco: number;
  categoria?: string;
  especialidade?: string;
  ativo: boolean;
  materiais?: ProcedimentoMaterial[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ProcedimentoMaterial {
  id?: number;
  materialId: number;
  materialNome?: string;
  materialUnidade?: string;
  quantidade: number;
}

export default function ProceduresPage() {
  const [tab, setTab] = useState<"procedimentos" | "custos" | "simulador" | "taxas">("procedimentos");
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [especialidadeFilter, setEspecialidadeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(true);

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("nome", searchTerm);
      if (categoriaFilter) params.append("categoria", categoriaFilter);
      if (especialidadeFilter) params.append("especialidade", especialidadeFilter);
      if (statusFilter !== "todos") params.append("ativo", statusFilter === "ativo" ? "true" : "false");

      const response = await fetch(`/api/proxy/procedimentos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProcedures(data);
      }
    } catch (error) {
      console.error("Erro ao buscar procedimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, [searchTerm, categoriaFilter, especialidadeFilter, statusFilter]);

  useEffect(() => {
    fetch("/api/proxy/procedimentos")
      .then((res) => res.ok && res.json())
      .then((data) => data && setAllProcedures(data));
  }, []);

  const categorias = useMemo(() => {
    const set = new Set(allProcedures.map((p) => p.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [allProcedures]);

  const especialidades = useMemo(() => {
    const set = new Set(allProcedures.map((p) => p.especialidade).filter(Boolean));
    return Array.from(set).sort();
  }, [allProcedures]);

  const getStatusLabel = (value: string) => {
    if (value === "todos") return "Todos";
    if (value === "ativo") return "Ativo";
    if (value === "inativo") return "Inativo";
    return "Ativo/Inativo";
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <AdminOrOwnerOnly>
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="flex justify-between items-end mb-6 max-w-7xl mx-auto">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-[#1E293B]">Procedimentos</h1>
          <p className="text-slate-500">Gestão de procedimentos odontológicos</p>
        </div>
        {tab === "procedimentos" && (
          <ProcedureModal
            mode="add"
            onSuccess={fetchProcedures}
            trigger={
              <Button variant="outline" className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Novo Procedimento
              </Button>
            }
          />
        )}
      </header>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-1 border-b border-slate-200">
          <button
            onClick={() => setTab("procedimentos")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === "procedimentos"
                ? "border-[#1E293B] text-[#1E293B]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Procedimentos
          </button>
          <button
            onClick={() => setTab("custos")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px inline-flex items-center gap-1.5 ${
              tab === "custos"
                ? "border-[#1E293B] text-[#1E293B]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <ReceiptText className="h-4 w-4" />
            Custos
          </button>
          <button
            onClick={() => setTab("simulador")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px inline-flex items-center gap-1.5 ${
              tab === "simulador"
                ? "border-[#1E293B] text-[#1E293B]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Calculator className="h-4 w-4" />
            Simulador
          </button>
          <button
            onClick={() => setTab("taxas")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px inline-flex items-center gap-1.5 ${
              tab === "taxas"
                ? "border-[#1E293B] text-[#1E293B]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Taxas Maquininha
          </button>
        </div>
      </div>

      {tab === "custos" ? (
        <div className="max-w-7xl mx-auto">
          <ProcedimentoCustos onBack={() => setTab("procedimentos")} />
        </div>
      ) : tab === "simulador" ? (
        <div className="max-w-7xl mx-auto">
          <ProcedimentoSimulador />
        </div>
      ) : tab === "taxas" ? (
        <div className="max-w-7xl mx-auto">
          <ProcedimentoTaxasMaquininha />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Pesquisar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-slate-900"
              />
            </div>

            <Select value={categoriaFilter} onValueChange={(v) => setCategoriaFilter(v ?? "")}>
              <SelectTrigger className="w-[180px]">
                <span>{categoriaFilter ? capitalize(categoriaFilter) : "Todas Categorias"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas Categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={especialidadeFilter} onValueChange={(v) => setEspecialidadeFilter(v ?? "")}>
              <SelectTrigger className="w-[180px]">
                <span>{especialidadeFilter ? capitalize(especialidadeFilter) : "Todas Especialidades"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas Especialidades</SelectItem>
                {especialidades.map((esp) => (
                  <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "todos")}>
              <SelectTrigger className="w-[150px]">
                <span>{getStatusLabel(statusFilter) || "Ativo/Inativo"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400 font-medium italic">
              Carregando procedimentos...
            </div>
          ) : procedures.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl text-slate-400">
              {searchTerm || categoriaFilter || especialidadeFilter || statusFilter !== "todos"
                ? "Nenhum procedimento encontrado com os filtros selecionados"
                : "Nenhum procedimento cadastrado"}
            </div>
          ) : (
            <ProcedureTable
              procedures={procedures}
              onUpdate={fetchProcedures}
            />
          )}
        </div>
      )}
    </div>
    </AdminOrOwnerOnly>
  );
}
