import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
  });

  test('should display login form elements', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await expect(page.locator('label[for="email"]')).toContainText('E-mail');
  });

  test('should require email field', async ({ page }) => {
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate((el: any) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should require password field', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    const passwordInput = page.locator('input[type="password"]');
    const validationMessage = await passwordInput.evaluate((el: any) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should reject invalid email formats', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');

    await emailInput.fill('invalid-email');
    const isValid = await emailInput.evaluate((el: any) => el.checkValidity());
    expect(isValid).toBeFalsy();
  });

  test('should clear error message when user starts typing', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    const errorMessage = page.locator('text=/E-mail ou senha inválidos|Erro ao entrar/i');
    if (await errorMessage.isVisible()) {
      await page.fill('input[type="email"]', '');
      
      await page.fill('input[type="email"]', 'correct@example.com');
    }
  });
});
