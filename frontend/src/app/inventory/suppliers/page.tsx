"use client";

import React, { useState, useEffect } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { ROLES } from "@/lib/auth/organization";
import { SupplierModal } from "./_components/supplier-modal";
import { SupplierTable } from "./_components/supplier-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface Supplier {
  id: string;
  nome: string;
  cnpjCpf: string;
  telefone: string;
  email: string;
  endereco: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  status: "ativo" | "inativo";
  criadoEm?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/proxy/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        console.error("Erro ao buscar fornecedores");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.cnpjCpf?.includes(searchTerm) ||
          supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(
        (supplier) => supplier.status === statusFilter,
      );
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm, statusFilter]);

  return (
    <RoleGate allowedRoles={[ROLES.OWNER, ROLES.ADMIN, ROLES.RECEPTIONIST]}>
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="flex justify-between items-end mb-8 max-w-7xl mx-auto">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-[#1E293B]">Fornecedores</h1>
          <p className="text-slate-500">Gestão de fornecedores e contratos</p>
        </div>
        <SupplierModal
          mode="add"
          onSuccess={fetchSuppliers}
          trigger={
            <Button variant="outline" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          }
        />
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Barra de Pesquisa */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Pesquisar por nome, CNPJ/CPF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-slate-900"
            />
          </div>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 transition-colors text-slate-900"
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        {/* Tabela de Fornecedores */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium italic">
            Carregando fornecedores...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl text-slate-400">
            {suppliers.length === 0
              ? "Nenhum fornecedor cadastrado"
              : `Nenhum fornecedor encontrado para "${searchTerm}"`}
          </div>
        ) : (
          <SupplierTable
            suppliers={filteredSuppliers}
            onUpdate={fetchSuppliers}
          />
        )}
      </div>
    </div>
    </RoleGate>
  );
}
