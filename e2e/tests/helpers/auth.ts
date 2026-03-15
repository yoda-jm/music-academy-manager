import { Page } from '@playwright/test';

// Académie Les Hirondelles seed credentials
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hirondelles-musique.fr';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234!';

export const TEACHER_EMAIL = 'h.marchand@hirondelles-musique.fr';
export const TEACHER_PASSWORD = 'Teacher1234!';

export const PARENT_EMAIL = 'f.martin@famille.fr';
export const PARENT_PASSWORD = 'Parent1234!';

export const STUDENT_EMAIL = 'sandrine.beaumont@email.fr';
export const STUDENT_PASSWORD = 'Student1234!';

/**
 * Log in via the UI and wait for the dashboard to load.
 * Waits for networkidle so Vite has finished loading all modules before interacting.
 */
export async function loginAs(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/login');
  // Wait until Vite has finished serving all modules (dev mode lazy loading)
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="password-input"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
  // Wait until we leave the login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  // Ensure the app has settled after login
  await page.waitForLoadState('networkidle');
}
