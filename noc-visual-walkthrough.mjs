import { chromium, firefox } from '@playwright/test';

const BASE = 'http://localhost:3002';
const SLOW = 15000; // ms between actions - 15 seconds per page to read everything

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function launchBrowser() {
  // Try Chromium first with --no-sandbox for Linux, fallback to Firefox
  try {
    console.log('Trying Chromium...');
    return await chromium.launch({
      headless: false,
      slowMo: 200,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });
  } catch (e) {
    console.log('Chromium failed:', e.message);
    console.log('Trying Firefox...');
    return await firefox.launch({ headless: false, slowMo: 400 });
  }
}

async function waitForData(page, description) {
  // Wait for the alerts API to actually respond with data
  console.log(`   Waiting for data to load (${description})...`);
  await sleep(2000);
  // Check if API calls have returned data
  const alertCount = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return rows.length;
  }).catch(() => 0);
  console.log(`   Found ${alertCount} rows in table`);
  return alertCount;
}

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('\n=== 1. LANDING PAGE ===');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(SLOW);

  console.log('=== 2. LOGIN PAGE ===');
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(SLOW);

  console.log('=== 3. LOGGING IN ===');
  await page.fill('#email', 'gameguru306@gmail.com');
  await sleep(500);
  await page.fill('#password', 'Test@12345');
  await sleep(500);
  await page.click('button.auth-submit-btn');
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  console.log('   Waiting for dashboard to fully load...');

  // Wait for the alerts API response and data to render
  await page.waitForSelector('.dashboard-page', { timeout: 15000 }).catch(() => {});
  await sleep(5000); // Give time for all API calls to complete and render
  console.log('   Logged in successfully!');

  console.log('=== 4. DASHBOARD - Checking KPI Cards ===');
  // Read KPI values
  const kpiValues = await page.evaluate(() => {
    const cards = document.querySelectorAll('.kpi-card, .stat-card, [class*="kpi"]');
    return Array.from(cards).map(c => c.textContent?.trim().substring(0, 60));
  }).catch(() => []);
  console.log('   KPI Cards:', kpiValues.length > 0 ? kpiValues : 'None found');
  await sleep(SLOW);

  console.log('=== 5. DASHBOARD - Checking charts ===');
  const chartsRow = await page.$('.charts-row');
  if (chartsRow) {
    await chartsRow.scrollIntoViewIfNeeded();
    console.log('   Charts section found and scrolled to');
  } else {
    console.log('   No charts-row found');
  }
  await sleep(SLOW * 2);

  console.log('=== 6. DASHBOARD - Checking alerts table ===');
  const table = await page.$('table');
  if (table) {
    await table.scrollIntoViewIfNeeded();
    const rowCount = await waitForData(page, 'alerts table');
    if (rowCount === 0) {
      console.log('   WARNING: Table has 0 rows - API may be returning empty data');
      // Check if we can see error text
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('   Page content preview:', bodyText.substring(0, 200));
    }
  } else {
    console.log('   No table found');
  }
  await sleep(SLOW * 2);

  console.log('=== 7. CLICKING FIRST ALERT - View Detail ===');
  const firstRow = page.locator('table tbody tr').first();
  if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    const viewBtn = firstRow.locator('td').last().locator('button').first();
    if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForURL('**/alerts/**', { timeout: 15000 });
      console.log('   Alert detail page: ' + page.url());
      await sleep(SLOW * 2);

      console.log('=== 8. ALERT DETAIL - Scrolling through content ===');
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
        await sleep(SLOW);
      }
    } else {
      console.log('   View button not found in first row');
    }
  } else {
    console.log('   No table rows visible - skipping alert detail');
  }

  console.log('=== 9. NAVIGATING TO PRIORITY ALERTS ===');
  const priorityLink = page.locator('nav a[href="/priority-alerts"]');
  if (await priorityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await priorityLink.click();
    await page.waitForURL('**/priority-alerts**', { timeout: 10000 }).catch(() => {});
    await sleep(SLOW * 2);
  } else {
    console.log('   Priority alerts nav link not found, navigating directly');
    await page.goto(BASE + '/priority-alerts', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(SLOW * 2);
  }

  console.log('=== 10. NAVIGATING TO TICKETS ===');
  const ticketsLink = page.locator('nav a[href="/tickets"]');
  if (await ticketsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ticketsLink.click();
    await page.waitForURL('**/tickets**', { timeout: 10000 }).catch(() => {});
    await sleep(SLOW * 2);
  } else {
    await page.goto(BASE + '/tickets', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(SLOW * 2);
  }

  console.log('=== 11. NAVIGATING TO CONFIGURATION ===');
  const configLink = page.locator('nav a[href="/configuration"]');
  if (await configLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await configLink.click();
    await sleep(SLOW * 2);
  } else {
    await page.goto(BASE + '/configuration', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(SLOW * 2);
  }

  console.log('=== 12. NAVIGATING TO SETTINGS ===');
  const settingsLink = page.locator('nav a[href="/settings"]');
  if (await settingsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await settingsLink.click();
    await sleep(SLOW * 2);
  } else {
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(SLOW * 2);
  }

  console.log('=== 13. BACK TO DASHBOARD ===');
  const dashLink = page.locator('nav a[href="/dashboard"]');
  if (await dashLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dashLink.click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  } else {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }
  await sleep(SLOW);

  // Final check - are KPIs showing real data?
  console.log('\n=== FINAL DATA CHECK ===');
  const finalCheck = await page.evaluate(() => {
    const body = document.body.innerText;
    const has0Active = body.includes('0Active Alerts') || body.includes('0\nActive Alerts');
    const tableRows = document.querySelectorAll('table tbody tr').length;
    return { has0Active, tableRows, snippet: body.substring(0, 300) };
  }).catch(() => ({ has0Active: true, tableRows: 0, snippet: 'Error reading page' }));

  console.log('   Table rows:', finalCheck.tableRows);
  console.log('   Shows 0 Active Alerts:', finalCheck.has0Active);
  if (finalCheck.has0Active) {
    console.log('   WARNING: Dashboard still showing 0 data!');
  } else {
    console.log('   SUCCESS: Dashboard showing real data!');
  }

  console.log('\n=== WALKTHROUGH COMPLETE ===');
  console.log('Browser staying open for 5 minutes. Press Ctrl+C to exit.\n');

  // Keep browser open for 5 minutes for manual inspection
  await sleep(300000);
  await browser.close();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
