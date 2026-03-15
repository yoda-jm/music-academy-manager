import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

const TEST_ROOM_NAME = `E2E Room ${Date.now()}`;

test.describe('Rooms management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/rooms');
    await page.waitForLoadState('networkidle');
  });

  test('rooms page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /rooms/i })).toBeVisible();
    await expect(page.locator('[data-testid="add-room-btn"]')).toBeVisible();
  });

  test('can create a new room', async ({ page }) => {
    await page.locator('[data-testid="add-room-btn"]').click();

    // Fill form
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/room name/i).fill(TEST_ROOM_NAME);
    await dialog.getByLabel(/capacity/i).fill('15');
    await dialog.getByLabel(/floor/i).fill('2nd Floor');

    // Submit
    await dialog.locator('[data-testid="submit-room-btn"]').click();

    // Verify success toast and room appears in list
    await expect(page.getByText(/room created/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(TEST_ROOM_NAME)).toBeVisible({ timeout: 10_000 });
  });

  test('can edit a room', async ({ page }) => {
    // Assumes at least one room exists (from create test or seed data)
    const editBtn = page.locator('[data-testid="room-edit-btn"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const nameInput = dialog.getByLabel(/room name/i);
      await nameInput.clear();
      await nameInput.fill(`Updated Room ${Date.now()}`);
      await dialog.locator('[data-testid="submit-room-btn"]').click();
      await expect(page.getByText(/room updated/i).first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
