# MedPath LIS Production Readiness Audit

**Audit date:** 27 November 2026
**Repository:** `medpath-lab`
**Branch:** `fix/lab-workflow-integrity`
**Scope:** Evidence gathered from the local Angular app, its existing tests, and source/configuration review. No merge, push, or PR was performed.

## A. Executive QA Summary

**Decision: NOT READY FOR PRODUCTION.** This checkout is a demo frontend: the lab workflow uses local mock storage, authentication is hardcoded in the browser, no backend/database implementation is present, and the synthetic report flow can show “Normal” when no age-specific interval exists. The production build also fails its configured component-style budgets.

| Measure | Result |
|---|---:|
| Executed test cases | 38 |
| PASS | 34 |
| FAIL | 4 |
| BLOCKED | 0 among executed cases |
| NOT TESTED | Remaining checklist areas listed below |

The count comprises 16 passing unit tests, two browser E2E tests (one pass, one fail), and 20 live UI checks (17 pass, three fail). The E2E lifecycle includes the filter regression check; it passes that check and then fails at the existing unavailable-reference flag assertion. Build and lint are reported separately because they are project checks, not test cases. Production build: FAIL. Development build: PASS. Lint: BLOCKED because no Angular lint target is configured.

## B. Architecture and Baseline

- Angular 17 standalone application with lazy routes under `/dashboard`; dashboard routes use a client-side `authGuard`.
- Existing shared UI includes patient, status, operator, DOB, KPI, and workflow-stepper components. Global theme tokens are in `src/styles.css`; individual page styles are large and often contain direct colors and fallback values.
- There is no Java/Spring Boot, PostgreSQL schema/migration, API server, Docker deployment, or backup/restore implementation in this checkout.
- `HttpClient` is provided, but no application service uses it. Environment files point to `https://api.cryptoflow.dev/v1`; this audit did not verify or contact that host.
- Workflow services explicitly describe themselves as local mock repositories and write to browser `localStorage`.
- Existing test coverage consists of 16 unit tests and two Playwright E2E tests. The project has no configured lint target.
- Production bundle’s initial transfer estimate is 108.41 kB, but the build exits with errors because 20 component styles exceed the configured 4 kB error budget. The largest reported styles include Result Entry (65.93 kB), Sample Collection (62.20 kB), Billing (56.99 kB), and Patient History (47.66 kB). This is a style-maintenance/build-gate issue; the 4 kB limit was not relaxed to hide it.

## C. UI/UX Audit

### Verified live screens

- **Dashboard:** loaded in the running app. It showed mock operational data (61 samples, 5 reports ready, 1 STAT pending); those values could not be reconciled to a database.
- **Public landing page:** category shortcuts scrolled to their sections; “View reports” returned to the operator-login area. “Forgot password?” explicitly said self-service reset is unavailable and directed operators to the lab administrator.
- **Settings:** selecting Pastel Lavender immediately applied the lavender sidebar, blush page surfaces, and pastel cards. Dark mode switched to dark surfaces while retaining Pastel Lavender as the selected palette; switching dark mode off restored the light appearance.
- **Reports:** report list and synthetic report preview rendered. The generated CBC preview showed patient/sample identifiers, results, units, reference text, method, and authorization placeholder.
- **Billing:** two synthetic unpaid invoices at ₹200 each matched the displayed ₹400 outstanding total and ₹0 collected total. Billing page surfaces and active navigation followed the selected pastel palette.

The observed Pastel Lavender rendering matches the requested primary (`#8C75CF`), lavender (`#C4ACDC`), page (`#FCEEF0`), card (`#FFF8F8`), text (`#30264A`, `#81758F`), and border (`#EDE3EF`) tokens. I did not find a theme-color defect in the screens actually inspected, so no color-only CSS change was made. This is not a pixel-level audit of every page/component. Semantic status colors (success, warning, danger) remain distinct for meaning.

### Not tested visually

Patient registration, Test Order, Review Order, Sample Collection, Sample Tracking, Result Entry, Result Validation, Patient History, Analytics, and the standalone report preview were not individually reviewed for all typography, focus, hover, disabled, modal, overflow, and theme states. Responsive sizes 1920×1080, 1440×900, 1366×768, 1280×720, 768×1024, and 390×844 were not executed. Screenshot evidence from the live theme check was observed in-session but not saved as a repository artifact. The E2E failure screenshot is available at `test-results/workflow-synthetic-patient-f8c85-through-history-and-reports-chromium/test-failed-1.png`.

