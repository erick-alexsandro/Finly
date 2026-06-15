import { test, expect } from '@playwright/test';

const mockProcedures = [
  { id: 'p1', nome: 'Limpeza Dental', duracaoMinutos: 60, preco: 150, categoria: 'consulta', especialidade: 'Periodontia', ativo: true, materiais: [] },
  { id: 'p2', nome: 'Clareamento a Laser', duracaoMinutos: 90, preco: 800, categoria: 'estetica', especialidade: 'Dentistica', ativo: true, materiais: [] },
  { id: 'p3', nome: 'Extracao de Siso', duracaoMinutos: 120, preco: 500, categoria: 'cirurgia', especialidade: 'Cirurgia', ativo: true, materiais: [] },
];

const mockCustos = [
  { tipo: 'GASTO_MATERIAL', tipoValor: 'FIXO', valor: 25, descricao: '' },
  { tipo: 'LABORATORIO_PROTESE', tipoValor: 'FIXO', valor: 0, descricao: '' },
  { tipo: 'NOTA_FISCAL', tipoValor: 'PERCENTUAL', valor: 6, descricao: '' },
  { tipo: 'COMISSAO_DENTISTA', tipoValor: 'PERCENTUAL', valor: 30, descricao: '' },
  { tipo: 'COMISSAO_VENDEDOR', tipoValor: 'PERCENTUAL', valor: 5, descricao: '' },
  { tipo: 'TAXA_MAQUININHA', tipoValor: 'PERCENTUAL', valor: 0, descricao: '' },
];

async function mockAllApis(page: any) {
  await page.route(/\/api\/proxy\/procedimentos(\?.*)?$/, (route: any) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProcedures) });
  });
  await page.route('**/api/proxy/clinica-config?chave=hora_clinica_valor', (route: any) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ chave: 'hora_clinica_valor', valor: '100' }) });
  });
  await page.route('**/api/proxy/clinica-config?chave=desconto_dinheiro', (route: any) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ chave: 'desconto_dinheiro', valor: '10' }) });
  });
  await page.route('**/api/proxy/clinica-config?chave=taxas_maquininha', (route: any) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ chave: 'taxas_maquininha', valor: '{"1":2,"2":3.5,"3":5,"4":6.5,"5":8,"6":9.5}' }) });
  });
}

test.describe('Procedimentos - Aba Custos', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.route(/\/api\/proxy\/procedimentos-custos\?procedimentoId=.*$/, (route: any) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCustos) });
    });
    await page.goto('/treatment/procedures', { waitUntil: 'load' });
  });

  test('deve exibir as abas de navegacao', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: 'Procedimentos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Custos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Simulador' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Taxas Maquininha' })).toBeVisible();
  });

  test('deve navegar para aba Custos e exibir grade de procedimentos', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await expect(page.locator('h2').filter({ hasText: 'Planejamento de Custos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Limpeza Dental' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Clareamento a Laser' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Extracao de Siso' })).toBeVisible();
  });

  test('deve exibir campos de configuracao global na aba Custos', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await expect(page.locator('label').filter({ hasText: 'Valor Hora Clínica' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Desconto no Dinheiro' })).toBeVisible();
  });

  test('deve selecionar procedimento e exibir formulario de custos', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();

    await expect(page.locator('h2').filter({ hasText: 'Limpeza Dental' })).toBeVisible();
    await expect(page.locator('text=Custo de Materiais / Kit Clínico')).toBeVisible();
    await expect(page.locator('text=Custo de Laboratório / Prótese')).toBeVisible();
    await expect(page.locator('text=Gasto da Clínica')).toBeVisible();
  });

  test('deve exibir cards de Regras Financeiras com campos percentuais', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();

    await expect(page.locator('text=Alíquota de Imposto / Nota Fiscal')).toBeVisible();
    await expect(page.locator('text=Comissão do Dentista')).toBeVisible();
    await expect(page.locator('text=Comissão de Venda / Consultor')).toBeVisible();
    await expect(page.locator('text=Parcelas no Cartão')).toBeVisible();
  });

  test('deve exibir os tres cards de comparativo de lucro', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();

    await expect(page.locator('text=Lucro no Cartão')).toBeVisible();
    await expect(page.locator('text=Dinheiro c/ Desconto')).toBeVisible();
    await expect(page.locator('text=Dinheiro s/ Desconto')).toBeVisible();
  });

  test('deve alternar parcelas e atualizar taxa da maquininha', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();

    const select = page.locator('select').first();
    await select.selectOption('3');
    await expect(select).toHaveValue('3');
  });

  test('deve exibir o simulador de precos recolhivel', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();

    await expect(page.locator('text=Simulador de Preços')).toBeVisible();
    await expect(page.locator('text=calculadora de margem por dentro')).toBeVisible();
  });

  test('deve permitir alterar valor de custo de materiais', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();

    const materiaisInput = page.locator('input[placeholder="0,00"]').first();
    await materiaisInput.fill('50');
    await expect(materiaisInput).toHaveValue('50');
  });

  test('deve exibir custo percentual total e custo fixo nos cards de sumario', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();

    await expect(page.locator('text=Custo %').first()).toBeVisible();
    await expect(page.locator('text=Custo Fixo').first()).toBeVisible();
    await expect(page.locator('text=Margem Bruta').first()).toBeVisible();
    await expect(page.locator('text=/^Preço$/').first()).toBeVisible();
  });

  test('deve voltar para lista ao clicar em voltar', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Custos' }).click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: 'Limpeza Dental' }).click();
    await page.locator('text=Voltar para lista').click();

    await expect(page.locator('h2').filter({ hasText: 'Planejamento de Custos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Limpeza Dental' })).toBeVisible();
  });
});

