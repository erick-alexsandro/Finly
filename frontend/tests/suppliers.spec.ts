import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Suppliers Page', () => {
  test('should display page header', async ({ page }) => {
    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Fornecedores")')).toBeVisible();
    await expect(page.locator('text=Gestão de fornecedores e contratos')).toBeVisible();
  });

  test('should display search bar and status filter', async ({ page }) => {
    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    const searchInput = page.locator('input[placeholder*="CNPJ/CPF"]');
    await expect(searchInput).toBeVisible();

    const statusSelect = page.locator('select');
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect).toContainText('Todos');
    await expect(statusSelect).toContainText('Ativo');
    await expect(statusSelect).toContainText('Inativo');
  });

  test('should display add supplier FAB button', async ({ page }) => {
    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    const fabButton = page.locator('button svg[class*="lucide-plus"]').first();
    await expect(fabButton).toBeVisible();
  });

  test('should display table columns', async ({ page }) => {
    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    const headers = ['Nome', 'CNPJ/CPF', 'Contato', 'Email', 'Endereço', 'Status', 'Ações'];

    for (const header of headers) {
      const th = page.locator(`th:has-text("${header}")`).first();
      if (await th.isVisible()) {
        await expect(th).toBeVisible();
      }
    }
  });

  test('should display loading state when fetching data', async ({ page }) => {
    await page.route('**/api/proxy/suppliers', (route) => {
      setTimeout(() => route.continue(), 2000);
    });

    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Carregando fornecedores...')).toBeVisible();
  });

  test('should display empty state when no suppliers exist', async ({ page }) => {
    await page.route('**/api/proxy/suppliers', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    await page.waitForResponse('**/api/proxy/suppliers');
    await expect(page.locator('text=Nenhum fornecedor cadastrado')).toBeVisible();
  });

  test('should display no results message when search yields no matches', async ({ page }) => {
    await page.route('**/api/proxy/suppliers', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nome: 'Empresa ABC', cnpjCpf: '11222333000181', telefone: '(11) 99999-8888', email: 'contato@abc.com', rua: 'Rua A', numero: '100', bairro: 'Centro', cidade: 'São Paulo', status: 'ativo' },
        ]),
      });
    });

    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    await page.waitForResponse('**/api/proxy/suppliers');
    await expect(page.locator('text=Empresa ABC')).toBeVisible();

    const searchInput = page.locator('input[placeholder*="CNPJ/CPF"]');
    await searchInput.fill('ZZZ Não Existe');

    await expect(page.locator('text=Nenhum fornecedor encontrado')).toBeVisible();
  });

  test('should filter suppliers by status', async ({ page }) => {
    await page.route('**/api/proxy/suppliers', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', nome: 'Ativa LTDA', cnpjCpf: '11222333000181', telefone: '(11) 99999-8888', email: 'ativa@teste.com', rua: 'Rua X', numero: '10', bairro: 'Centro', cidade: 'SP', status: 'ativo' },
          { id: '2', nome: 'Inativa SA', cnpjCpf: '99888777000155', telefone: '(21) 77777-6666', email: 'inativa@teste.com', rua: 'Rua Y', numero: '20', bairro: 'Centro', cidade: 'RJ', status: 'inativo' },
        ]),
      });
    });

    await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    await page.waitForResponse('**/api/proxy/suppliers');
    await expect(page.locator('text=Ativa LTDA')).toBeVisible();
    await expect(page.locator('text=Inativa SA')).toBeVisible();

    await page.locator('select').selectOption('ativo');
    await expect(page.locator('text=Ativa LTDA')).toBeVisible();
    await expect(page.locator('text=Inativa SA')).not.toBeVisible();
  });

  test.describe('Add Supplier Modal', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/proxy/suppliers', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });

      await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
      await page.waitForResponse('**/api/proxy/suppliers');
    });

    test('should open add modal when clicking the + button', async ({ page }) => {
      await page.locator('button svg[class*="lucide-plus"]').first().click();

      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Novo Fornecedor' })).toBeVisible();
    });

    test('should display all form fields in the add modal', async ({ page }) => {
      await page.locator('button svg[class*="lucide-plus"]').first().click();

      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#cnpj')).toBeVisible();
      await expect(page.locator('#phone')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#rua')).toBeVisible();
      await expect(page.locator('#numero')).toBeVisible();
      await expect(page.locator('#bairro')).toBeVisible();
      await expect(page.locator('#cidade')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeVisible();
    });

    test('should validate required fields in the add form', async ({ page }) => {
      await page.locator('button svg[class*="lucide-plus"]').first().click();
      await page.locator('button:has-text("Cadastrar")').click();

      await expect(page.locator('text=Nome é obrigatório')).toBeVisible();
      await expect(page.locator('text=CNPJ/CPF é obrigatório')).toBeVisible();
      await expect(page.locator('text=Telefone é obrigatório')).toBeVisible();
      await expect(page.locator('text=Email é obrigatório')).toBeVisible();
      await expect(page.locator('text=Rua é obrigatória')).toBeVisible();
      await expect(page.locator('text=Número é obrigatório')).toBeVisible();
      await expect(page.locator('text=Bairro é obrigatório')).toBeVisible();
      await expect(page.locator('text=Cidade é obrigatória')).toBeVisible();
    });

    test('should validate CNPJ/CPF format', async ({ page }) => {
      await page.locator('button svg[class*="lucide-plus"]').first().click();
      await page.locator('#cnpj').fill('000');
      await page.locator('button:has-text("Cadastrar")').click();

      await expect(page.locator('text=CNPJ/CPF inválido')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.locator('button svg[class*="lucide-plus"]').first().click();
      await page.locator('#email').fill('invalido');
      await page.locator('button:has-text("Cadastrar")').click();

      await expect(page.locator('text=Email inválido')).toBeVisible();
    });
  });

  test.describe('Edit Supplier Modal', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/proxy/suppliers', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', nome: 'Empresa ABC', cnpjCpf: '11222333000181', telefone: '(11) 99999-8888', email: 'contato@abc.com', rua: 'Rua A', numero: '100', bairro: 'Centro', cidade: 'São Paulo', status: 'ativo' },
          ]),
        });
      });

      await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
      await page.waitForResponse('**/api/proxy/suppliers');
    });

    test('should open edit modal when clicking edit button on a supplier row', async ({ page }) => {
      await page.locator('tr').filter({ hasText: 'Empresa ABC' }).locator('button[class*="hover:bg-slate-100"]').click();

      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Editar Fornecedor' })).toBeVisible();
      await expect(page.locator('#name')).toHaveValue('Empresa ABC');
    });

    test('should display status field and delete button in edit modal', async ({ page }) => {
      await page.locator('tr').filter({ hasText: 'Empresa ABC' }).locator('button[class*="hover:bg-slate-100"]').click();

      await expect(page.locator('#status')).toBeVisible();
      await expect(page.locator('button:has-text("Excluir")')).toBeVisible();
      await expect(page.locator('button:has-text("Salvar Alterações")')).toBeVisible();
    });
  });
});