## D. Functional and Clinical QA

The synthetic E2E flow exercised registration, one CBC order, invoice/payment creation, sample collection, tracking transitions, result entry, validation, report generation, and report preview. It reached the report preview with the synthetic patient identity and order associations intact. The latest run also verified that an empty sample filter clears the previous detail/action. It stopped at the known result-safety assertion, so dispatch/history E2E assertions did not run. In a separate live UI session, I submitted but did not approve the synthetic multi-test result, verified it in the validation queue, confirmed it did not appear in Reports while awaiting review, then verified Patient History and the invoice still referenced the same synthetic patient/order.

### Clinical safety and data integrity

- Report/result test values and intervals are explicitly illustrative demo data. The report itself warns users to verify intervals against the laboratory’s validated method and patient-specific ranges. No authoritative clinical data was available to verify.
- The E2E fixture creates a synthetic patient with DOB set to the current date and enters `70` for the CBC parameters. The preview displays “Age-specific interval not configured” for Haemoglobin, but its flag is **Normal**. A missing interval must not silently produce a normal classification. This is a verified FAIL and a clinical business-rule change; it is intentionally not changed without the approval required by the audit instructions.
- The observed report-preview path was reached only after the demo validation action. Authorization enforcement, independent reviewer controls, audit history, concurrent edits, and attempts to release unvalidated reports were not verified against a backend.
- The live Result Validation review displayed 44 submitted values in a read-only list, without their units, reference intervals, or flags alongside them. This limits a reviewer’s ability to check values in context. The synthetic set included conspicuously high KFT demo values; I did not approve them. See D-08.
- A live filter reproduction showed that searching for another patient left the previous patient’s details and action active. The component was changed to synchronously reselect a visible row or clear selection. An E2E regression now verifies that a no-match search hides the stale action and restoring the synthetic filter restores its detail. This non-clinical UI fix was validated through that assertion.
- During the live review-order flow, a fasting requirement appeared as an “Action” alert, but Save & Continue still advanced without a fasting confirmation; the next stage showed fasting as unknown/not recorded. This needs a lab-policy decision before changing workflow rules. See D-07.
- The synthetic UPI payment recorded successfully with an empty transaction ID even though the field appeared after selecting UPI. Whether that identifier is mandatory is a payment-policy question; it is recorded as an observation, not a confirmed defect.
- The E2E flow showed one synthetic patient continuing into sample and report screens under the same unique identifier. It does not establish duplicate-patient safety or identity matching across similar names.
- Billing display arithmetic passed for the two visible unpaid invoices. Discounts, taxes, partial/duplicate payments, refunds, cancellation, payment history, and server-side rounding remain untested.

## E. Performance, Security, and Data Integrity

- Production optimized initial transfer estimate: 108.42 kB. Analytics is lazy-loaded and reported at 122.03 kB estimated transfer. No timed performance, large-data, API latency, memory, or restart tests were run.
- Login exposes demo credentials on the public landing page in the development app. More importantly, the same username/password are hardcoded in `UserSessionService`; the client-side guard and `localStorage` session are not real authentication or authorization.
- Clinical/workflow state is stored locally in browser `localStorage`, without server persistence, encryption, role separation, or a server audit trail in this project. Do not enter real patient data into this build.
- External fonts/icons load from Google Fonts and jsDelivr. Offline operation was not tested and cannot be assumed.
- No backend, database, backup, restore, role-permission service, audit-log service, or server-side report-release control was available for testing.

## F. Defect Register

### D-01 — P0 — Unavailable reference interval can be flagged Normal

