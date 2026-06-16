"use client";

import React, { useState, useEffect } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { ROLES } from "@/lib/auth/organization";
import { ProductCard } from "./components/product-card";
import { ProductModal } from "./components/product-modal";
import { RestockModal } from "./components/restock-modal";
import { WithdrawModal } from "./components/withdraw-modal";
import { AdjustModal } from "./components/adjust-modal";
import { Plus, Package, ArrowUpFromLine, Equal } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Product {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
  price: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtro, setFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/proxy/produtos");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error("Erro ao buscar produtos no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão com o backend:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const produtosFiltrados = products.filter((produto) => {
    if (filtro === "Todos") return true;
    if (filtro === "Estoque Baixo") return produto.quantity <= produto.minStock;
    if (filtro === "Estoque Normal") return produto.quantity > produto.minStock;
    return true;
  });

  return (
    <RoleGate allowedRoles={[ROLES.OWNER, ROLES.ADMIN, ROLES.RECEPTIONIST]}>
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="flex justify-between items-end mb-8 max-w-7xl mx-auto">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-[#1E293B]">Estoque de Materiais</h1>
          <p className="text-slate-500">Gestão integrada de insumos clínicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Novo Material
          </Button>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => setShowRestock(true)}>
            <Package className="h-4 w-4" />
            Repor Estoque
          </Button>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => setShowWithdraw(true)}>
            <ArrowUpFromLine className="h-4 w-4" />
            Retirar
          </Button>
          <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => setShowAdjust(true)}>
            <Equal className="h-4 w-4" />
            Ajustar
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto mb-8 flex gap-2">
        {["Todos", "Estoque Normal", "Estoque Baixo"].map((opcao) => (
          <button
            key={opcao}
            onClick={() => setFiltro(opcao)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === opcao
                ? "bg-[#1E293B] text-white shadow-md"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opcao}
          </button>
        ))}
      </div>

      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium italic">
            Carregando estoque...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtosFiltrados.map((item) => (
              <ProductCard 
                key={item.id}
                product={item} 
                onDelete={fetchProducts}
              />
            ))}
          </div>
        )}

        {!loading && produtosFiltrados.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl text-slate-400">
            Nenhum material encontrado para o filtro "{filtro}".
          </div>
        )}
      </main>

      <ProductModal mode="add" open={showAdd} onOpenChange={setShowAdd} onSuccess={fetchProducts} />
      <RestockModal open={showRestock} onOpenChange={setShowRestock} onSuccess={fetchProducts} />
      <WithdrawModal open={showWithdraw} onOpenChange={setShowWithdraw} onSuccess={fetchProducts} />
      <AdjustModal open={showAdjust} onOpenChange={setShowAdjust} onSuccess={fetchProducts} />
    </div>
    </RoleGate>
  );
}
