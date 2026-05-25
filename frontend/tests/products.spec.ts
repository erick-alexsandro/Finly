import { test, expect } from '@playwright/test';

const mockProducts = [
  { id: 1, name: 'Resina Filtek Z350', unit: 'Unidade', quantity: 25, minStock: 10, price: 45.90 },
  { id: 2, name: 'Luvas Cirúrgicas M', unit: 'Caixa', quantity: 3, minStock: 5, price: 32.50 },
  { id: 3, name: 'Algodão Hidrófilo', unit: 'Rolo', quantity: 15, minStock: 8, price: 8.75 },
];

const mockMovements = [
  { id: 1, produtoId: 1, produtoNome: 'Resina Filtek Z350', tipo: 'ENTRY', quantidade: 20, quantidadeAnterior: 5, quantidadeNova: 25, precoCompra: 42.00, descricao: 'Reposição de estoque', criadoEm: '2025-05-20T10:30:00Z' },
  { id: 2, produtoId: 1, produtoNome: 'Resina Filtek Z350', tipo: 'EXIT', quantidade: 3, quantidadeAnterior: 28, quantidadeNova: 25, descricao: 'Uso em procedimento', criadoEm: '2025-05-22T14:00:00Z' },
];

test.describe('Inventário de Produtos', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('http://localhost:8080/api/produtos', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProducts) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProducts[0]) });
      }
    });

    await page.route('http://localhost:8080/api/movimentos?produtoId=1', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMovements) });
    });

    await page.route('http://localhost:8080/api/produtos/1/repor-estoque', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...mockProducts[0], price: 44.50 }) });
    });

    await page.goto('/inventory/products');
    await page.waitForLoadState('networkidle');
  });

  test('exibe título, filtros e cards dos produtos', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Estoque de Materiais');
    await expect(page.locator('button:has-text("Todos")')).toBeVisible();
    await expect(page.locator('button:has-text("Estoque Baixo")')).toBeVisible();
    await expect(page.locator('text=Resina Filtek Z350').first()).toBeVisible();
    await expect(page.locator('text=Luvas Cirúrgicas M').first()).toBeVisible();
  });

  test('alterna entre filtros e exibe badge de estoque baixo', async ({ page }) => {
    await page.click('button:has-text("Estoque Baixo")');
    await expect(page.locator('button:has-text("Estoque Baixo")')).toHaveClass(/bg-\[#1E293B\]/);
    await expect(page.locator('text=ESTOQUE BAIXO').first()).toBeVisible();

    await page.click('button:has-text("Todos")');
    await expect(page.locator('text=ESTOQUE BAIXO').first()).toBeVisible();
  });

  test('exibe quantidade, preço e unidade no card', async ({ page }) => {
    const card = page.locator('text=Resina Filtek Z350').locator('..').locator('..');
    await expect(card.locator('text=25')).toBeVisible();
    await expect(card.locator('text=R$ 45,90')).toBeVisible();
    await expect(card.locator('text=UNIDADE')).toBeVisible();
  });

  test('expande histórico com movimentações e precoCompra', async ({ page }) => {
    await page.click('button:has-text("Ver histórico")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Reposição de estoque')).toBeVisible();
    await expect(page.locator('text=Uso em procedimento')).toBeVisible();
    await expect(page.locator('text=R$ 42,00/un')).toBeVisible();
    await expect(page.locator('text=Ocultar histórico')).toBeVisible();
  });

  test('abre e fecha menu FAB com 4 opções', async ({ page }) => {
    const fab = page.locator('button:has-text("Repor Estoque"), button:has-text("Novo Material")').last();
    await fab.click();
    await expect(page.locator('text=Novo Material')).toBeVisible();
    await expect(page.locator('text=Repor Estoque')).toBeVisible();
    await expect(page.locator('text=Retirar do Estoque')).toBeVisible();
    await expect(page.locator('text=Ajustar Estoque')).toBeVisible();

    await page.click('h1');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Novo Material')).not.toBeVisible();
  });

  test('abre modal Novo Material com campos obrigatórios', async ({ page }) => {
    const fab = page.locator('button:has-text("Repor Estoque"), button:has-text("Novo Material")').last();
    await fab.click();
    await page.click('text=Novo Material');
    await expect(page.locator('h2:has-text("Novo Material")')).toBeVisible();
    await expect(page.locator('label:has-text("Nome do Material")')).toBeVisible();
    await expect(page.locator('label:has-text("Qtd Inicial")')).toBeVisible();
  });

  test('abre modal Repor Estoque com preview de estoque', async ({ page }) => {
    const fab = page.locator('button:has-text("Repor Estoque"), button:has-text("Novo Material")').last();
    await fab.click();
    await page.click('text=Repor Estoque');
    await page.waitForTimeout(300);
    await expect(page.locator('h2:has-text("Repor Estoque")')).toBeVisible();
    await page.selectOption('select[id="produto-select"]', '1');
    await page.fill('input[id="qty-add"]', '10');
    await expect(page.locator('text=Estoque atual: 25')).toBeVisible();
    await expect(page.locator('text=Novo: 35')).toBeVisible();
  });

  test('abre modal Retirar do Estoque com validação', async ({ page }) => {
    const fab = page.locator('button:has-text("Repor Estoque"), button:has-text("Novo Material")').last();
    await fab.click();
    await page.click('text=Retirar do Estoque');
    await expect(page.locator('h2:has-text("Retirar do Estoque")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();
  });

  test('abre modal Ajustar Estoque', async ({ page }) => {
    const fab = page.locator('button:has-text("Repor Estoque"), button:has-text("Novo Material")').last();
    await fab.click();
    await page.click('text=Ajustar Estoque');
    await expect(page.locator('h2:has-text("Ajustar Estoque")')).toBeVisible();
    await expect(page.locator('label:has-text("Nova quantidade")')).toBeVisible();
  });

  test('exibe estado vazio quando não há produtos', async ({ page }) => {
    await page.route('http://localhost:8080/api/produtos', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Nenhum material encontrado')).toBeVisible();
  });

  test('exibe loading enquanto busca produtos', async ({ page }) => {
    await page.route('http://localhost:8080/api/produtos', (route) => {
      setTimeout(() => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProducts) }), 1000);
    });
    await page.reload();
    await expect(page.locator('text=Carregando estoque...')).toBeVisible();
  });
});
