"use client";

import { useState } from "react";
import { Package, AlertTriangle, Edit2, Clock, ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { ProductModal } from "./product-modal";

interface Product {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
  price: number;
}

interface Movement {
  id: number;
  produtoId: number;
  produtoNome: string;
  tipo: "ENTRY" | "EXIT";
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  precoCompra: number | null;
  descricao: string;
  criadoEm: string;
}

interface ProductCardProps {
  product: Product;
  onDelete?: () => void;
}

export function ProductCard({ product, onDelete }: ProductCardProps) {
  const isLowStock = product.quantity <= product.minStock;
  const [showHistory, setShowHistory] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setShowHistory(true);
    if (movements.length === 0) {
      setLoadingHistory(true);
      try {
        const response = await fetch(`http://localhost:8080/api/movimentos?produtoId=${product.id}`);
        if (response.ok) {
          const data = await response.json();
          setMovements(data);
        }
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white border rounded-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="p-5">
        {isLowStock && (
          <div className="absolute top-0 right-0 bg-red-100 text-red-600 px-3 py-1 rounded-bl-lg flex items-center gap-1 text-xs font-bold z-10">
            <AlertTriangle className="h-3 w-3" />
            ESTOQUE BAIXO
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-md text-slate-600">
            <Package className="h-6 w-6" />
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="font-bold text-slate-800 leading-tight mb-1 truncate pr-16" title={product.name}>
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 uppercase font-medium tracking-wide">
              {product.unit}
            </p>
          </div>

          <ProductModal 
            mode="edit" 
            initialData={product}
            onSuccess={onDelete}
            trigger={
              <button className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-[#1E293B] transition-colors outline-none border border-transparent hover:border-slate-200">
                <Edit2 className="h-4 w-4" />
              </button>
            }
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quantidade</p>
            <p className={`text-lg font-bold ${isLowStock ? "text-red-600" : "text-slate-700"}`}>
              {product.quantity}
            </p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Preço Unit.</p>
            <p className="text-lg font-bold text-slate-700">
              R$ {(product.price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <button
          onClick={toggleHistory}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Clock className="h-3.5 w-3.5" />
          {showHistory ? "Ocultar histórico" : "Ver histórico"}
          {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {showHistory && (
        <div className="border-t bg-slate-50/50">
          {loadingHistory ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              Carregando histórico...
            </div>
          ) : movements.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {movements.map((mov) => (
                <div key={mov.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    mov.tipo === "ENTRY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {mov.tipo === "ENTRY" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${mov.tipo === "ENTRY" ? "text-green-700" : "text-red-700"}`}>
                        {mov.tipo === "ENTRY" ? "+" : "-"}{mov.quantidade}
                      </span>
                      <span className="text-slate-500">
                        ({mov.quantidadeAnterior} → {mov.quantidadeNova})
                      </span>
                    </div>
                    <span className="text-slate-400">{mov.descricao}</span>
                    {mov.precoCompra != null && (
                      <span className="text-slate-400 ml-1">
                        · R$ {mov.precoCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-slate-400">{formatDate(mov.criadoEm)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
