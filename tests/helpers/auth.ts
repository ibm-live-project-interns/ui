import { Page } from '@playwright/test';

/**
 * Login helper — logs in and navigates to dashboard.
 * Reusable across all test files.
 */
export async function login(page: Page, email = 'admin@admin.com', password = 'admin123') {
    // Retry login up to 3 times in case backend is slow to respond
    for (let attempt = 0; attempt < 3; attempt++) {
        await page.goto('/login');
        await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(password);
        await page.click('button[type="submit"]');
        try {
            await page.waitForURL('**/dashboard', { timeout: 15000 });
            return; // success
        } catch {
            if (attempt === 2) throw new Error('Login failed after 3 attempts — is the backend running?');
            await page.waitForTimeout(2000); // wait before retry
        }
    }
}

/**
 * Helper to click the primary button inside an open modal's footer.
 * Avoids strict-mode violations from duplicate button labels.
 */
export async function clickModalPrimary(page: Page) {
    await page.click('.cds--modal.is-visible .cds--modal-footer .cds--btn--primary');
}

/**
 * Helper to click the secondary (Cancel) button inside an open modal's footer.
 */
export async function clickModalSecondary(page: Page) {
    await page.click('.cds--modal.is-visible .cds--modal-footer .cds--btn--secondary');
}

/**
 * Returns the visible modal locator.
 */
export function visibleModal(page: Page) {
    return page.locator('.cds--modal.is-visible');
}
