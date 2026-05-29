"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProductCard } from "./components/product-card";
import { ProductModal } from "./components/product-modal";
import { RestockModal } from "./components/restock-modal";
import { WithdrawModal } from "./components/withdraw-modal";
import { AdjustModal } from "./components/adjust-modal";
import { Plus, Package, ArrowUpFromLine, Equal, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="flex justify-between items-end mb-8 max-w-7xl mx-auto">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-[#1E293B]">Estoque de Materiais</h1>
          <p className="text-slate-500">Gestão integrada de insumos clínicos</p>
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

      <div ref={menuRef} className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
        {menuOpen && (
          <div className="flex flex-col gap-1 rounded-xl bg-white shadow-xl border border-slate-200 p-1.5 min-w-[220px] animate-in fade-in slide-in-from-bottom-4 duration-150">
            <button
              onClick={() => { setMenuOpen(false); setShowAdd(true); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Novo Material</p>
                <p className="text-xs text-slate-400 font-normal">Cadastrar um item novo</p>
              </div>
            </button>
            <button
              onClick={() => { setMenuOpen(false); setShowRestock(true); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-700">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Repor Estoque</p>
                <p className="text-xs text-slate-400 font-normal">Adicionar quantidade a um item existente</p>
              </div>
            </button>
            <button
              onClick={() => { setMenuOpen(false); setShowWithdraw(true); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-700">
                <ArrowUpFromLine className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Retirar do Estoque</p>
                <p className="text-xs text-slate-400 font-normal">Dar baixa em itens utilizados</p>
              </div>
            </button>
            <button
              onClick={() => { setMenuOpen(false); setShowAdjust(true); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-700">
                <Equal className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Ajustar Estoque</p>
                <p className="text-xs text-slate-400 font-normal">Definir quantidade exata do item</p>
              </div>
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-14 w-14 rounded-full bg-[#1E293B] flex items-center justify-center text-white shadow-xl hover:bg-[#0F172A] transition-all active:scale-95 outline-none"
        >
          {menuOpen ? <ChevronDown className="h-7 w-7" /> : <Plus className="h-7 w-7" strokeWidth={3} />}
        </button>
      </div>

      <ProductModal mode="add" open={showAdd} onOpenChange={setShowAdd} onSuccess={fetchProducts} />
      <RestockModal open={showRestock} onOpenChange={setShowRestock} onSuccess={fetchProducts} />
      <WithdrawModal open={showWithdraw} onOpenChange={setShowWithdraw} onSuccess={fetchProducts} />
      <AdjustModal open={showAdjust} onOpenChange={setShowAdjust} onSuccess={fetchProducts} />
    </div>
  );
}
