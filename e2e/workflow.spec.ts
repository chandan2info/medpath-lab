import { expect, test } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/dashboard/registration');
  await expect(page).toHaveURL(/lis-home/);
  await page.locator('#lp-user').fill('ravi.anand');
  await page.locator('#lp-pass').fill('MedPath@2024');
  await page.getByLabel('Remember me').check();
  await page.getByRole('button', { name: /Sign in to dashboard/ }).click();
  await expect(page).toHaveURL(/dashboard\/home/);
}

test('synthetic patient lifecycle flows from registration through history and reports', async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page);
  await page.goto('/dashboard/registration');

  const marker = `E2E${Date.now()}`;
  const firstName = 'Synthetic';
  const lastName = marker;
  await page.locator('#patientSearch').fill(marker);
  await page.getByRole('button', { name: 'Register New Patient' }).click();
  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.locator('#dob').click();
  const now = new Date();
  const isoToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  await page.locator(`[data-day-iso="${isoToday}"]`).click();
  await page.getByRole('button', { name: 'Male', exact: true }).click();
  await page.locator('#mobile').fill(String(6000000000 + (Date.now() % 999999999)).slice(0, 10));
  await page.getByRole('button', { name: /Continue to Clinical/ }).click();
  await expect(page.getByRole('heading', { name: 'Clinical Information' })).toBeVisible();
  await page.getByRole('button', { name: /Save & Continue/ }).click();
  await expect(page).toHaveURL(/dashboard\/test-order/);

  await expect(page.getByRole('heading', { name: 'Test Order' })).toBeVisible();
  await page.getByRole('button', { name: /CBC — Complete blood count/ }).click();
  await page.getByRole('button', { name: /Review Order/ }).click();
  await expect(page.getByRole('heading', { name: 'Review Order' })).toBeVisible();
  await page.getByRole('button', { name: /Save Order & Continue to Billing/ }).click();
  await expect(page).toHaveURL(/dashboard\/billing\/new/);
  await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Confirm & Print Receipt/ }).click();
  await expect(page.getByRole('heading', { name: /Payment Recorded|Invoice Created/ })).toBeVisible();
  await page.getByRole('button', { name: /Open Sample Collection/ }).click();
  await expect(page).toHaveURL(/dashboard\/collection/);
  await expect(page.getByRole('heading', { name: 'Sample Collection' })).toBeVisible();
  await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();

  for (const item of await page.locator('.checklist-item').all()) await item.click();
  await page.getByRole('button', { name: /Mark as Collected/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sample Collected' })).toBeVisible();

  await page.goto('/dashboard/tracking');
  await page.getByRole('textbox', { name: 'Search samples' }).fill(marker);
  await page.getByRole('row').filter({ hasText: marker }).click();
  await page.getByRole('textbox', { name: 'Search samples' }).fill('No matching synthetic patient');
  await expect(page.getByRole('row').filter({ hasText: 'No samples match' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive sample' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search samples' }).fill(marker);
  await expect(page.locator('.det-name')).toContainText(`${firstName} ${lastName}`);
  await page.getByRole('button', { name: 'Receive sample' }).click();
  await page.getByRole('button', { name: 'Start processing' }).click();
  await page.getByRole('button', { name: 'Mark ready for result entry' }).click();
  await page.getByRole('link', { name: 'Enter results' }).click();
  await expect(page.getByRole('heading', { name: 'Result Entry' })).toBeVisible();
  for (const input of await page.locator('.result-input:not([readonly])').all()) await input.fill('70');
  await page.getByRole('button', { name: 'Submit for Validation' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Results submitted for validation' })).toBeVisible();

  await page.goto('/dashboard/validation');
  await page.getByRole('searchbox', { name: 'Search validation queue' }).fill(marker);
  await page.getByRole('button', { name: /Review/ }).click();
  await page.getByRole('button', { name: 'Approve results' }).click();
  await expect(page.getByRole('status').filter({ hasText: /approved|validated/i })).toBeVisible();
  await page.getByRole('tab', { name: /Validated/ }).click();
  await page.getByRole('button', { name: 'Generate report' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Report RPT-.* generated successfully/ })).toBeVisible();

  await page.goto('/dashboard/history');
  await page.locator('input[placeholder^="Search patient, mobile"]').fill(marker);
  await expect(page.getByText(new RegExp(marker)).first()).toBeVisible();

  await page.goto('/dashboard/reports');
  const reportSearch = page.getByRole('searchbox', { name: 'Search reports' });
  const demoReportIds = [
    'RPT-2406-041', 'RPT-2406-040', 'RPT-2406-039', 'RPT-2406-038',
    'RPT-2406-037', 'RPT-2406-033', 'RPT-2406-030',
  ];
  await expect(page.locator('.lis-badge--danger')).toHaveText('8 reports');
  for (const demoId of demoReportIds) {
    await reportSearch.fill(demoId);
    await expect(page.locator('.report-row')).toHaveCount(1);
    await expect(page.locator('.rr-identifiers')).toContainText(demoId);
  }
  await reportSearch.fill(marker);
  const reportRow = page.getByRole('button').filter({ hasText: marker });
  await expect(reportRow).toBeVisible();
  await expect(reportRow.getByText('Generated')).toBeVisible();
  await reportRow.click();
  const reportIdentity = await reportRow.locator('.rr-identifiers').textContent();
  const reportId = reportIdentity?.match(/RPT-[\w-]+/)?.[0];
  expect(reportId).toBeTruthy();
  const resultRow = page.locator('.rpt-tbl tbody tr').first();
  await expect(resultRow.locator('td').nth(0)).toContainText('Haemoglobin');
  await expect(resultRow.locator('td').nth(1)).toHaveText('70');
  await expect(resultRow.locator('td').nth(2)).toHaveText('g/dL');
  await expect(resultRow.locator('td').nth(3)).toHaveText('Age-specific interval not configured');
  await expect(resultRow.locator('td').nth(4)).toHaveText('Unavailable');
  await page.getByRole('button', { name: 'Mark dispatched' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Mark as dispatched' }).click();
  await expect(reportRow.getByText('Dispatched')).toBeVisible();

  await page.reload();
  await reportSearch.fill(marker);
  await expect(page.locator('.report-row')).toHaveCount(1);
  await expect(page.locator('.rr-identifiers')).toContainText(reportId!);
  await expect(page.locator('.report-row').getByText('Dispatched')).toBeVisible();

  await page.goto('/dashboard/history');
  await page.locator('input[placeholder^="Search patient, mobile"]').fill(marker);
  const patientRow = page.getByRole('row').filter({ hasText: marker });
  await patientRow.getByRole('button', { name: 'View patient' }).click();
  await page.getByRole('tab', { name: 'Reports' }).click();
  await expect(page.getByText(`Report ID: ${reportId}`)).toBeVisible();
  await expect(page.getByText('Dispatched', { exact: true }).last()).toBeVisible();
});

test('protected workflow redirects unauthenticated users to sign in', async ({ page }) => {
  await page.goto('/dashboard/results');
  await expect(page).toHaveURL(/lis-home/);
  await expect(page.getByRole('region', { name: 'Operator login' })).toBeVisible();
});
