import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

const TS = Date.now();
const EVENT_NAME = `E2E Event ${TS}`;

test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
  });

  test('events page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
  });

  test('can switch to past events tab', async ({ page }) => {
    await page.getByRole('button', { name: /past/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
  });

  test('can open an event detail page', async ({ page }) => {
    // Try upcoming first, fall back to past if empty
    let card = page.locator('[data-testid="event-card"]').first();
    const hasUpcoming = await card.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasUpcoming) {
      await page.getByRole('button', { name: /past/i }).click();
      await page.waitForLoadState('networkidle');
    }
    card = page.locator('[data-testid="event-card"]').first();
    const hasAny = await card.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasAny) {
      test.skip();
      return;
    }
    await card.click();
    await expect(page).toHaveURL(/\/events\/[a-z0-9]+/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="event-detail-title"]')).toBeVisible({ timeout: 8_000 });
  });

  test('admin can create an event', async ({ page }) => {
    await page.locator('button', { hasText: /create event/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/event name/i).fill(EVENT_NAME);
    await dialog.locator('[data-testid="event-start-date"]').fill('2026-12-01T10:00');
    await dialog.locator('[data-testid="event-end-date"]').fill('2026-12-01T12:00');

    await dialog.locator('[data-testid="submit-event-btn"]').click();
    await expect(page.getByText(/event created/i).first()).toBeVisible({ timeout: 10_000 });
    // Reload to ensure fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="event-card"]').filter({ hasText: EVENT_NAME })).toBeVisible({ timeout: 15_000 });
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAs(page);
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    const card = page.locator('[data-testid="event-card"]').filter({ hasText: EVENT_NAME });
    if (await card.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await card.locator('button').click();
      const deleteBtn = page.getByRole('button', { name: /delete/i }).last();
      if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await deleteBtn.click();
      }
    }
    await page.close();
  });
});
