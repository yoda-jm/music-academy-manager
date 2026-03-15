import { test, expect, chromium } from '@playwright/test';
import { loginAs } from './helpers/auth';

const TS = Date.now();
const STUDENT_LAST = `Student${TS}`;
const STUDENT_EMAIL = `e2e.student.${TS}@test.local`;
const STUDENT_PASSWORD = 'StudentPass1!';

test.describe('Students management', () => {
  test.afterAll(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
      await loginAs(page);
      await page.goto('/students');
      await page.waitForLoadState('networkidle');
      const search = page.locator('[data-testid="search-students"]');
      await search.fill(STUDENT_LAST);
      const row = page.locator('[data-testid="student-row"]').filter({ hasText: STUDENT_LAST });
      const found = await row.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!found) return;
      await row.click();
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="student-delete-btn"]').click();
      const dialog = page.getByRole('dialog');
      await dialog.locator('[data-testid="confirm-delete-student-btn"]').click();
      await page.waitForURL('/students', { timeout: 10_000 });
    } finally {
      await browser.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
  });

  test('students page loads with seed data', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /students/i })).toBeVisible();
    await expect(page.locator('[data-testid="add-student-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="student-row"]').first()).toBeVisible({ timeout: 8_000 });
    // Search for a known seed student to confirm seed data is present
    const search = page.locator('[data-testid="search-students"]');
    await search.fill('Martin');
    await expect(page.getByText(/martin/i).first()).toBeVisible({ timeout: 8_000 });
    await search.clear();
  });

  test('can search students by last name', async ({ page }) => {
    const search = page.locator('[data-testid="search-students"]');
    await search.fill('Dupont');
    await expect(page.getByText(/dupont/i).first()).toBeVisible({ timeout: 8_000 });
    await search.clear();
  });

  test('search with no result shows empty state', async ({ page }) => {
    const search = page.locator('[data-testid="search-students"]');
    await search.fill('nonexistent_xyz_abc');
    await expect(page.getByText(/no students found/i)).toBeVisible({ timeout: 8_000 });
    await search.clear();
  });

  test('can open and close add student dialog', async ({ page }) => {
    await page.locator('[data-testid="add-student-btn"]').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/first name/i)).toBeVisible();
    await dialog.locator('[data-testid="cancel-student-btn"]').click();
    await expect(dialog).not.toBeVisible();
  });

  test('can create a new student', async ({ page }) => {
    await page.locator('[data-testid="add-student-btn"]').click();
    const dialog = page.getByRole('dialog');

    await dialog.getByLabel(/first name/i).fill('E2E');
    await dialog.getByLabel(/last name/i).fill(STUDENT_LAST);
    await dialog.getByLabel(/email/i).fill(STUDENT_EMAIL);
    await dialog.getByLabel(/password/i).fill(STUDENT_PASSWORD);

    await dialog.locator('[data-testid="submit-student-btn"]').click();

    await expect(page.getByText(/student created/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(STUDENT_LAST)).toBeVisible({ timeout: 10_000 });
  });

  test('student row links to detail page', async ({ page }) => {
    const row = page.locator('[data-testid="student-row"]').first();
    await expect(row).toBeVisible({ timeout: 8_000 });
    await row.click();
    await expect(page).toHaveURL(/\/students\/[a-z0-9]+/);
  });

  test('can deactivate and reactivate a student', async ({ page }) => {
    const row = page.locator('[data-testid="student-row"]').first();
    await expect(row).toBeVisible({ timeout: 8_000 });
    await row.click();
    await expect(page).toHaveURL(/\/students\/[a-z0-9]+/);

    const toggleBtn = page.locator('[data-testid="student-toggle-active-btn"]');
    await expect(toggleBtn).toBeVisible({ timeout: 8_000 });
    const initialLabel = await toggleBtn.textContent();

    await toggleBtn.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-testid="confirm-toggle-active-btn"]').click();

    await expect(page.getByText(/student (deactivated|reactivated)/i).first()).toBeVisible({ timeout: 10_000 });

    // Button label has flipped (wait for query refetch)
    await expect(page.locator('[data-testid="student-toggle-active-btn"]')).not.toHaveText(initialLabel!, { timeout: 8_000 });

    // Restore
    await page.locator('[data-testid="student-toggle-active-btn"]').click();
    await page.getByRole('dialog').locator('[data-testid="confirm-toggle-active-btn"]').click();
    await expect(page.getByText(/student (deactivated|reactivated)/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