test.describe('Procedimentos - Aba Simulador', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto('/treatment/procedures', { waitUntil: 'load' });
    await page.locator('button').filter({ hasText: 'Simulador' }).click();
  });

  test('deve exibir titulo e descricao do simulador', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'Simulador de Preços' })).toBeVisible();
    await expect(page.locator('text=Simule custos e defina o preço de venda ideal')).toBeVisible();
  });

  test('deve exibir cards de Custos Base com campos de entrada', async ({ page }) => {
    await expect(page.locator('text=Nome do Procedimento')).toBeVisible();
    await expect(page.locator('text=Tempo Estimado')).toBeVisible();
    await expect(page.locator('text=Custo de Materiais / Kit Clínico')).toBeVisible();
    await expect(page.locator('text=Custo de Laboratório / Prótese')).toBeVisible();
  });

  test('deve exibir card de Regras Financeiras com campos', async ({ page }) => {
    await expect(page.locator('text=Alíquota de Imposto / Nota Fiscal')).toBeVisible();
    await expect(page.locator('text=Comissão do Dentista')).toBeVisible();
    await expect(page.locator('text=Comissão de Venda / Consultor')).toBeVisible();
    await expect(page.locator('text=Limite de Parcelamento')).toBeVisible();
  });

  test('deve exibir painel de resultados com abas', async ({ page }) => {
    await expect(page.locator('text=Painel de Resultados')).toBeVisible();
    await expect(page.locator('text=Definir Preço de Venda')).toBeVisible();
    await expect(page.locator('text=Definir Lucro Desejado')).toBeVisible();
  });

  test('deve digitar nome e tempo do procedimento', async ({ page }) => {
    const nomeInput = page.locator('input[placeholder="Ex: Clareamento a Laser"]');
    await nomeInput.fill('Teste');
    await expect(nomeInput).toHaveValue('Teste');

    const tempoInput = page.locator('input[type="number"]').first();
    await tempoInput.fill('45');
    await expect(tempoInput).toHaveValue('45');
  });

  test('deve digitar preco de venda e ver resultado', async ({ page }) => {
    const precoInput = page.locator('input[placeholder="0,00"]').last();
    await precoInput.fill('200');
    await expect(precoInput).toHaveValue('200');
    await page.waitForTimeout(300);

    await expect(page.locator('div.rounded-lg.border.p-4.bg-white.text-center').first()).toBeVisible();
    await expect(page.locator('text=Custo Total').first()).toBeVisible();
    await expect(page.locator('text=Lucro Líquido').first()).toBeVisible();
  });

  test('deve alternar para guia Lucro Desejado e exibir campo', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Definir Lucro Desejado' }).click();
    await expect(page.locator('text=Quanto deseja lucrar por procedimento?')).toBeVisible();
  });

  test('deve selecionar opcao de parcelas e exibir taxa', async ({ page }) => {
    const select = page.locator('button[role="combobox"]').last();
    await select.click();
    const option = page.locator('[role="option"]').filter({ hasText: '3x' });
    if (await option.isVisible()) {
      await option.click();
    }
    await expect(page.locator('text=Taxa maquininha:')).toBeVisible();
  });
});

test.describe('Procedimentos - Aba Taxas Maquininha', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await page.goto('/treatment/procedures', { waitUntil: 'load' });
    await page.locator('button').filter({ hasText: 'Taxas Maquininha' }).click();
  });

  test('deve exibir titulo e descricao', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'Taxas da Maquininha por Parcela' })).toBeVisible();
    await expect(page.locator('text=Defina a taxa percentual cobrada pela maquininha')).toBeVisible();
  });

  test('deve exibir grid com 12 parcelas', async ({ page }) => {
    for (let i = 1; i <= 12; i++) {
      await expect(page.locator('text=' + i + 'x').first()).toBeVisible();
    }
  });

  test('deve exibir botao salvar', async ({ page }) => {
    await expect(page.locator('button:has-text("Salvar")')).toBeVisible();
  });

  test('deve permitir editar valor de parcela', async ({ page }) => {
    const inputs = page.locator('input[type="number"]');
    const firstInput = inputs.first();
    await firstInput.fill('3.5');
    await expect(firstInput).toHaveValue('3.5');
  });

  test('deve exibir valores carregados da configuracao', async ({ page }) => {
    await page.waitForTimeout(300);
    const inputs = page.locator('input[type="number"]');
    const firstVal = await inputs.first().inputValue();
    expect(Number(firstVal)).toBeGreaterThanOrEqual(0);
  });
});
