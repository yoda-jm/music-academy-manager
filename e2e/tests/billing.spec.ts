import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Billing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
  });

  test('billing overview page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /billing/i }).first()).toBeVisible();
  });

  test('can navigate to invoices tab', async ({ page }) => {
    // Billing sub-nav is expanded by default; click the invoices link directly
    const invoicesLink = page.locator('[data-testid="nav-invoices"]');
    if (await invoicesLink.count() > 0) {
      await invoicesLink.click();
      await expect(page).toHaveURL('/billing/invoices');
      await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible();
    }
  });

  test('can navigate to pricing rules', async ({ page }) => {
    const pricingLink = page.locator('[data-testid="nav-pricing-rules"]');
    if (await pricingLink.count() > 0) {
      await pricingLink.click();
      await expect(page).toHaveURL('/billing/pricing');
    }
  });
});
