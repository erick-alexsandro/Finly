"use client";

import React from "react";
import { SupplierModal } from "./supplier-modal";
import { Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
}

interface SupplierTableProps {
  suppliers: Supplier[];
  onUpdate?: () => void;
}

const formatCNPJCPF = (cnpjCpf: string) => {
  if (cnpjCpf.length <= 11) {
    return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export function SupplierTable({ suppliers, onUpdate }: SupplierTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Nome
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                CNPJ/CPF
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Contato
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Email
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Endereço
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Status
              </th>
              <th className="text-center px-6 py-3 font-semibold text-slate-700">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {suppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 text-slate-900 font-medium">
                  {supplier.nome}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {formatCNPJCPF(supplier.cnpjCpf)}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {supplier.telefone}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <a
                    href={`mailto:${supplier.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {supplier.email}
                  </a>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm">
                  {supplier.rua}, {supplier.numero} - {supplier.bairro}, {supplier.cidade}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={supplier.status === "ativo" ? "default" : "secondary"}
                    className={
                      supplier.status === "ativo"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                    }
                  >
                    {supplier.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <SupplierModal
                    mode="edit"
                    initialData={supplier}
                    onSuccess={onUpdate}
                    trigger={
                      <button className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-[#1E293B] transition-colors outline-none border border-transparent hover:border-slate-200">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