- **Module / screen:** Result Entry → Result Validation → Reports
- **Description:** A synthetic infant CBC report displays “Age-specific interval not configured” and the result flag “Normal.” That can falsely reassure a reviewer when the system has no applicable interval.
- **Preconditions:** Use the existing E2E demo flow with a synthetic DOB equal to today, CBC, and value `70`.
- **Reproduction:** Run the synthetic E2E flow; proceed through result submission and the local validation step; open the generated report preview.
- **Expected:** An unavailable interval produces an unavailable/unclassified flag and prevents any implication of normality until an approved interval or review policy is applied.
- **Actual:** Reference column says “Age-specific interval not configured”; flag column says “Normal.”
- **Evidence:** E2E screenshot linked above; failing assertion at `e2e/workflow.spec.ts:104`.
- **Root cause:** `flagFromValue` in `src/app/core/services/result-entry-data.service.ts` falls through to `normal` when it cannot parse numeric bounds. The profile-level unavailable handling is not preserved when a value is edited.
- **Recommended fix:** Confirm the laboratory’s intended policy for unavailable intervals, then preserve an unavailable flag through result edits and report generation. Do not invent a reference interval.
- **Files affected:** `src/app/core/services/result-entry-data.service.ts`, related Result Entry/report code, and `e2e/workflow.spec.ts`.
- **Regression required:** Missing-range values remain unavailable at entry, validation, and report preview; configured numeric ranges still flag as expected.

### D-02 — P0 — Demo-only authentication and local storage are not production access controls

- **Module / screen:** Public sign-in, dashboard guard, all workflows
- **Description:** Browser code contains a fixed operator/password and the session guard is local-only. Workflow and patient-like synthetic data are persisted in `localStorage`.
- **Preconditions:** Open `/lis-home` in the development build.
- **Reproduction:** The page displays demo credential buttons; source inspection confirms the same credentials are accepted in `UserSessionService.login`. Protected-route redirect was tested, but this only verifies the client guard.
- **Expected:** Production authentication, authorization, session handling, and audit logging are enforced by a trusted server.
- **Actual:** Demo client-side login and local mock persistence only.
- **Evidence:** `src/app/core/services/user-session.service.ts`; `src/app/core/services/lab-workflow-mock.service.ts`; landing page demo hint.
- **Root cause:** Authentication/backend are explicitly scaffolding for a future API.
- **Recommended fix:** Integrate the organization’s real identity/session service and server-side role/permission/audit controls before any real data is used.
- **Files affected:** Auth/session, route guard, and mock workflow services plus the missing backend.
- **Regression required:** Unauthenticated and unauthorized requests rejected server-side; actions attributed to authenticated users; no real patient data stored in browser local storage.

### D-03 — P0 — No operational backend/database; configured API URL is unrelated placeholder

- **Module / screen:** All modules
- **Description:** The checkout contains only the Angular frontend and mock workflow services. Environment files name `https://api.cryptoflow.dev/v1`; no application HTTP service consumes it.
- **Reproduction:** Inspect repository and search API clients; workflow UI identifies saved actions as local/mock. No API/database implementation is present.
- **Expected:** Production workflows persist to the approved MedPath API/database and reconcile across users/devices.
- **Actual:** Local-only demo state; API integration cannot be tested.
- **Evidence:** `src/environments/environment.ts`, `src/app/app.config.ts`, mock services under `src/app/core/services/`.
- **Root cause:** Backend integration is not part of this repository state.
- **Recommended fix:** Supply the intended API contract, endpoint, backend/database deployment, and test environment; remove placeholder endpoint before release.
- **Files affected:** Environment configuration, workflow services, and absent backend/database assets.
- **Regression required:** API-backed end-to-end persistence, safe failure/retry, cross-session consistency, and backup/restore verification.

### D-04 — P1 — Production build fails component-style size budgets

- **Module / screen:** Production build
- **Description:** Production `ng build` exits non-zero because 20 component styles exceed the 4 kB error budget; multiple styles are 30–66 kB.
- **Preconditions:** Run `npm run build`.
- **Expected:** Production build completes within an intentional, maintainable style budget.
- **Actual:** `Application bundle generation failed`; initial transfer estimate itself is 108.42 kB, but component CSS budgets fail.
- **Evidence:** Build output; see affected files summarized in Architecture and Baseline.
- **Root cause:** Oversized component styles and a strict 4 kB per-component error budget.
- **Recommended fix:** Reduce duplicate/page-local CSS with targeted shared styles, then retain meaningful budgets. Do not simply raise the limit to suppress the build failure.
- **Files affected:** `angular.json` and component styles listed above.
- **Regression required:** Production build passes while bundle/style budgets continue to catch unexpected growth.

### D-05 — P2 — Lint command is configured without an Angular lint target

