import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Courses management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
  });

  test('courses page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();
  });

  test('has add course button', async ({ page }) => {
    await expect(page.locator('[data-testid="add-course-btn"]')).toBeVisible();
  });

  test('can search courses', async ({ page }) => {
    const search = page.locator('[data-testid="search-courses"]');
    await search.fill('nonexistent_xyz_abc');
    await expect(page.getByText(/no courses/i)).toBeVisible({ timeout: 8_000 });
  });
});
