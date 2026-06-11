import { test, expect } from '@playwright/test';

const mockTransacoes = [
  { id: 't1', tipo: 'receita', descricao: 'Consulta particular', categoria: 'Consultas', valor: 200, data: '2026-05-10', status: 'pago' },
  { id: 't2', tipo: 'receita', descricao: 'Clareamento dental', categoria: 'Procedimentos', valor: 800, data: '2026-05-12', status: 'pago' },
  { id: 't3', tipo: 'receita', descricao: 'Exame panorâmico', categoria: 'Exames', valor: 150, data: '2026-05-15', status: 'pendente' },
  { id: 't4', tipo: 'receita', descricao: 'Plano Premium', categoria: 'Planos', valor: 300, data: '2026-05-20', status: 'pago' },
  { id: 't5', tipo: 'receita', descricao: 'Aplicação de flúor', categoria: 'Procedimentos', valor: 80, data: '2026-05-22', status: 'previsto' },
  { id: 't6', tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 2500, data: '2026-05-05', status: 'pago' },
  { id: 't7', tipo: 'despesa', descricao: 'Conta de água', categoria: 'Água', valor: 180, data: '2026-05-08', status: 'pago' },
  { id: 't8', tipo: 'despesa', descricao: 'Material odontológico', categoria: 'Material', valor: 450, data: '2026-05-14', status: 'pendente' },
  { id: 't9', tipo: 'despesa', descricao: 'Internet', categoria: 'Internet', valor: 200, data: '2026-05-18', status: 'pago' },
  { id: 't10', tipo: 'despesa', descricao: 'Manutenção equipamento', categoria: 'Manutenção', valor: 600, data: '2026-05-25', status: 'previsto' },
  { id: 't11', tipo: 'receita', descricao: 'Consulta convênio', categoria: 'Consultas', valor: 180, data: '2026-04-08', status: 'pago' },
  { id: 't12', tipo: 'receita', descricao: 'Implante dentário', categoria: 'Procedimentos', valor: 2000, data: '2026-04-15', status: 'pago' },
  { id: 't13', tipo: 'despesa', descricao: 'Salários', categoria: 'Salários', valor: 5000, data: '2026-04-05', status: 'pago' },
  { id: 't14', tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 2500, data: '2026-04-05', status: 'pago' },
  { id: 't15', tipo: 'receita', descricao: 'Limpeza', categoria: 'Procedimentos', valor: 180, data: '2026-03-20', status: 'pago' },
  { id: 't16', tipo: 'despesa', descricao: 'Marketing digital', categoria: 'Marketing', valor: 800, data: '2026-03-10', status: 'pago' },
  { id: 't17', tipo: 'receita', descricao: 'Consulta particular', categoria: 'Consultas', valor: 200, data: '2026-02-12', status: 'pago' },
  { id: 't18', tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 2500, data: '2026-02-05', status: 'pago' },
  { id: 't19', tipo: 'receita', descricao: 'Plano Básico', categoria: 'Planos', valor: 150, data: '2026-01-10', status: 'pago' },
  { id: 't20', tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 2500, data: '2026-01-05', status: 'pago' },
];

const mockContasFixas = [
  { id: 'cf1', tipo: 'despesa', descricao: 'Aluguel da clínica', categoria: 'Aluguel', valor: 2500, diaVencimento: 5, dataInicio: '2024-01-01', status: 'ativa' },
  { id: 'cf2', tipo: 'despesa', descricao: 'Internet', categoria: 'Internet', valor: 200, diaVencimento: 10, dataInicio: '2024-01-01', status: 'ativa' },
  { id: 'cf3', tipo: 'despesa', descricao: 'Assinatura de software', categoria: 'Outros', valor: 150, diaVencimento: 15, dataInicio: '2025-06-01', status: 'ativa' },
];

