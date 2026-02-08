import { test, expect } from '@playwright/test';
import { login, clickModalPrimary, clickModalSecondary, visibleModal } from './helpers/auth';

const VALID_OPERATORS = ['>', '<', '>=', '<=', '==', '!='];

test.describe('Configuration Page — Threshold Rules', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/configuration');
        await page.waitForTimeout(2000);
    });

    test('rules table loads with data', async ({ page }) => {
        await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
        const rows = page.locator('table tbody tr');
        await expect(rows.first()).toBeVisible();
    });

    test('create rule with structured inputs end-to-end', async ({ page }) => {
        await page.locator('button:has-text("New Rule")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Fill in rule name
        await modal.locator('#new-rule-name').fill('E2E Test Rule');
        await modal.locator('#new-rule-description').fill('Created by Playwright test');

        // Select metric: Memory
        await modal.locator('#new-cond-metric').selectOption('Memory');

        // Select operator: >=
        await modal.locator('#new-cond-op').selectOption('>=');

        // Verify primary button is now enabled
        const primaryBtn = modal.locator('.cds--modal-footer .cds--btn--primary');
        await expect(primaryBtn).toBeEnabled();

        // Submit
        await clickModalPrimary(page);
        await page.waitForTimeout(2000);

        // Verify the rule appears in the table
        await expect(page.locator('span:has-text("E2E Test Rule")').first()).toBeVisible({ timeout: 10000 });
    });

    test('edit rule modal parses existing condition into structured fields', async ({ page }) => {
        // Open overflow menu on first data row (not expanded row)
        const firstOverflow = page.locator('tr:not(.cds--expandable-row--hover) .cds--overflow-menu').first();
        await firstOverflow.click();
        await page.waitForTimeout(300);
        await page.locator('.cds--overflow-menu-options__option:has-text("Edit rule")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);

        // Structured fields should be populated (not empty)
        const metricValue = await modal.locator('#edit-cond-metric').inputValue();
        expect(metricValue).toBeTruthy();

        const opValue = await modal.locator('#edit-cond-op').inputValue();
        expect(VALID_OPERATORS).toContain(opValue);

        await clickModalSecondary(page);
    });

    test('rule toggle works', async ({ page }) => {
        const firstToggle = page.locator('.cds--toggle__switch').first();
        await expect(firstToggle).toBeVisible();
        await firstToggle.click();
        await page.waitForTimeout(500);
    });
});

test.describe('Configuration Page — Notification Channels', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/configuration');
        await page.waitForTimeout(2000);
        await page.locator('button:has-text("Notification Channels")').click();
        await page.waitForTimeout(1000);
    });

    test('channels table loads', async ({ page }) => {
        await expect(page.locator('table')).toBeVisible();
    });

    test('create channel with structured filter', async ({ page }) => {
        await page.locator('.cds--table-toolbar button:has-text("Add Channel")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await modal.locator('#channel-type').selectOption('Email');
        await modal.locator('#channel-name').fill('e2e-test@company.com');
        await modal.locator('#channel-meta').selectOption('Critical Only');

        await clickModalPrimary(page);
        await page.waitForTimeout(2000);

        await expect(page.locator('td:has-text("e2e-test@company.com")').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Configuration Page — Escalation Policies', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/configuration');
        await page.waitForTimeout(2000);
        await page.locator('button:has-text("Escalation Policies")').click();
        await page.waitForTimeout(1000);
    });

    test('policies table loads', async ({ page }) => {
        await expect(page.locator('table')).toBeVisible();
    });

    test('create policy', async ({ page }) => {
        await page.locator('button:has-text("New Policy")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await modal.locator('#policy-name').fill('E2E Test Policy');
        await modal.locator('#policy-description').fill('Test escalation');
        await modal.locator('#policy-steps').selectOption('3');

        await clickModalPrimary(page);
        await page.waitForTimeout(2000);

        await expect(page.locator('td:has-text("E2E Test Policy")').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Configuration Page — Maintenance Windows', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/configuration');
        await page.waitForTimeout(2000);
        await page.locator('button:has-text("Maintenance Windows")').click();
        await page.waitForTimeout(1000);
    });

    test('maintenance table loads', async ({ page }) => {
        await expect(page.locator('table')).toBeVisible();
    });

    test('create window with structured inputs and verify composed output', async ({ page }) => {
        await page.locator('button:has-text("Add Window")').click();
        await page.waitForTimeout(500);

        const modal = visibleModal(page);
        await modal.locator('#maint-name').fill('E2E Test Window');
        await modal.locator('#maint-day').selectOption('Wednesday');
        await modal.locator('#maint-dur-unit').selectOption('hours');

        await clickModalPrimary(page);

        // Wait for modal to close
        await page.waitForSelector('.cds--modal.is-visible', { state: 'hidden', timeout: 10000 });
        await page.waitForTimeout(2000);

        // Verify the window appears
        await expect(page.locator('td:has-text("E2E Test Window")').first()).toBeVisible({ timeout: 10000 });

        // The schedule column should show composed format (e.g. "Every Wednesday 02:00 UTC")
        const row = page.locator('tr:has(td:has-text("E2E Test Window"))').first();
        const scheduleCell = row.locator('td').nth(1);
        const scheduleText = await scheduleCell.textContent();
        expect(scheduleText).toContain('Wednesday');
    });
});
