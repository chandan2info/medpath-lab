import { expect, test, type Page } from '@playwright/test';

const DEMO_USERNAME = 'ravi.anand';
const DEMO_PASSWORD = 'MedPath@2024';

async function signIn(page: Page) {
  await page.goto('/lis-home');
  await page.locator('#lp-user').fill(DEMO_USERNAME);
  await page.locator('#lp-pass').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: /sign in to dashboard/i }).click();
  await expect(page).toHaveURL(/\\/dashboard\\/home$/);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
}

test.describe('Public login and access control', () => {
  test('landing page renders the operator login and demo hint', async ({ page }) => {
    await page.goto('/lis-home');
    await expect(page.getByRole('region', { name: 'Operator login' })).toBeVisible();
    await expect(page.getByText('Sign in to access the lab system')).toBeVisible();
    await expect(page.locator('#lp-user')).toBeVisible();
    await expect(page.locator('#lp-pass')).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: /sign in to dashboard/i })).toBeVisible();
    await expect(page.getByText('ravi.anand', { exact: true })).toBeVisible();
  });

  test('required username and password validation is shown', async ({ page }) => {
    await page.goto('/lis-home');
    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
    await expect(page.getByText('Please enter your username')).toBeVisible();
    await expect(page.getByText('Please enter your password')).toBeVisible();
    await expect(page).toHaveURL(/\\/lis-home$/);
  });

  test('invalid credentials show an accessible error and do not sign in', async ({ page }) => {
    await page.goto('/lis-home');
    await page.locator('#lp-user').fill('wrong.user');
    await page.locator('#lp-pass').fill('not-the-password');
    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Invalid username or password.' })).toBeVisible();
    await expect(page).toHaveURL(/\\/lis-home$/);
  });

  test('password visibility toggle changes the input type', async ({ page }) => {
    await page.goto('/lis-home');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(page.locator('#lp-pass')).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(page.locator('#lp-pass')).toHaveAttribute('type', 'password');
  });

  test('forgot password explains the supported reset process', async ({ page }) => {
    await page.goto('/lis-home');
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page.getByRole('status')).toContainText('contact your lab administrator');
  });

  test('valid demo credentials open the authenticated dashboard', async ({ page }) => {
    await signIn(page);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('protected dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard/registration');
    await expect(page).toHaveURL(/\\/lis-home$/);
    await expect(page.getByRole('region', { name: 'Operator login' })).toBeVisible();
  });

  test('remember me persists the username after reload', async ({ page }) => {
    await page.goto('/lis-home');
    await page.locator('#lp-user').fill(DEMO_USERNAME);
    await page.locator('#lp-pass').fill(DEMO_PASSWORD);
    await page.getByLabel('Remember me').check();
    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
    await expect(page).toHaveURL(/\\/dashboard\\/home$/);
    await page.evaluate(() => localStorage.removeItem('medpath.lis.session'));
    await page.goto('/lis-home');
    await expect(page.locator('#lp-user')).toHaveValue(DEMO_USERNAME);
    await expect(page.getByLabel('Remember me')).toBeChecked();
  });
});

test.describe('Authenticated route smoke tests', () => {
  test.beforeEach(async ({ page }) => signIn(page));

  const routes = [
    { path: '/dashboard/home', heading: /dashboard|overview|welcome|today/i },
    { path: '/dashboard/registration', heading: /patient registration/i },
    { path: '/dashboard/test-order', heading: /test order/i },
    { path: '/dashboard/review-order', heading: /review order/i },
    { path: '/dashboard/billing', heading: /billing/i },
    { path: '/dashboard/collection', heading: /sample collection/i },
    { path: '/dashboard/tracking', heading: /sample tracking/i },
    { path: '/dashboard/results', heading: /result entry/i },
    { path: '/dashboard/reports', heading: /reports/i },
    { path: '/dashboard/report-preview', heading: /report preview/i },
    { path: '/dashboard/history', heading: /patient history/i },
    { path: '/dashboard/analytics', heading: /analytics/i },
    { path: '/dashboard/settings', heading: /settings/i },
  ];

  for (const route of routes) {
    test(`renders ${route.path} with its page heading and no uncaught exception`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(route.heading);
      expect(pageErrors).toEqual([]);
    });
  }
});