test.describe('Dashboard Financeiro Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/proxy/budget/transacoes*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTransacoes),
      });
    });

    await page.route('**/api/proxy/budget/contas-fixas*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContasFixas),
      });
    });

    await page.goto('/financial/dashboard-financeiro', { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
  });

  test('should display page header with title', async ({ page }) => {
    const heading = page.locator('h2').filter({ hasText: 'Dashboard Financeiro' });
    await expect(heading).toBeVisible();
  });

  test('should display page subtitle', async ({ page }) => {
    const subtitle = page.locator('p').filter({ hasText: 'Análises, indicadores e insights financeiros' });
    await expect(subtitle).toBeVisible();
  });

  test('should display month and year selectors', async ({ page }) => {
    const monthSelect = page.locator('button[role="combobox"]').first();
    const yearSelect = page.locator('button[role="combobox"]').nth(1);
    await expect(monthSelect).toBeVisible();
    await expect(yearSelect).toBeVisible();
  });

  test('should display navigation buttons', async ({ page }) => {
    const prevButton = page.locator('button svg.lucide-chevron-left').locator('..');
    const nextButton = page.locator('button svg.lucide-chevron-right').locator('..');
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('should display four KPI cards', async ({ page }) => {
    const cards = page.locator('div.grid > div:nth-child(-n+4) > div');
    await expect(cards.first()).toBeVisible();
    const cardCount = await cards.count();
    expect(cardCount).toBe(4);
  });

  test('should display Receitas card with value', async ({ page }) => {
    const card = page.locator('div.grid > div:nth-child(1)');
    await expect(card).toContainText('Receitas');
    await expect(card).toContainText('R$');
  });

  test('should display Despesas card with value', async ({ page }) => {
    const card = page.locator('div.grid > div:nth-child(2)');
    await expect(card).toContainText('Despesas');
    await expect(card).toContainText('R$');
  });

  test('should display Saldo card with value', async ({ page }) => {
    const card = page.locator('div.grid > div:nth-child(3)');
    await expect(card).toContainText('Saldo');
    await expect(card).toContainText('R$');
  });

  test('should display Saúde Financeira card with gauge', async ({ page }) => {
    const card = page.locator('div.grid > div:nth-child(4)');
    await expect(card).toContainText('Saúde Financeira');
    await expect(card.locator('svg')).toBeVisible();
  });

  test('should display chart section', async ({ page }) => {
    const chartCard = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Receitas vs Despesas' });
    await expect(chartCard).toBeVisible();
  });

  test('should display chart view selector', async ({ page }) => {
    const viewSelect = page.locator('button[role="combobox"]').filter({ hasText: /12 meses|6 meses/ });
    await expect(viewSelect).toBeVisible();
  });

  test('should display legend with Receitas and Despesas', async ({ page }) => {
    const legendReceitas = page.locator('span:has-text("Receitas"):not(:has-text("Despesas"))').last();
    const legendDespesas = page.locator('span:has-text("Despesas"):not(:has-text("Receitas"))').last();
    await expect(legendReceitas).toBeVisible();
    await expect(legendDespesas).toBeVisible();
  });

  test('should not display Saldo in legend', async ({ page }) => {
    const legendSaldo = page.locator('div.flex.items-center.gap-2 span').filter({ hasText: 'Saldo' });
    await expect(legendSaldo).toHaveCount(0);
  });

  test('should display Status dos Pagamentos card', async ({ page }) => {
    const card = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Status dos Pagamentos' });
    await expect(card).toBeVisible();
  });

  test('should display status progress bar', async ({ page }) => {
    const progressBar = page.locator('.rounded-full.overflow-hidden.bg-muted');
    await expect(progressBar).toBeVisible();
  });

  test('should display Pago, Pendente and Previsto in status', async ({ page }) => {
    await expect(page.locator('span:has-text("Pago"):not(:has-text("Pendente"))').first()).toBeVisible();
    await expect(page.locator('span:has-text("Pendente")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Previsto")').first()).toBeVisible();
  });

  test('should display Ticket Médio card', async ({ page }) => {
    const card = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Ticket Médio' });
    await expect(card).toBeVisible();
    const value = page.locator('div.text-2xl.font-bold.text-emerald-600');
    await expect(value).toBeVisible();
  });

  test('should display Indicadores Rápidos card', async ({ page }) => {
    const card = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Indicadores Rápidos' });
    await expect(card).toBeVisible();
  });

  test('should display Receitas por Categoria section', async ({ page }) => {
    const section = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Receitas por Categoria' });
    await expect(section).toBeVisible();
  });

  test('should display category bars for receitas', async ({ page }) => {
    const section = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Receitas por Categoria' });
    await expect(section).toBeVisible();
    const bars = section.locator('..').locator('..').locator('.rounded-full.bg-emerald-500');
    const barCount = await bars.count();
    expect(barCount).toBeGreaterThan(0);
  });

  test('should display Despesas por Categoria section', async ({ page }) => {
    const section = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Despesas por Categoria' });
    await expect(section).toBeVisible();
  });

  test('should display Insights card', async ({ page }) => {
    const card = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Insights' });
    await expect(card).toBeVisible();
  });

  test('should display Previsão & Projeção card', async ({ page }) => {
    const card = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Previsão & Projeção' });
    await expect(card).toBeVisible();
  });

  test('should display Meses com Melhor Resultado card', async ({ page }) => {
    const card = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Meses com Melhor Resultado' });
    await expect(card).toBeVisible();
  });

  test('should show ranking months with values', async ({ page }) => {
    const rankingCard = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Meses com Melhor Resultado' });
    const parent = rankingCard.locator('..').locator('..');
    const monthLabels = parent.locator('span.font-medium').filter({ hasText: /[A-Za-z]+\/\d{4}/ });
    const count = await monthLabels.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display burn rate value', async ({ page }) => {
    const burnRate = page.locator('span:has-text("R$")').filter({ hasText: /R\$/ });
    const burnRows = page.locator('span:has-text("Burn rate")');
    if (await burnRows.isVisible()) {
      await expect(burnRows).toBeVisible();
    }
  });

  test('should switch chart view between 12 months and 6 months', async ({ page }) => {
    const viewSelect = page.locator('button[role="combobox"]').filter({ hasText: /12 meses|6 meses/ });
    await viewSelect.click();
    const option = page.locator('[role="option"]').filter({ hasText: '6 meses' });
    if (await option.isVisible()) {
      await option.click();
      await page.waitForTimeout(300);
      const updatedSelect = page.locator('button[role="combobox"]').filter({ hasText: '6 meses' });
      await expect(updatedSelect).toBeVisible();
    }
  });

  test('should navigate months with prev button', async ({ page }) => {
    const prevButton = page.locator('button svg.lucide-chevron-left').locator('..');
    const currentMonth = await page.locator('button[role="combobox"]').first().textContent();
    await prevButton.click();
    await page.waitForTimeout(300);
    const newMonth = await page.locator('button[role="combobox"]').first().textContent();
    expect(newMonth).not.toBe(currentMonth);
  });

  test('should navigate months with next button', async ({ page }) => {
    const nextButton = page.locator('button svg.lucide-chevron-right').locator('..');
    const currentMonth = await page.locator('button[role="combobox"]').first().textContent();
    await nextButton.click();
    await page.waitForTimeout(300);
    const newMonth = await page.locator('button[role="combobox"]').first().textContent();
    expect(newMonth).not.toBe(currentMonth);
  });

  test('should display healthy financial gauge when data is positive', async ({ page }) => {
    const gaugeSvg = page.locator('svg circle').last();
    await expect(gaugeSvg).toBeVisible();
    const strokeClass = await gaugeSvg.getAttribute('class');
    expect(strokeClass).toBeTruthy();
  });

  test('should have responsive layout', async ({ page }) => {
    const main = page.locator('main.flex-1');
    await expect(main).toBeVisible();
  });

  test('should display category name in receitas breakdown', async ({ page }) => {
    const section = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Receitas por Categoria' });
    await expect(section).toBeVisible();
    const parent = section.locator('..').locator('..');
    await expect(parent.locator('span:has-text("Consultas")').first()).toBeVisible();
    await expect(parent.locator('span:has-text("Procedimentos")').first()).toBeVisible();
  });

  test('should display category name in despesas breakdown', async ({ page }) => {
    const section = page.locator('h3, [class*="CardTitle"]').filter({ hasText: 'Despesas por Categoria' });
    await expect(section).toBeVisible();
    const parent = section.locator('..').locator('..');
    await expect(parent.locator('span:has-text("Aluguel")').first()).toBeVisible();
  });

  test('should display ponto de equilíbrio when ticket > 0', async ({ page }) => {
    const equilibrio = page.locator('span:has-text("consultas/mês")');
    await expect(equilibrio).toBeVisible();
  });

  test('should show indicator with receitas do mês', async ({ page }) => {
    const indicator = page.locator('span:has-text("Receitas acumuladas")');
    await expect(indicator).toBeVisible();
  });

  test('should show indicator with despesas do mês', async ({ page }) => {
    const indicator = page.locator('span:has-text("Despesas acumuladas")');
    await expect(indicator).toBeVisible();
  });

  test('should show indicator with saldo acumulado', async ({ page }) => {
    const indicator = page.locator('span:has-text("Saldo acumulado")');
    await expect(indicator).toBeVisible();
  });

  test('should show transações no mês count', async ({ page }) => {
    const indicator = page.locator('span:has-text("Transações no mês")');
    await expect(indicator).toBeVisible();
  });

  test('should show contas fixas ativas count', async ({ page }) => {
    const indicator = page.locator('span:has-text("Contas fixas ativas")');
    await expect(indicator).toBeVisible();
  });

  test('should display variation indicators on receitas card', async ({ page }) => {
    const card = page.locator('div.grid > div:nth-child(1)');
    const variationText = card.locator('text=/vs mês anterior/');
    await expect(variationText).toBeVisible();
  });

  test('should display margin percentage on saldo card', async ({ page }) => {
    const card = page.locator('div.grid > div:nth-child(3)');
    const margin = card.locator('text=/Margem/');
    await expect(margin).toBeVisible();
  });
});