- **Module / screen:** CI/developer validation
- **Description:** `npm run lint` fails immediately with “Cannot find lint target.”
- **Reproduction:** Run `npm run lint`.
- **Expected:** Configured static analysis runs and reports findings.
- **Actual:** No lint target is available.
- **Root cause:** `angular.json` has no lint architect target and no lint integration dependency/configuration.
- **Recommended fix:** Decide and configure the project’s supported lint tool/target.
- **Files affected:** `package.json`, `angular.json`, and lint configuration to be added.
- **Regression required:** Lint command runs in local and CI environments.

### D-06 — P0 — Non-numeric numeric result is accepted as complete and normal

- **Module / screen:** Result Entry
- **Description:** A numeric Haemoglobin result field accepted `abc`; the CBC stayed at 22/22 parameters completed and the flag remained Normal.
- **Preconditions:** Use the synthetic audit patient at Result Entry. The UI identifies values as a mock preview.
- **Reproduction:** Replace the numeric Haemoglobin value with `abc`. Observe the completion count and flag. Restore the original synthetic value `13.5` afterward.
- **Expected:** Invalid numeric input is rejected and cannot count as a completed numeric result or be classified Normal.
- **Actual:** Text was accepted and stayed complete/Normal. No validation submission was made with the invalid value.
- **Evidence:** Live Result Entry interaction; result field and row displayed the accepted text with Normal flag. The page was restored to `13.5` before submission.
- **Root cause:** `flagFromValue` returns `normal` for nonnumeric input; completion is based on non-empty text. The input does not enforce numeric data.
- **Recommended fix:** Confirm the lab’s permitted value types by parameter, then enforce them and block invalid values from completion/validation. This changes clinical input/validation behavior and requires approval before implementation.
- **Files affected:** `src/app/core/services/result-entry-data.service.ts`, `src/app/features/result-entry/result-entry.component.html`, and result-entry validation code.
- **Regression required:** Non-numeric strings rejected for numeric parameters; valid decimals, qualitative parameters, and configured ranges retain intended behavior.

### D-07 — P1 — Fasting confirmation action does not block order continuation

- **Module / screen:** Review Order → Billing / Sample Collection
- **Description:** The selected panel raised “Fasting confirmation required” as an Action, but the operator could save and continue with fasting still unknown/not recorded.
- **Preconditions:** Synthetic order with a fasting-required test profile.
- **Reproduction:** Add the wellness profile, open Review Order, observe the fasting Action alert, continue to Billing and Sample Collection without recording confirmation.
- **Expected:** Follow the laboratory’s approved fasting-confirmation policy before collection proceeds.
- **Actual:** Navigation continued; the next screen showed fasting as unknown/not recorded.
- **Evidence:** Live synthetic workflow. No real patient was involved.
- **Root cause:** The alert is informational UI state; `continueToBilling()` checks only that tests exist and the page is not saving.
- **Recommended fix:** Define the approved workflow for unknown, fasted, and non-fasted patients, then enforce it consistently. This changes laboratory workflow policy and needs approval before implementation.
- **Files affected:** `src/app/features/review-order/review-order.component.ts` and downstream collection state.
- **Regression required:** Each approved fasting state either blocks or proceeds with the correct recorded state; no silent unknown state.

### D-08 — P1 — Validation review omits reference context for submitted results

- **Module / screen:** Result Validation review dialog
- **Description:** The read-only review displayed parameter names and entered values, but omitted units, reference intervals, and result flags.
- **Preconditions:** Submit the synthetic multi-test sample for validation.
- **Reproduction:** Open its Review action and inspect the recorded-parameters table.
- **Expected:** A reviewer can compare each value with the applicable unit, patient-specific interval, and flag before approval.
- **Actual:** Only parameter and entered result columns were present. The result values were demo fixtures and were not approved.
- **Evidence:** Live validation review for PAT-2611-0762 / SMP-2611-010 displayed 44 values with only Parameter and Entered result columns.
- **Root cause:** Review dialog template projects only parameter names and values.
- **Recommended fix:** Provide the relevant configured result context in review, while preserving unavailable intervals as unavailable. Do not invent clinical ranges.
- **Files affected:** `src/app/features/result-validation/result-validation.component.html` and its result projection/service.
- **Regression required:** Review shows correct patient, sample, test, value, unit, interval, and flag associations; missing intervals remain explicit.

## G. Persistent Test Register and Fix Summary

