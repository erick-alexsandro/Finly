"use client";

import React from "react";
import { ProcedureModal } from "./procedure-modal";
import { Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Procedure } from "../page";

interface ProcedureTableProps {
  procedures: Procedure[];
  onUpdate?: () => void;
}

const categoryColors: Record<string, string> = {
  consulta: "bg-blue-100 text-blue-700",
  exame: "bg-purple-100 text-purple-700",
  cirurgia: "bg-red-100 text-red-700",
  tratamento: "bg-amber-100 text-amber-700",
  manutenção: "bg-teal-100 text-teal-700",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ProcedureTable({ procedures, onUpdate }: ProcedureTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Procedimento
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Categoria
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Especialidade
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Preço
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Duração
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700">
                Materiais
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
            {procedures.map((procedure) => (
              <tr
                key={procedure.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="text-slate-900 font-medium">{procedure.nome}</div>
                  {procedure.descricao && (
                    <div className="text-slate-400 text-xs mt-0.5 max-w-[200px] truncate">
                      {procedure.descricao}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {procedure.categoria ? (
                    <Badge
                      className={
                        categoryColors[procedure.categoria] ||
                        "bg-slate-100 text-slate-700"
                      }
                    >
                      {procedure.categoria}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {procedure.especialidade || <span className="text-slate-400">—</span>}
                </td>
                <td className="px-6 py-4 text-slate-900 font-medium">
                  {procedure.preco != null ? formatCurrency(procedure.preco) : "—"}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {procedure.duracaoMinutos
                    ? `${procedure.duracaoMinutos} min`
                    : "—"}
                </td>
                <td className="px-6 py-4">
                  {procedure.materiais && procedure.materiais.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {procedure.materiais.slice(0, 2).map((mat) => (
                        <Badge
                          key={mat.materialId}
                          className="bg-slate-100 text-slate-600 text-xs"
                        >
                          {mat.materialNome || `#${mat.materialId}`}
                          <span className="ml-0.5 text-slate-400">x{mat.quantidade}</span>
                        </Badge>
                      ))}
                      {procedure.materiais.length > 2 && (
                        <Badge className="bg-slate-100 text-slate-400 text-xs">
                          +{procedure.materiais.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={procedure.ativo ? "default" : "secondary"}
                    className={
                      procedure.ativo
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                    }
                  >
                    {procedure.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <ProcedureModal
                    mode="edit"
                    initialData={procedure}
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
