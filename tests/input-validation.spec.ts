import { test, expect } from '@playwright/test';
import { login, clickModalSecondary, visibleModal } from './helpers/auth';

/**
 * Input Validation Tests
 *
 * Verifies that all modals across the app use proper structured inputs
 * and have required-field validation to prevent human error.
 */

test.describe('Structured Inputs — No Free-Text Where Dropdowns Needed', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('threshold rule condition uses metric + operator + value (not free text)', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("New Rule")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Should NOT have a free-text condition input
        await expect(modal.locator('input[placeholder*="CPU > 90"]')).not.toBeVisible();

        // Should have structured inputs
        const metricSelect = modal.locator('#new-cond-metric');
        await expect(metricSelect).toBeVisible();
        const tagName = await metricSelect.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('select');

        // Verify metric options include standard NOC metrics
        const options = await metricSelect.locator('option').allTextContents();
        expect(options).toContain('CPU Utilization');
        expect(options).toContain('Memory Usage');
        expect(options).toContain('Network Latency');

        // Operator should be a select with valid operators
        const opSelect = modal.locator('#new-cond-op');
        const opOptions = await opSelect.locator('option').allTextContents();
        expect(opOptions).toContain('>');
        expect(opOptions).toContain('>=');
        expect(opOptions).toContain('<');

        // Value should be a NumberInput component
        await expect(modal.locator('#new-cond-value')).toBeVisible();

        await clickModalSecondary(page);
    });

    test('threshold rule duration uses number + unit (not free text)', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("New Rule")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Duration value — NumberInput
        await expect(modal.locator('#new-dur-value')).toBeVisible();

        // Duration unit — Select with options
        const unitSelect = modal.locator('#new-dur-unit');
        await expect(unitSelect).toBeVisible();
        const unitOptions = await unitSelect.locator('option').allTextContents();
        expect(unitOptions).toContain('Seconds');
        expect(unitOptions).toContain('Minutes');
        expect(unitOptions).toContain('Hours');

        await clickModalSecondary(page);
    });

    test('maintenance window schedule uses day + hour + minute (not free text)', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("Maintenance Windows")').click();
        await page.waitForTimeout(1000);

        await page.locator('button:has-text("Add Window")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Day dropdown
        const daySelect = modal.locator('#maint-day');
        await expect(daySelect).toBeVisible();
        const dayOptions = await daySelect.locator('option').allTextContents();
        expect(dayOptions).toContain('Sunday');
        expect(dayOptions).toContain('Monday');
        expect(dayOptions.length).toBe(7);

        // Hour and minute number inputs
        await expect(modal.locator('#maint-hour')).toBeVisible();
        await expect(modal.locator('#maint-minute')).toBeVisible();

        // Duration: value + unit
        await expect(modal.locator('#maint-dur-value')).toBeVisible();
        const durUnitSelect = modal.locator('#maint-dur-unit');
        const durOptions = await durUnitSelect.locator('option').allTextContents();
        expect(durOptions).toContain('Minutes');
        expect(durOptions).toContain('Hours');
        expect(durOptions).toContain('Days');

        await clickModalSecondary(page);
    });

    test('notification channel filter uses select (not free text)', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("Notification Channels")').click();
        await page.waitForTimeout(1000);

        await page.locator('.cds--table-toolbar button:has-text("Add Channel")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Filter/meta should be a Select now
        const metaEl = modal.locator('#channel-meta');
        await expect(metaEl).toBeVisible();
        const tagName = await metaEl.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('select');

        const filterOptions = await metaEl.locator('option').allTextContents();
        expect(filterOptions).toContain('All Alerts');
        expect(filterOptions).toContain('Critical Only');

        await clickModalSecondary(page);
    });

    test('ticket assignee uses select dropdown (not free text)', async ({ page }) => {
        await page.goto('/tickets');
        await page.waitForSelector('table', { timeout: 10000 });

        // Use first matching button (header button, not the modal submit)
        await page.locator('button:has-text("Create Ticket")').first().click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        const assigneeEl = modal.locator('#create-ticket-assignee');
        await expect(assigneeEl).toBeVisible();
        const tagName = await assigneeEl.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('select');

        // Should have team members as options
        const options = await assigneeEl.locator('option').allTextContents();
        expect(options).toContain('John Smith');
        expect(options).toContain('NOC Team');
        expect(options).toContain('Security Team');

        await clickModalSecondary(page);
    });

    test('ticket edit assignee uses select dropdown', async ({ page }) => {
        // Navigate to a ticket details page
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
        const assigneeEl = modal.locator('#edit-ticket-assignee');
        await expect(assigneeEl).toBeVisible();
        const tagName = await assigneeEl.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('select');

        await clickModalSecondary(page);
    });
});

test.describe('Required Field Validation', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('rule name is required', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("New Rule")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await expect(modal.locator('text=Rule name is required')).toBeVisible();
        await expect(modal.locator('.cds--modal-footer .cds--btn--primary')).toBeDisabled();

        await clickModalSecondary(page);
    });

    test('channel name is required', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("Notification Channels")').click();
        await page.waitForTimeout(1000);

        await page.locator('.cds--table-toolbar button:has-text("Add Channel")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await expect(modal.locator('text=Channel name is required')).toBeVisible();
        await expect(modal.locator('.cds--modal-footer .cds--btn--primary')).toBeDisabled();

        await clickModalSecondary(page);
    });

    test('policy name is required', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("Escalation Policies")').click();
        await page.waitForTimeout(1000);

        await page.locator('button:has-text("New Policy")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await expect(modal.locator('.cds--modal-footer .cds--btn--primary')).toBeDisabled();

        await clickModalSecondary(page);
    });

    test('maintenance window name is required', async ({ page }) => {
        await page.goto('/configuration');
        await page.waitForTimeout(2000);

        await page.locator('button:has-text("Maintenance Windows")').click();
        await page.waitForTimeout(1000);

        await page.locator('button:has-text("Add Window")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await expect(modal.locator('text=Window name is required')).toBeVisible();
        await expect(modal.locator('.cds--modal-footer .cds--btn--primary')).toBeDisabled();

        await clickModalSecondary(page);
    });

    test('ticket title is required', async ({ page }) => {
        await page.goto('/tickets');
        await page.waitForSelector('table', { timeout: 10000 });

        await page.locator('button:has-text("Create Ticket")').first().click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await expect(modal.locator('text=Ticket title is required')).toBeVisible();
        await expect(modal.locator('.cds--modal-footer .cds--btn--primary')).toBeDisabled();

        // Fill title — validation clears and button enables
        await modal.locator('#create-ticket-title').fill('Test');
        await expect(modal.locator('text=Ticket title is required')).not.toBeVisible();
        await expect(modal.locator('.cds--modal-footer .cds--btn--primary')).toBeEnabled();

        await clickModalSecondary(page);
    });
});
