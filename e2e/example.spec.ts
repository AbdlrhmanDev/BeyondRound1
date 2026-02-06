import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/BeyondRounds - Connect with Fellow Physicians/);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  await page.waitForLoadState('networkidle'); // Wait for the page to be fully loaded

  // Try to find a link or button that contains the text 'Get Started'
  await page.locator('text=Get Started').first().click();

  // Expects page to have a heading with the name of the route (e.g., "Documentation" or "Features").
  // Assuming 'Connect Thrive' is the title or a prominent heading on the navigated page.
  await expect(page.getByRole('heading', { name: 'Connect Thrive' })).toBeVisible();
});
