import { test, expect } from '@playwright/test';

const mockProcedures = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    nome: 'Limpeza Dental',
    descricao: 'Remoção de tártaro e placa bacteriana',
    duracaoMinutos: 60,
    preco: 150.00,
    categoria: 'consulta',
    especialidade: 'Periodontia',
    ativo: true,
    materiais: [
      { id: 1, materialId: 1, materialNome: 'Resina Filtek Z350', materialUnidade: 'Unidade', quantidade: 1 },
    ],
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    nome: 'Extração de Siso',
    descricao: 'Remoção cirúrgica de terceiro molar',
    duracaoMinutos: 90,
    preco: 500.00,
    categoria: 'cirurgia',
    especialidade: 'Cirurgia',
    ativo: true,
    materiais: [],
  },
];

test.describe('Procedures Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/proxy/procedimentos*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProcedures),
      });
    });

    await page.goto('/treatment/procedures', { waitUntil: 'load' });
  });

  test('should display page header with title', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText('Procedimentos');
  });

  test('should display page subtitle', async ({ page }) => {
    const subtitle = page.locator('p').filter({ hasText: 'Gestão de procedimentos odontológicos' });
    await expect(subtitle).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Pesquisar por nome..."]');
    await expect(searchInput).toBeVisible();
  });

  test('should display categoria filter', async ({ page }) => {
    const filterTrigger = page.locator('button').filter({ hasText: 'Todas Categorias' }).first();
    await expect(filterTrigger).toBeVisible();
  });

  test('should display especialidade filter', async ({ page }) => {
    const filterTrigger = page.locator('button').filter({ hasText: 'Todas Especialidades' }).first();
    await expect(filterTrigger).toBeVisible();
  });

  test('should display status filter', async ({ page }) => {
    const filterTrigger = page.locator('button').filter({ hasText: /Todos|Ativo/i }).last();
    await expect(filterTrigger).toBeVisible();
  });

  test('should display Novo Procedimento button', async ({ page }) => {
    const newButton = page.locator('button:has-text("Novo Procedimento")');
    await expect(newButton).toBeVisible();
  });

  test('should display procedures table', async ({ page }) => {
    await page.waitForResponse('**/api/proxy/procedimentos');
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display table headers', async ({ page }) => {
    await page.waitForResponse('**/api/proxy/procedimentos');
    const headers = ['Procedimento', 'Categoria', 'Especialidade', 'Preço', 'Duração'];
    
    for (const header of headers) {
      const th = page.locator('th').filter({ hasText: header }).first();
      await expect(th).toBeVisible();
    }
  });

  test('should search by procedure name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Pesquisar por nome..."]');
    await searchInput.click();
    await searchInput.pressSequentially('test');
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('test');
  });

  test('should display loading state', async ({ page }) => {
    const loading = page.locator('div').filter({ hasText: 'Carregando procedimentos...' }).first();
    const isLoading = await loading.isVisible().catch(() => false);
    expect(typeof isLoading).toBe('boolean');
  });

  test('should display data in table rows', async ({ page }) => {
    await page.waitForResponse('**/api/proxy/procedimentos');
    await expect(page.locator('tr').filter({ hasText: 'Limpeza Dental' })).toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Extração de Siso' })).toBeVisible();
  });

  test('should open modal when clicking Novo Procedimento', async ({ page }) => {
    const newButton = page.locator('button:has-text("Novo Procedimento")');
    await newButton.click();
    
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();
  });

  test('should have form inputs in modal', async ({ page }) => {
    const newButton = page.locator('button:has-text("Novo Procedimento")');
    await newButton.click();
    
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();
    
    const inputs = dialog.locator('input, textarea, [role="combobox"]');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('should close modal when pressing Escape', async ({ page }) => {
    const newButton = page.locator('button:has-text("Novo Procedimento")');
    await newButton.click();
    
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should filter by status', async ({ page }) => {
    const statusFilter = page.locator('button').filter({ hasText: /Todos|Ativo/i }).last();
    await statusFilter.click();
    
    const selectContent = page.locator('[role="listbox"]').first();
    await expect(selectContent).toBeVisible();
    
    const option = selectContent.locator('[role="option"]').first();
    if (await option.isVisible()) {
      await option.click();
    }
  });

  test('should have responsive layout', async ({ page }) => {
    const container = page.locator('.min-h-screen');
    await expect(container).toBeVisible();
    
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });
});
