import { test, expect } from '@playwright/test';
import { loginAs, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers/auth';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Music Academy' })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="email-input"]').fill('wrong@example.com');
    await page.locator('[data-testid="password-input"]').fill('wrongpassword');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10_000 });
  });

  test('successful admin login redirects to dashboard', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await loginAs(page);
    await page.locator('[data-testid="logout-btn"]').click();
    await page.waitForURL('/login');
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/teachers');
    await expect(page).toHaveURL(/\/login/);
  });

  test('password toggle shows and hides password', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill('mysecret');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.locator('button[tabindex="-1"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await page.locator('button[tabindex="-1"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
