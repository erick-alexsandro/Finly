export interface StockWarning {
  materialNome: string;
  materialUnidade?: string;
  quantidadeNeeded: number;
  quantidadeDisponivel: number;
  minStock?: number;
}

export interface ProductStock {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
}

export async function checkMaterialStock(
  materiais: { materialId: number; quantidade: number; materialNome?: string; materialUnidade?: string }[]
): Promise<StockWarning[]> {
  if (!materiais || materiais.length === 0) return [];

  const res = await fetch("/api/proxy/produtos").catch(() => null);
  if (!res || !res.ok) return [];

  const products: ProductStock[] = await res.json().catch(() => []);
  if (!Array.isArray(products)) return [];

  const warnings: StockWarning[] = [];

  for (const mat of materiais) {
    const product = products.find((p) => p.id === mat.materialId);
    if (!product) continue;

    const needed = mat.quantidade;
    const available = product.quantity;

    if (available < needed || available <= (product.minStock || 0)) {
      warnings.push({
        materialNome: mat.materialNome || product.name,
        materialUnidade: mat.materialUnidade || product.unit,
        quantidadeNeeded: needed,
        quantidadeDisponivel: available,
        minStock: product.minStock,
      });
    }
  }

  return warnings;
}
