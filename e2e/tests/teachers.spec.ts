import { test, expect, chromium } from '@playwright/test';
import { loginAs } from './helpers/auth';

const TS = Date.now();
const TEACHER_FIRST = 'E2E';
const TEACHER_LAST = `Teacher${TS}`;
const TEACHER_EMAIL = `e2e.teacher.${TS}@test.local`;
const TEACHER_PASSWORD = 'TeacherPass1!';

test.describe('Teachers management', () => {
  test.afterAll(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
      await loginAs(page);
      await page.goto('/teachers');
      await page.waitForLoadState('networkidle');
      const search = page.locator('[data-testid="search-teachers"]');
      await search.fill(TEACHER_LAST);
      const row = page.locator('[data-testid="teacher-row"]').filter({ hasText: TEACHER_LAST });
      const found = await row.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!found) return;
      await row.click();
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="teacher-delete-btn"]').click();
      const dialog = page.getByRole('dialog');
      await dialog.locator('[data-testid="confirm-delete-teacher-btn"]').click();
      await page.waitForURL('/teachers', { timeout: 10_000 });
    } finally {
      await browser.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/teachers');
    await page.waitForLoadState('networkidle');
  });

  test('teachers page loads with seed data', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /teachers/i })).toBeVisible();
    await expect(page.locator('[data-testid="add-teacher-btn"]')).toBeVisible();
    // Seed data: 10 teachers should be visible
    await expect(page.locator('[data-testid="teacher-row"]').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-testid="teacher-row"]').filter({ hasText: 'Hélène' }).first()).toBeVisible();
    await expect(page.locator('[data-testid="teacher-row"]').filter({ hasText: 'Marchand' }).first()).toBeVisible();
  });

  test('displays teacher instruments badges', async ({ page }) => {
    await expect(page.getByText('Piano').first()).toBeVisible({ timeout: 8_000 });
  });

  test('can search teachers by name', async ({ page }) => {
    const search = page.locator('[data-testid="search-teachers"]');
    await search.fill('Leblanc');
    await expect(page.locator('[data-testid="teacher-row"]').filter({ hasText: 'Leblanc' })).toBeVisible({ timeout: 8_000 });
    // Other teachers should not be visible
    await expect(page.locator('[data-testid="teacher-row"]').filter({ hasText: 'Durand' })).not.toBeVisible();
    await search.clear();
  });

  test('search with no result shows empty state', async ({ page }) => {
    const search = page.locator('[data-testid="search-teachers"]');
    await search.fill('nonexistent_xyz_abc');
    await expect(page.getByText(/no teachers found/i)).toBeVisible({ timeout: 8_000 });
    await search.clear();
  });

  test('can open and close add teacher dialog', async ({ page }) => {
    await page.locator('[data-testid="add-teacher-btn"]').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/first name/i)).toBeVisible();
    await expect(dialog.getByLabel(/email/i)).toBeVisible();
    await expect(dialog.getByLabel(/password/i)).toBeVisible();
    await dialog.locator('[data-testid="cancel-teacher-btn"]').click();
    await expect(dialog).not.toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.locator('[data-testid="add-teacher-btn"]').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('[data-testid="submit-teacher-btn"]').click();
    await expect(dialog.getByText(/required/i).first()).toBeVisible();
  });

  test('can create a new teacher', async ({ page }) => {
    await page.locator('[data-testid="add-teacher-btn"]').click();
    const dialog = page.getByRole('dialog');

    await dialog.getByLabel(/first name/i).fill(TEACHER_FIRST);
    await dialog.getByLabel(/last name/i).fill(TEACHER_LAST);
    await dialog.getByLabel(/email/i).fill(TEACHER_EMAIL);
    await dialog.getByLabel(/password/i).fill(TEACHER_PASSWORD);

    await dialog.locator('[data-testid="submit-teacher-btn"]').click();

    await expect(page.getByText(/teacher created/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(TEACHER_LAST)).toBeVisible({ timeout: 10_000 });
  });

  test('teacher row links to detail page', async ({ page }) => {
    const row = page.locator('[data-testid="teacher-row"]').first();
    await expect(row).toBeVisible({ timeout: 8_000 });
    await row.click();
    await expect(page).toHaveURL(/\/teachers\/[a-z0-9]+/);
  });

  test('can deactivate and reactivate a teacher', async ({ page }) => {
    const row = page.locator('[data-testid="teacher-row"]').first();
    await expect(row).toBeVisible({ timeout: 8_000 });
    await row.click();
    await expect(page).toHaveURL(/\/teachers\/[a-z0-9]+/);

    const toggleBtn = page.locator('[data-testid="teacher-toggle-active-btn"]');
    await expect(toggleBtn).toBeVisible({ timeout: 8_000 });
    const initialLabel = await toggleBtn.textContent();

    // Deactivate (or reactivate)
    await toggleBtn.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-testid="confirm-toggle-active-btn"]').click();

    // Toast confirms action
    await expect(page.getByText(/teacher (deactivated|reactivated)/i).first()).toBeVisible({ timeout: 10_000 });

    // Button label has flipped (wait for query refetch)
    await expect(page.locator('[data-testid="teacher-toggle-active-btn"]')).not.toHaveText(initialLabel!, { timeout: 8_000 });

    // Restore original state
    await page.locator('[data-testid="teacher-toggle-active-btn"]').click();
    await page.getByRole('dialog').locator('[data-testid="confirm-toggle-active-btn"]').click();
    await expect(page.getByText(/teacher (deactivated|reactivated)/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
