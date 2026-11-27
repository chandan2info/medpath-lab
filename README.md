# MedPath LIS

## Browser regression tests (Playwright)

The application uses Angular CLI 17. Playwright runs the application in Chromium and starts the Angular dev server automatically.

### Setup

```bash
npm install
npx playwright install chromium
```

### Run

```bash
npm run e2e          # headless Chromium regression suite
npm run e2e:headed   # run with a visible browser
npm run e2e:ui       # Playwright UI mode
npm run e2e:report   # open the latest HTML report
```

The default configuration starts `npm start -- --host 127.0.0.1` on port 4200. To target another running instance, set `PLAYWRIGHT_BASE_URL` and update the `webServer` setting in `playwright.config.ts` to disable server startup.

### Coverage

- Public landing/login page, required-field validation, invalid credentials, password visibility, forgot-password guidance and remembered username.
- Authentication guard behavior and successful demo login.
- Authenticated route smoke coverage for dashboard, registration, test ordering, review, billing, collection, tracking, results, reports, report preview, history, analytics and settings.
- Uncaught browser exceptions and theme-toggle accessibility state.

The current authentication implementation is a local demo session. Tests use the repository's demo credentials and do not represent production authentication or backend integration tests.

### Test artifacts

Playwright writes HTML reports to `playwright-report/` and traces, screenshots and videos for failed tests to `test-results/`.
