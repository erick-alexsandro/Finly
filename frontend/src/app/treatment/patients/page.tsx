"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Plus, Search, MoreHorizontal, UserRound, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PatientModal } from "./_components/patient-modal";

interface Patient {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento: string | null;
  ativo: boolean;
}

function formatCPF(cpf: string) {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function formatPhone(phone: string) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }
  return phone;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/proxy/pacientes");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.sort((a: Patient, b: Patient) => a.nome.localeCompare(b.nome, "pt-BR")));
      }
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: any, id: string) => {
    e?.stopPropagation?.();
    if (!window.confirm("Tem certeza que deseja excluir este paciente?")) return;
    try {
      const res = await apiFetch(`/api/proxy/pacientes?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      } else {
        console.error("Erro ao excluir paciente:", await res.text());
      }
    } catch (err) {
      console.error("Erro ao excluir paciente:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E293B]">Pacientes</h1>
          <p className="text-slate-500">Gerencie os pacientes da clínica</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white">
            <div className="p-4">
              <Skeleton className="mb-3 h-8 w-full" />
              <Skeleton className="mb-3 h-12 w-full" />
              <Skeleton className="mb-3 h-12 w-full" />
              <Skeleton className="mb-3 h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white py-20 text-center">
            <UsersRound className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">
              {search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            </p>
            <p className="mb-6 text-sm text-slate-400">
              {search
                ? "Tente ajustar o termo da busca."
                : "Clique em \"Novo Paciente\" para cadastrar o primeiro."}
            </p>
            {!search && (
              <Button variant="outline" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" />
                Novo Paciente
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/treatment/patients/${patient.id}`)}
                  >
                    <TableCell className="font-medium">{patient.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCPF(patient.cpf)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPhone(patient.telefone)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={patient.ativo ? "default" : "secondary"}
                        className={patient.ativo ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                      >
                        {patient.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                          <DropdownMenuItem
                            onClick={() => router.push(`/treatment/patients/${patient.id}`)}
                          >
                            <UserRound className="h-4 w-4" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => handleDelete(e, patient.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <PatientModal
          open={showModal}
          onOpenChange={setShowModal}
          onSuccess={fetchPatients}
        />
      </div>
    </div>
  );
}
