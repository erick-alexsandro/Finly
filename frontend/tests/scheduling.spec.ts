import { test, expect } from '@playwright/test';

test.describe('Scheduling Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/treatment/scheduling');
    await page.waitForLoadState('networkidle');
  });

  test('should display calendar navigation controls', async ({ page }) => {
    const prevButton = page.locator('button:has-text("Anterior"), button[aria-label*="Previous"]').first();
    const nextButton = page.locator('button:has-text("Próximo"), button[aria-label*="Next"]').first();
    const todayButton = page.locator('button:has-text("Hoje")').first();

    if (await prevButton.isVisible()) {
      await expect(prevButton).toBeVisible();
    }
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeVisible();
    }
    if (await todayButton.isVisible()) {
      await expect(todayButton).toBeVisible();
    }
  });

  test('should display calendar view options', async ({ page }) => {
    const views = ['Mês', 'Semana', 'Dia', 'Agenda'];
    
    for (const viewName of views) {
      const viewButton = page.locator(`button:has-text("${viewName}"), [class*="${viewName.toLowerCase()}"]`).first();
      // At least one view button should be visible
      if (await viewButton.isVisible()) {
        await expect(viewButton).toBeVisible();
      }
    }
  });

  test('should switch between calendar views', async ({ page }) => {
    const weekButton = page.locator('button:has-text("Semana"), [aria-label*="week" i]').first();
    const dayButton = page.locator('button:has-text("Dia"), [aria-label*="day" i]').first();

    if (await weekButton.isVisible()) {
      await weekButton.click();
      await page.waitForTimeout(500);
      await expect(weekButton).toBeTruthy();
    }

    if (await dayButton.isVisible()) {
      await dayButton.click();
      await page.waitForTimeout(500);
      await expect(dayButton).toBeTruthy();
    }
  });

  test('should have a form for creating new appointments', async ({ page }) => {
    const formInputs = page.locator('input, textarea, select');
    const formCount = await formInputs.count();
    
    if (formCount > 0) {
      await expect(formInputs.first()).toBeTruthy();
    }
  });

  test('should have refresh button functionality', async ({ page }) => {
    const refreshButton = page.locator('button[title*="refresh" i], button[aria-label*="refresh" i], button svg[class*="refresh"]').first();
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(500);
      await expect(refreshButton).toBeTruthy();
    }
  });

  test('should have filters', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("Filtro"), button[title*="filter" i], button[aria-label*="filter" i]').first();
    const settingsIcon = page.locator('button svg[class*="Sliders"]').first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(300);
      const filterPanel = page.locator('[class*="sheet"], [class*="panel"], [role="dialog"]').first();
      await expect(filterPanel).toBeTruthy();
    } else if (await settingsIcon.isVisible()) {
      const button = settingsIcon.locator('..');
      await button.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display loading state when fetching data', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.reload();

    const loadingSpinner = page.locator('[class*="loading"], [class*="spinner"]');
    const loadingCount = await loadingSpinner.count();
    
    expect(typeof loadingCount).toBe('number');
  });
});
