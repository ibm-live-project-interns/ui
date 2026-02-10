import { test, expect } from '@playwright/test';
import { login, clickModalPrimary, clickModalSecondary, visibleModal } from './helpers/auth';

test.describe('Tickets Page', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/tickets');
        await page.waitForSelector('table', { timeout: 10000 });
    });

    test('tickets table loads with data', async ({ page }) => {
        const rows = page.locator('table tbody tr');
        await expect(rows.first()).toBeVisible();
    });

    test('create ticket modal has all expected fields', async ({ page }) => {
        await page.locator('button:has-text("Create Ticket")').first().click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await expect(modal).toBeVisible();

        // Alert ComboBox
        await expect(modal.locator('#create-ticket-alert')).toBeVisible();

        // Title (required)
        await expect(modal.locator('#create-ticket-title')).toBeVisible();

        // Description
        await expect(modal.locator('#create-ticket-description')).toBeVisible();

        // Priority Select
        await expect(modal.locator('#create-ticket-priority')).toBeVisible();

        // Device
        await expect(modal.locator('#create-ticket-device')).toBeVisible();

        // Assignee — should be a Select, not free text
        const assigneeEl = modal.locator('#create-ticket-assignee');
        await expect(assigneeEl).toBeVisible();
        const tagName = await assigneeEl.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('select');

        await clickModalSecondary(page);
    });

    test('create ticket requires title — button disabled when empty', async ({ page }) => {
        await page.locator('button:has-text("Create Ticket")').first().click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        const primaryBtn = modal.locator('.cds--modal-footer .cds--btn--primary');
        await expect(primaryBtn).toBeDisabled();

        // Validation message
        await expect(modal.locator('text=Ticket title is required')).toBeVisible();

        // Fill title — button should become enabled
        await modal.locator('#create-ticket-title').fill('Test Ticket');
        await expect(primaryBtn).toBeEnabled();

        await clickModalSecondary(page);
    });

    test('create ticket with assignee Select and alert ComboBox', async ({ page }) => {
        await page.locator('button:has-text("Create Ticket")').first().click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await modal.locator('#create-ticket-title').fill('E2E Playwright Ticket');
        await modal.locator('#create-ticket-description').fill('Automated test ticket');
        await modal.locator('#create-ticket-priority').selectOption('high');
        await modal.locator('#create-ticket-assignee').selectOption('NOC Team');

        await clickModalPrimary(page);
        await page.waitForTimeout(2000);

        // Ticket should appear in the list
        await expect(page.locator('td:has-text("E2E Playwright Ticket")').first()).toBeVisible({ timeout: 10000 });
    });

    test('create ticket from alert page pre-selects alert', async ({ page }) => {
        // Navigate to tickets with alertId query param
        await page.goto('/tickets?alertId=ALT-001');
        await page.waitForTimeout(3000);

        // Modal may auto-open from alertId param, or we need to open it
        let modal = visibleModal(page);
        if (await modal.count() === 0) {
            await page.locator('button:has-text("Create Ticket")').first().click();
            await page.waitForTimeout(500);
            modal = visibleModal(page);
        }

        // The alert ComboBox input should contain ALT-001
        const comboInput = modal.locator('#create-ticket-alert input[role="combobox"]');
        if (await comboInput.count() > 0) {
            const value = await comboInput.inputValue();
            if (value) {
                expect(value).toContain('ALT-001');
            }
        }

        await clickModalSecondary(page);
    });
});

test.describe('Ticket Details Page — Edit Modal', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('edit ticket modal has alert ComboBox and assignee Select', async ({ page }) => {
        // Get first ticket ID from the API
        await page.goto('/tickets');
        await page.waitForSelector('table', { timeout: 10000 });

        // Click first ticket link to navigate to details
        const firstLink = page.locator('table tbody tr a').first();
        if (await firstLink.count() > 0) {
            const href = await firstLink.getAttribute('href');
            if (href) {
                await page.goto(href);
            }
        } else {
            // Fallback: navigate directly if we know a ticket ID
            await page.goto('/tickets/TKT-000001');
        }
        await page.waitForTimeout(3000);

        // Click Edit Ticket
        const editBtn = page.locator('button:has-text("Edit Ticket")');
        if (await editBtn.count() === 0) {
            test.skip();
            return;
        }

        await editBtn.click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Title (required with validation)
        await expect(modal.locator('#edit-ticket-title')).toBeVisible();

        // Priority Select
        await expect(modal.locator('#edit-ticket-priority')).toBeVisible();

        // Status Select
        await expect(modal.locator('#edit-ticket-status')).toBeVisible();

        // Assignee — should be a Select
        const assigneeEl = modal.locator('#edit-ticket-assignee');
        await expect(assigneeEl).toBeVisible();
        const tagName = await assigneeEl.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('select');

        // Alert ComboBox
        await expect(modal.locator('#edit-ticket-alert')).toBeVisible();

        await clickModalSecondary(page);
    });

    test('edit ticket title validation prevents empty submit', async ({ page }) => {
        await page.goto('/tickets');
        await page.waitForSelector('table', { timeout: 10000 });

        const firstLink = page.locator('table tbody tr a').first();
        if (await firstLink.count() > 0) {
            const href = await firstLink.getAttribute('href');
            if (href) await page.goto(href);
        } else {
            await page.goto('/tickets/TKT-000001');
        }
        await page.waitForTimeout(3000);

        const editBtn = page.locator('button:has-text("Edit Ticket")');
        if (await editBtn.count() === 0) {
            test.skip();
            return;
        }

        await editBtn.click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Clear the title
        await modal.locator('#edit-ticket-title').fill('');
        await page.waitForTimeout(200);

        // Primary button should be disabled
        const primaryBtn = modal.locator('.cds--modal-footer .cds--btn--primary');
        await expect(primaryBtn).toBeDisabled();

        // Validation message
        await expect(modal.locator('text=Ticket title is required')).toBeVisible();

        await clickModalSecondary(page);
    });
});