| ID | Test | Status | Evidence / notes |
|---|---|---|---|
| UT-01–UT-16 | Existing Angular unit tests | PASS | 16/16 passed in Chrome/Karma. |
| UI-01 | Demo sign-in to dashboard | PASS | Actual browser interaction. |
| UI-02 | Dashboard renders operational summary | PASS | Render observed; totals not reconciled to a database. |
| UI-03 | Settings selects Pastel Lavender | PASS | Live light-mode appearance observed. |
| UI-04 | Dark mode remains separate from palette | PASS | Dark on/off observed with Pastel Lavender retained. |
| UI-05 | Reports preview renders synthetic identities/results/metadata | PASS | Actual report preview observed. Clinical flag correctness is separately failed below. |
| UI-06 | Billing summary matches visible invoice rows | PASS | 2 × ₹200 unpaid; ₹400 outstanding; ₹0 collected. |
| UI-07 | Registration required fields, mobile validation, and age calculation | PASS | Empty form errors, invalid/valid synthetic mobile, DOB-derived age. |
| UI-08 | Multiple test/profile selection, duplicate test de-duplication, and subtotal | PASS | Synthetic order: six distinct tests; subtotal ₹2,130. |
| UI-09 | Fasting Action blocks continuation until confirmed | FAIL | Action alert did not block continuation; fasting remained unknown/not recorded. D-07. |
| UI-10 | Discount, advance, and invoice arithmetic | PASS | 10% of ₹2,130 = ₹213; total ₹1,917; ₹500 received; ₹1,417 due. |
| UI-11 | Sample collection date and checklist gate | PASS | Future dates disabled; Collect enabled only after all five checklist items. |
| UI-12 | Sample collection → received → processing → ready transitions | PASS | Synthetic sample progressed through each state. |
| UI-13 | Sample Tracking selection follows visible filtered rows | PASS | Stale details/action were reproduced and fixed. Added synchronous selection sync and E2E no-match regression; current E2E filter assertion passes. |
| UI-14 | Numeric result field rejects nonnumeric text | FAIL | `abc` accepted as completed/Normal; restored to `13.5` before submission. D-06. |
| UI-15 | Result submit preserves patient/order/sample associations | PASS | Validation queue showed synthetic patient, order, sample, and all six ordered tests. |
| UI-16 | Validation review supplies result context | FAIL | Review table showed 44 names/values without units, intervals, or flags. D-08. |
| UI-17 | Unapproved result is absent from Reports | PASS | Synthetic patient search returned no report while awaiting review; no approval/release was performed. |
| UI-18 | Patient History associates synthetic order and pending status | PASS | Correct patient/order, six tests, pending validation, and invoice total shown. |
| UI-19 | Invoice history reconciles amount and payment | PASS | ₹1,917 total, ₹500 received, ₹1,417 due, Partial, UPI. Empty transaction ID accepted; policy status unresolved. |
| UI-20 | Public landing page shortcuts and password recovery response | PASS | Section controls responded; recovery clearly states self-service reset is unavailable. |
| E2E-01 | Protected workflow redirects unauthenticated user | PASS | Existing Playwright test. |
| E2E-02 | Synthetic lifecycle through report preview | FAIL | Registration/order/billing/collection/tracking/result/validation reached preview; flag was Normal with no configured age interval. Dispatch/history assertions did not run. |
| BLK-01 | Backend API integration and server error handling | BLOCKED | No backend/API implementation or test endpoint in this checkout. |
| BLK-02 | Database reconciliation, persistence, backup/restore | BLOCKED | No PostgreSQL schema/server/test database is present. |
| BLK-03 | Real authentication, role permissions, server audit trail | BLOCKED | Only client-side demo auth exists. |
| BLK-04 | Offline deployment and external dependency behavior | BLOCKED | External font/icon dependencies exist; no isolated offline deployment environment was available. |
| NT-01 | Responsive layout at six requested viewport sizes | NOT TESTED | No viewport sweep executed. |
| NT-02 | Full visual audit across all pages and interactive states | NOT TESTED | Only Dashboard, Settings, Reports, and Billing were visually observed; workflow pages were exercised but not fully styled-audited. |
| NT-03 | Negative patient validation, duplicate detection, similar-name identity | NOT TESTED | E2E used one unique synthetic patient. |
| NT-04 | Multiple tests/profiles, pricing/discounts, edit/cancel, duplicate order prevention | NOT TESTED | E2E exercised one CBC only. |
| NT-05 | Sample rejection, invalid transitions, barcode and full tracking history | NOT TESTED | Only forward collection/receive/process/ready transitions were exercised. |
| NT-06 | Decimal/qualitative/critical result entry, reviewer authorization/history | NOT TESTED | Nonnumeric text was probed on one numeric parameter; other parameter types and authorization history remain untested. |
| NT-07 | PDF download, print dialog, A4/multipage/page breaks, corrected versions | NOT TESTED | No report PDF was downloaded or sent/printed. |
| NT-08 | Partial/duplicate payments, refunds, cancellation, taxes and rounding | NOT TESTED | Only displayed summary arithmetic was checked. |
| NT-09 | Patient-history filters/timeline and dashboard/database reconciliation | NOT TESTED | History was reached in E2E before report checks, but its detailed filters/timeline and DB source were not validated. |
| NT-10 | Performance timings, large data, memory, network/console errors, restart | NOT TESTED | No measured performance/stability run. |
| NT-11 | Upload validation, concurrent edits, DB disconnect, save recovery | NOT TESTED | No backend/error-injection environment. |