test.describe('End-to-end LIS workflow', () => {
  test('registers a patient, orders tests, bills, collects a sample, enters results and previews a report', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await signIn(page);

    // 1. Patient registration — search first, then explicitly start a new profile.
    await page.goto('/dashboard/registration');
    await page.locator('#patientSearch').fill('QA E2E Patient 84721');
    await expect(page.getByText('No patient found')).toBeVisible();
    await page.getByRole('button', { name: 'Register New Patient' }).click();

    await page.locator('#firstName').fill('QA');
    await page.locator('#lastName').fill('E2E Patient');
    await page.locator('#mobile').fill('9876543217');
    await page.getByRole('button', { name: 'Male', exact: true }).click();

    // Choose a valid DOB through the themed calendar, not by bypassing the UI.
    await page.locator('#dob').click();
    const dobDialog = page.getByRole('dialog', { name: 'Choose date of birth' });
    await expect(dobDialog).toBeVisible();
    await dobDialog.locator('.dob-month-label').click();
    await dobDialog.getByRole('button', { name: '2025', exact: true }).click();
    const dobDay = dobDialog.locator('.dob-day:not(:disabled)').filter({ hasText: /^15$/ }).first();
    await dobDay.click();
    await expect(page.locator('#dob')).not.toContainText('Select date of birth');

    await page.getByRole('button', { name: /Continue to Clinical/i }).click();
    await expect(page.locator('.reg-card').filter({ hasText: 'Clinical Information' })).toBeVisible();
    await page.getByRole('button', { name: /Save & Continue/i }).click();
    const registeredDialog = page.getByRole('dialog', { name: /Patient Registered Successfully/i });
    await expect(registeredDialog).toBeVisible();
    await registeredDialog.getByRole('button', { name: /Open Test Order now/i }).click();

    // 2. Test order — select two real catalogue investigations.
    await expect(page.getByRole('heading', { level: 1, name: 'Test Order' })).toBeVisible();
    await page.locator('.test-row').filter({ hasText: 'CBC — Complete blood count' }).click();
    await page.locator('.test-row').filter({ hasText: 'Kidney function test' }).click();
    await expect(page.locator('.selection-count')).toContainText('2 tests selected');
    await page.getByRole('button', { name: /Review Order/i }).click();

    // 3. Review and billing.
    await expect(page.getByRole('heading', { level: 1, name: 'Review Order' })).toBeVisible();
    await page.getByRole('button', { name: /Save Order & Continue to Billing/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Billing' })).toBeVisible();
    await expect(page.locator('[aria-label="Ordered tests"]')).toContainText('CBC');
    await page.getByRole('button', { name: /Confirm & Print Receipt/i }).click();
    const receipt = page.getByRole('dialog', { name: 'Payment Received' });
    await expect(receipt).toBeVisible();
    await receipt.getByRole('button', { name: /Proceed to Sample Collection/i }).click();

    // 4. Sample collection — exercise both Cancel (discard draft) and Apply (commit draft).
    await expect(page.getByRole('heading', { level: 1, name: 'Sample Collection' })).toBeVisible();
    const dateTimeTrigger = page.locator('#collection-date-time');
    const originalDateTime = (await dateTimeTrigger.innerText()).trim();

    await dateTimeTrigger.click();
    let dateDialog = page.getByRole('dialog', { name: 'Choose collection date and time' });
    await expect(dateDialog).toBeVisible();
    await dateDialog.getByRole('button', { name: 'Previous month' }).click();
    await dateDialog.locator('.collection-calendar__days button').filter({ hasText: /^1$/ }).click();
    await dateDialog.getByLabel('Hour').selectOption('10');
    await dateDialog.getByLabel('Minute').selectOption('15');
    await dateDialog.getByRole('button', { name: 'AM', exact: true }).click();
    await dateDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dateTimeTrigger).toHaveText(originalDateTime);

    await dateTimeTrigger.click();
    dateDialog = page.getByRole('dialog', { name: 'Choose collection date and time' });
    await dateDialog.getByRole('button', { name: 'Previous month' }).click();
    await dateDialog.locator('.collection-calendar__days button').filter({ hasText: /^1$/ }).click();
    const selectedDateLabel = (await dateDialog.locator('.collection-datetime-popover__selected-date strong').innerText()).trim();
    await dateDialog.getByLabel('Hour').selectOption('10');
    await dateDialog.getByLabel('Minute').selectOption('15');
    await dateDialog.getByRole('button', { name: 'AM', exact: true }).click();
    await dateDialog.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(dateDialog).toBeHidden();
    await expect(dateTimeTrigger).toContainText(selectedDateLabel.split(', ').slice(1).join(', '));
    await expect(dateTimeTrigger).toContainText('10:15 AM');

    await page.locator('#collection-collector').fill('QA E2E Collector');
    await page.getByRole('button', { name: /Mark as Collected/i }).click();
    await expect(page.getByRole('status')).toContainText('Sample Collected');
    await page.getByRole('link', { name: /Proceed to Result Entry/i }).click();

    // 5. Result entry and report preview.
    await expect(page.getByRole('heading', { level: 1, name: 'Result Entry' })).toBeVisible();
    const creatinine = page.getByRole('spinbutton', { name: 'Serum creatinine result' });
    await creatinine.fill('1.1');
    await expect(creatinine).toHaveValue('1.1');
    await page.getByRole('button', { name: /Finalise & generate report/i }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Report Preview' })).toBeVisible();
    await expect(page.locator('#rpt-sheet-preview')).toBeVisible();
    await expect(page.locator('#rpt-sheet-preview')).toContainText('LABORATORY REPORT');
    await expect(page.locator('#rpt-sheet-preview')).toContainText('1.1');
    expect(pageErrors).toEqual([]);
  });
});

test.describe('Application stability', () => {
  test('landing page has no uncaught JavaScript exceptions', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto('/lis-home');
    await expect(page.getByRole('region', { name: 'Operator login' })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('theme toggle updates its accessible state', async ({ page }) => {
    await page.goto('/lis-home');
    const toggle = page.getByRole('button', { name: /switch to (light|dark) mode/i });
    const before = await toggle.getAttribute('aria-pressed');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
  });
});
