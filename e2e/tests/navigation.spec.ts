import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

const NAV_ITEMS = [
  { testId: 'nav-dashboard', urlPattern: /\/$/, pageTestId: 'dashboard-page' },
  { testId: 'nav-calendar', urlPattern: /\/calendar/, heading: /calendar/i },
  { testId: 'nav-teachers', urlPattern: /\/teachers/, heading: /teachers/i },
  { testId: 'nav-students', urlPattern: /\/students/, heading: /students/i },
  { testId: 'nav-rooms', urlPattern: /\/rooms/, heading: /rooms/i },
  { testId: 'nav-courses', urlPattern: /\/courses/, heading: /courses/i },
  { testId: 'nav-reports', urlPattern: /\/reports/, heading: /reports/i },
  { testId: 'nav-vacations', urlPattern: /\/vacations/, heading: /vacations/i },
  { testId: 'nav-settings', urlPattern: /\/settings/, heading: /settings/i },
];

test.describe('Sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  for (const item of NAV_ITEMS) {
    test(`${item.testId} navigates to correct page`, async ({ page }) => {
      const link = page.locator(`[data-testid="${item.testId}"]`);
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(item.urlPattern, { timeout: 10_000 });
      if ('pageTestId' in item && item.pageTestId) {
        await expect(page.locator(`[data-testid="${item.pageTestId}"]`)).toBeVisible();
      } else if ('heading' in item && item.heading) {
        await expect(page.getByRole('heading', { name: item.heading }).first()).toBeVisible();
      }
    });
  }

  test('sidebar can be collapsed and expanded', async ({ page }) => {
    // Collapse sidebar
    await page.locator('[data-testid="sidebar-toggle"]').click();
    await expect(page.locator('[data-testid="sidebar-brand"]')).not.toBeVisible();

    // Wait for collapse animation to finish before expanding
    await page.waitForTimeout(400);

    // Expand again
    await page.locator('[data-testid="sidebar-toggle"]').click({ force: true });
    await expect(page.locator('[data-testid="sidebar-brand"]')).toBeVisible();
  });
});