### Changes made in this audit

- Updated the existing E2E report assertions in `e2e/workflow.spec.ts` to check the displayed Haemoglobin value, unit, and unavailable age-specific interval. This removed an obsolete “unit is Not available” expectation and exposed the remaining incorrect “Normal” flag.
- Fixed Sample Tracking stale selection: changing search/status filters now reselects within the visible rows or clears the detail panel and actions. Added an E2E check for no-match clearing and restoring the synthetic filter.
- No application business logic was changed because the needed result-classification fix affects clinical behavior and the audit instructions require approval first.
- No theme CSS fix was necessary in the screens verified; no build budget was loosened.

## H. Production Readiness Decision

**NOT READY FOR PRODUCTION.** The production build currently fails; authentication and persistence are demo-only; backend/database integration and audit controls are absent; the synthetic E2E surfaced an unsafe result flag for an unavailable age-specific reference interval; and core production checks remain untested or blocked. The current frontend is suitable only for clearly labeled synthetic-data demonstrations until these defects and blockers are resolved and revalidated.

## Validation Commands

- `npm run build -- --configuration development` — PASS.
- `npm test -- --watch=false` — PASS, 16 tests.
- `npm run build` — FAIL, component-style budgets.

## Development QA continuation — 27 Nov 2026

This addendum records the next audit pass from the running localhost app and subsequent UI-only fixes. It does not replace the earlier production-readiness findings. The user requested a development-phase review, so mock data and UI behavior were used; clinical values were not interpreted as medically authoritative. API/backend findings are deferred and were not changed.

### Phase 1 — Screen inventory

Source route inventory and live navigation show these screens: public LIS landing/login; Dashboard; Patient Registration; Test Order; Review Order; New Invoice and Billing Overview; Sample Collection; Sample Tracking; Result Entry queue and sample-specific entry; Result Validation; Reports and report preview; Patient History; Analytics; Settings. The shell includes a responsive sidebar, global search, theme control, alerts button, new-patient shortcut, and account menu. Shared UI includes patient/status/user chips, DOB picker, KPI cards, workflow stepper, tables, filters, popovers, and dialogs. Data is supplied by client-side mock/local-storage services; there is no backend/API in this checkout.

### Phase 2 — Visual pass

The live app was visually inspected at desktop widths across Dashboard, Registration, Test Order, Review Order, both billing screens, Sample Collection, Sample Tracking, both result screens, Validation, Reports/report preview, History, Analytics, Settings, and the public landing page. Representative responsive checks were performed at 1920×1080, 1440×900, 1366×768, 1280×720, 768×1024, and 390×844. This was not an exhaustive every-page-by-every-viewport matrix.

The pastel lavender palette and light/dark separation appeared consistent in inspected pages; no further theme-token violation was confirmed. Responsive sidebar drawer behavior and report action wrapping worked in the observed mobile states. Two visual defects were observed:

| ID | Module / screen | Category | Severity | Scenario / expected / actual | Status / evidence |
|---|---|---|---|---|---|
| V-01 | Sample Collection, 390×844 lifecycle stepper | UI | Low | At mobile width, long step labels break mid-word (e.g. “Registered”, “Collection”), making the progress sequence harder to scan. Expected labels remain readable or wrap at word boundaries. | Fixed in `workflow-stepper.component.css` with word-boundary wrapping and a compact mobile label size. Source reviewed; final build pending. |
| V-02 | Sample Tracking detail panel | UI | Low | For the newly collected synthetic sample, the Collected field rendered a raw ISO timestamp (`2026-11-27T06:32:00.000Z`) and wrapped it across lines. Expected a readable local date/time consistent with other sample rows. | Fixed in template/component with localized date/time formatting. Live app displayed `27 Nov 2026, 12:02 pm` for the synthetic sample. |

