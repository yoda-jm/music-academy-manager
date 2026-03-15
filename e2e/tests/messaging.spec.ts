import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Messaging', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/messaging');
    await page.waitForLoadState('networkidle');
  });

  test('messaging page loads', async ({ page }) => {
    await expect(page.getByText(/messages/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
  });

  test('can open a conversation and see messages', async ({ page }) => {
    // Select first conversation from the list
    const convItem = page.locator('[data-testid="conversation-item"]').first();
    const hasConv = await convItem.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasConv) {
      // No conversations yet — skip
      test.skip();
      return;
    }
    await convItem.click();
    // Message thread should load (no infinite spinner)
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 10_000 });
  });

  test('can send a message in a conversation', async ({ page }) => {
    const convItem = page.locator('[data-testid="conversation-item"]').first();
    const hasConv = await convItem.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasConv) {
      test.skip();
      return;
    }
    await convItem.click();
    const input = page.locator('[data-testid="message-input"]');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('E2E test message');
    await page.locator('[data-testid="send-message-btn"]').click();
    await expect(page.getByText('E2E test message').first()).toBeVisible({ timeout: 10_000 });
  });
});
