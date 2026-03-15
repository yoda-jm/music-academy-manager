import { test, expect } from '@playwright/test';
import { loginAs, TEACHER_EMAIL, TEACHER_PASSWORD, PARENT_EMAIL, PARENT_PASSWORD } from './helpers/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('dashboard page loads with key widgets', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test('shows admin greeting with name from seed data', async ({ page }) => {
    // Admin is Hélène Marchand (Admin)
    await expect(page.locator('[data-testid="dashboard-greeting"]')).toContainText(/hélène/i, { timeout: 8_000 });
  });

  test('shows sidebar navigation', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-teachers"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-students"]')).toBeVisible();
  });

  test('shows upcoming sessions widget', async ({ page }) => {
    await expect(page.getByText(/upcoming sessions/i)).toBeVisible({ timeout: 8_000 });
  });

  test('teacher login sees dashboard', async ({ page }) => {
    await loginAs(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-greeting"]')).toContainText(/hélène/i, { timeout: 8_000 });
  });

  test('parent login sees dashboard', async ({ page }) => {
    await loginAs(page, PARENT_EMAIL, PARENT_PASSWORD);
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-greeting"]')).toContainText(/frédéric/i, { timeout: 8_000 });
  });

  test('direct navigation to / after login stays on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
});