### Phase 3 — Component interaction findings (partial)

| ID | Module / screen | Category | Severity | Scenario / expected / actual | Status / evidence |
|---|---|---|---|---|---|
| CMP-01 | Global topbar alerts | Functional | Medium | Click “Alerts (4 unread)”. Expected an alert list or destination. Actual: no visible or accessibility-tree change. Source template has no click handler. | Fixed. Live click displayed four local mock alerts in a closeable menu with navigation actions. |
| CMP-02 | Sample Collection barcode card | Functional | Medium | Click Preview for a tube. Expected a label preview. Actual: no visible response. The button has no handler. | Fixed. Live click opened a preview showing specimen, ordered tests, synthetic barcode, and patient identity; close control worked. No label was printed or record changed. |
| CMP-03 | Sample Collection date/time popover | UI / Validation | Medium, needs retest | On opening the time controls, the UI showed hour/minute selections that appeared inconsistent with the displayed collection time (display: 12:31 PM; selection appeared 01:00 PM). The picker was canceled without applying, so collection data was not changed. | Fixed and retested. Live draft selection showed 12:59 PM with Hour 12 and Minute 59; canceled without applying. `ngModel` now keeps the native select state synchronized with the time signals. |
| CMP-04 | Global search | Functional | Medium | Entered a synthetic sample ID in the topbar search and pressed Enter/⌘K; no suggestions, result list, or navigation appeared. Template only binds the field to a local signal. | Fixed for local mock data. Live tested sample search routed to the exact sample; test search filtered the catalogue; patient search opened Registration with the matching patient. Keyboard Enter and Cmd/Ctrl+K were exercised. |
| CMP-05 | Sample Collection checklist | Functional | PASS | Toggled Patient identity verified and saw the count update 0/5 → 1/5; unchecked it to restore 0/5. The collection action remained disabled while prerequisites were incomplete. | PASS for this control only; live app. |
| CMP-06 | Account menu | Interaction | PASS | Opened menu, observed profile/settings/custom cursor/sign-out entries, and closed with Escape. | PASS; no sign-out or settings mutation performed. |
| CMP-07 | Responsive sidebar | Interaction | PASS | Collapsed and restored desktop navigation; labels/navigation structure updated. Earlier mobile drawer open/close was also visually observed. | PASS for observed states. |
| CMP-08 | Sample Tracking search and status filter | Functional | PASS | Search for a non-existent synthetic term produced an explicit 0-result empty state; Clear restored all 10 rows. Awaiting receipt filter narrowed to one matching row; selecting All restored all ten. | PASS; live app, no record mutation. |
| CMP-09 | Sample Tracking selected detail | UI | Medium | The synthetic collection timestamp remained raw ISO in detail panel; clearing search also moved selection to another visible sample, as expected from the filter-aware selection behavior. | Timestamp portion fixed and live verified under V-02. Filter-aware selection behavior remains covered by the earlier live test. |
| REG-01 | Patient Registration directory search | Functional | PASS | Searched for a clearly synthetic, nonexistent name. The directory returned an explicit no-match message and a Register New Patient action. Opened the form; did not create a record. | PASS for empty search result/navigation; live app. |
| REG-02 | Patient Registration required fields | Validation | PASS | Attempted Continue with all fields empty. Inline errors appeared for first name, last name, DOB, gender, and mobile; no progression occurred. | PASS for required-field blocking. |
| REG-03 | Patient Registration mobile validation | Validation | PASS | Entered a short synthetic value (`123`) and retried. It remained invalid with “Valid 10-digit number required”; form did not progress. | PASS for this invalid-length case. |
| REG-04 | DOB picker | Interaction | PASS | Opened the calendar, confirmed future dates are disabled, then closed with Escape without selecting a date. | PASS for open/close; date selection and DOB age calculation were not re-tested in this pass. |
| ORD-01 | Test catalogue no-match search | Functional | PASS | Synthetic no-match query produced a zero-results message; Clear restored the catalogue. Existing six selections and ₹2,130 subtotal remained intact. | PASS; live UI. |
| ORD-02 | Test catalogue tabs and category filter | Functional | PASS | Packages, Recently Ordered, Favorites, and Test Catalogue tabs changed content; Haematology narrowed to 2 matching tests and All restored 15. Existing selected tests were preserved. | PASS; no add/remove or submit action performed. |

