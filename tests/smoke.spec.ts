import { test, expect } from '@playwright/test';

test.describe('NOC Dashboard Smoke Tests', () => {

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/IBM watsonx/i);
    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')).toBeVisible({ timeout: 10000 });
  });

  test('landing page loads and shows hero content', async ({ page }) => {
    await page.goto('/');
    // Landing page should show the hero section with main title
    await expect(page.getByRole('heading', { name: /IBM watsonx Alerts/i })).toBeVisible({ timeout: 10000 });
    // Should have CTA links/buttons (they might be links styled as buttons)
    await expect(page.getByText(/Open Dashboard/i)).toBeVisible();
    await expect(page.getByText(/View Alerts/i)).toBeVisible();
  });

  test('alerts page redirects when not authenticated', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForURL(/\/(login|auth)/);
  });

  test('devices page redirects when not authenticated', async ({ page }) => {
    await page.goto('/devices');
    await page.waitForURL(/\/(login|auth)/);
  });

  test('tickets page redirects when not authenticated', async ({ page }) => {
    await page.goto('/tickets');
    await page.waitForURL(/\/(login|auth)/);
  });

  test('login page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForTimeout(2000);

    // Filter out expected errors (like API connection issues in dev)
    const criticalErrors = errors.filter(e =>
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('CORS')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('login form accepts input', async ({ page }) => {
    await page.goto('/login');

    // Find and fill email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    // Find and fill password input
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('login page has IBM Carbon styling', async ({ page }) => {
    await page.goto('/login');

    // Check for Carbon design tokens (CSS custom properties)
    const hasCarbonStyling = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--cds-background') !== '' ||
             document.querySelector('[class*="cds"]') !== null;
    });

    expect(hasCarbonStyling).toBeTruthy();
  });
});
