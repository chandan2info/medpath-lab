import { expect, test, type Page } from '@playwright/test';

const DEMO_USERNAME = 'ravi.anand';
const DEMO_PASSWORD = 'MedPath@2024';

async function signIn(page: Page) {
  await page.goto('/lis-home');
  await page.locator('#lp-user').fill(DEMO_USERNAME);
  await page.locator('#lp-pass').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: /sign in to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/home$/);
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
    await expect(page).toHaveURL(/\/lis-home$/);
  });

  test('invalid credentials show an accessible error and do not sign in', async ({ page }) => {
    await page.goto('/lis-home');
    await page.locator('#lp-user').fill('wrong.user');
    await page.locator('#lp-pass').fill('not-the-password');
    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Invalid username or password.' })).toBeVisible();
    await expect(page).toHaveURL(/\/lis-home$/);
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
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('protected dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard/registration');
    await expect(page).toHaveURL(/\/lis-home$/);
    await expect(page.getByRole('region', { name: 'Operator login' })).toBeVisible();
  });

  test('remember me persists the username after reload', async ({ page }) => {
    await page.goto('/lis-home');
    await page.locator('#lp-user').fill(DEMO_USERNAME);
    await page.locator('#lp-pass').fill(DEMO_PASSWORD);
    await page.getByLabel('Remember me').check();
    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/home$/);
    await page.evaluate(() => localStorage.removeItem('medpath.lis.session'));
    await page.goto('/lis-home');
    await expect(page.locator('#lp-user')).toHaveValue(DEMO_USERNAME);
    await expect(page.getByLabel('Remember me')).toBeChecked();
  });
});

test.describe('Authenticated application route smoke tests', () => {
  test.beforeEach(async ({ page }) => signIn(page));

  const routes = [
    { path: '/dashboard/home', heading: /dashboard|overview|welcome|today/i },
    { path: '/dashboard/registration', heading: /patient registration/i },
    { path: '/dashboard/test-order', heading: /test order|test selection|select tests/i },
    { path: '/dashboard/review-order', heading: /review order/i },
    { path: '/dashboard/billing', heading: /billing/i },
    { path: '/dashboard/collection', heading: /sample collection/i },
    { path: '/dashboard/tracking', heading: /sample tracking/i },
    { path: '/dashboard/results', heading: /result entry|results/i },
    { path: '/dashboard/reports', heading: /reports/i },
    { path: '/dashboard/report-preview', heading: /report preview|preview/i },
    { path: '/dashboard/history', heading: /patient history|history/i },
    { path: '/dashboard/analytics', heading: /analytics/i },
    { path: '/dashboard/settings', heading: /settings/i },
  ];

  for (const route of routes) {
    test(`renders ${route.path} without a browser exception`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(route.path);
      await expect(page.locator('main#main-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('h1').first()).toContainText(route.heading);
      expect(pageErrors).toEqual([]);
    });
  }
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