Other directly exercised interactions: collection site dropdown keyboard navigation and Escape; patient condition radio selection and restoration; theme remained in light mode. Test Order, Registration, Billing, Reports, Validation, and result-entry interactions were exercised in the earlier live workflow documented above, but the full reusable-component state matrix (hover/focus/disabled/loading/keyboard/responsive) is not complete.

### UI-only remediation and retest — 27 Nov 2026

The following audit UI findings were implemented without changing API/backend integrations or clinical business rules:

- Mobile workflow step labels now wrap at word boundaries instead of splitting words.
- Sample Tracking formats ISO collection timestamps as a readable `en-IN` date/time.
- The Alerts control opens the existing local mock alert list, with dismissible overlay and alert destinations.
- Barcode Preview opens a label dialog populated from the selected synthetic sample tube and patient.
- Topbar search now returns local patient, sample, and test matches; keyboard navigation and Enter select a result, and `Cmd/Ctrl+K` focuses search. Destination pages consume the search query and show the matching sample, patient, or test.
- Collection hour/minute controls are bound through Angular forms so selected values update the displayed draft time consistently.

Live UI verification: alert list opened; barcode preview opened and closed; sample/test/patient result navigation was checked; sample timestamp rendered in localized form; collection time was changed in the picker draft and canceled. V-01 was fixed at the stylesheet level but not re-captured at mobile width after the change. The development build passed and `git diff --check` passed. Unit tests passed (16/16) after allowing Karma to bind its local test port. No commit, push, or PR was created.

### Current phase status

- Phase 1 inventory: complete for routes and shell, based on route inspection and live app.
- Phase 2 visual review: complete for page coverage at desktop plus representative responsive layouts; exhaustive viewport matrix remains not tested.
- Phase 3 component testing: in progress; some shell and sample controls exercised. No claim of full component coverage.
- Phase 4 patient registration validation: partial; no-match search, empty required fields, invalid mobile length, and DOB picker open/close were tested. Valid registration, duplicate/mobile/name matching, DOB age calculation, edit/profile, and history navigation were not repeated in this continuation.
- Phase 5 test ordering: partial; catalogue search/tabs/category filters and preserved selected total were observed. Package add/remove, duplicate selection, repricing, edit/cancel, and submission were not repeated in this continuation.
- Phases 4–8 (validation, all modules, full E2E, and regression): not completed in this continuation. The previous report’s E2E evidence and open defects remain applicable, but are not a substitute for every checklist item in the new development QA prompt.
- No application code or business rules were changed. The existing uncommitted work in Sample Tracking/E2E was left untouched.

### Automated checks rerun during this continuation

| Check | Status | Result |
|---|---|---|
| Angular unit tests (`npm test -- --watch=false`) | PASS | 16/16 passed in Chrome. The first sandboxed attempt could not bind port 9876; rerunning with local test-server permission completed successfully. |
| Playwright E2E (`npm run e2e`) | FAIL | 1/2 passed. The protected-route redirect passed. The synthetic lifecycle reached Report Preview and failed because the report flag was `Normal` where the test expects `Unavailable` for a missing age-specific interval. Later dispatch/history assertions did not run. |
| Development build (`npm run build -- --configuration development`) | PASS | Completed after a sandboxed attempt was blocked replacing `dist/crypto-dashboard/3rdpartylicenses.txt`; rerun with permission to update generated build output succeeded. |
| Lint (`npm run lint`) | FAIL | Angular reports no configured `lint` target. |
- `npm run lint` — BLOCKED, no Angular lint target.
- `npm run e2e` — 1 PASS, 1 FAIL (synthetic workflow flag mismatch). The tracking filter regression assertion passes before the lifecycle reaches this failure.

**Repository state:** uncommitted changes in `e2e/workflow.spec.ts`, `src/app/features/sample-tracking/sample-tracking.component.html`, `src/app/features/sample-tracking/sample-tracking.component.ts`, and the new `docs/qa/medpath-production-readiness-audit-2026-11-27.md`; no commit, merge, push, or PR created.
