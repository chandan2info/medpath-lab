# MedPath LIS — Angular Integration Guide

> Single-user Desktop Diagnostic Laboratory Information System  
> Built on top of the **angular-crypto-dashboard** base project (DattaAble theme)

---

## What's inside

| Path | What it does |
|------|-------------|
| `src/app/features/lis-home/lis-landing.component.ts` | Public splash / login page (shown before auth) |
| `src/app/features/lis-home/lis-home.component.ts` | Operator home screen (post-login dashboard) |
| `src/app/features/patient-registration/` | New patient form + live test order panel |
| `src/app/features/billing/` | Invoice builder with test picker + payment mode |
| `src/app/features/sample-tracking/` | Sample queue table + barcode detail panel |
| `src/app/features/result-entry/` | Parameter grid with inline editing + auto-flag |
| `src/app/features/reports/` | Report list + print-ready PDF preview |
| `src/app/features/patient-history/` | Searchable patient list + visit timeline |
| `src/app/shared/components/kpi-card/` | Reusable 4-metric KPI card |
| `src/app/shared/components/status-pill/` | Semantic status pill (pending/processing/ready/critical/stat) |
| `src/app/shared/models/lis.models.ts` | All domain interfaces and types |
| `src/app/core/services/navigation.service.ts` | RxJS BehaviorSubject for sidebar badge counts |
| `src/app/core/services/user-session.service.ts` | Operator identity + login helper |
| `src/app/core/guards/auth.guard.ts` | Route guard redirecting unauthenticated users to `/lis-home` |
| `src/app/layout/components/sidebar/` | LIS-themed sidebar (dark teal, NABL branding) |
| `src/app/layout/components/topbar/` | LIS topbar with search, theme toggle, operator menu |
| `src/app/layout/components/main-layout/` | Shell with persistent sidebar + `<router-outlet>` |
| `src/assets/scss/themes/_lis-variables.scss` | All CSS custom properties + utility classes |
| `src/assets/scss/_lis-print.scss` | Print stylesheet that strips chrome for PDF reports |

---

## Quick start

```bash
# 1. Install dependencies (already in package.json)
npm install

# 2. Start dev server
npm start
# → http://localhost:4200
# → Redirects automatically to /lis-home (login page)

# 3. Login credentials (demo)
Username: ravi.anand
Password: (any non-empty string)
```

---

## Route map

```
/                          → redirect → /lis-home
/lis-home                  → LisLandingComponent  (public, login card)
/dashboard                 → MainLayoutComponent  (requires auth)
  /dashboard/home          → LisHomeComponent     (operator home)
  /dashboard/registration  → PatientRegistrationComponent
  /dashboard/billing       → BillingComponent
  /dashboard/collection    → SampleTrackingComponent
  /dashboard/tracking      → SampleTrackingComponent
  /dashboard/results       → ResultEntryComponent
  /dashboard/reports       → ReportsComponent
  /dashboard/history       → PatientHistoryComponent
  /dashboard/analytics     → (placeholder → home)
  /dashboard/settings      → (placeholder → home)
```

---

## Architecture

```
src/app/
├── app.component.ts          Root shell (skip-link + router-outlet)
├── app.config.ts             provideRouter + provideHttpClient
├── app.routes.ts             Lazy-loaded route tree
│
├── core/
│   ├── guards/
│   │   └── auth.guard.ts             CanActivateFn
│   └── services/
│       ├── navigation.service.ts     Badge BehaviorSubject
│       ├── user-session.service.ts   Operator signal
│       ├── sidebar.service.ts        (existing — collapse/mobile)
│       └── theme.service.ts          (existing — dark mode)
│
├── layout/
│   └── components/
│       ├── main-layout/   Shell (sidebar + topbar + router-outlet)
│       ├── sidebar/       LIS dark-teal nav with live badges
│       └── topbar/        Search + theme toggle + operator menu
│
├── features/
│   ├── lis-home/           Landing page + home screen
│   ├── patient-registration/
│   ├── billing/
│   ├── sample-tracking/
│   ├── result-entry/
│   ├── reports/
│   └── patient-history/
│
└── shared/
    ├── components/
    │   ├── kpi-card/        Reusable metric card
    │   └── status-pill/     Semantic status badge
    └── models/
        └── lis.models.ts    All domain interfaces
```

---

## Key technical patterns

### 1. Signals-first state (Angular 17+)

All component state uses `signal()` and `computed()` — no manual `Subject` subscriptions inside components:

```typescript
// Sample from BillingComponent
private _sel = signal(new Set<string>(['CBC','LFT','URI']));
selectedTests  = computed(() => ALL_TESTS.filter(t => this._sel().has(t.id)));
grandTotal     = computed(() => this.subtotal() - this.discAmt());

toggle(id: string): void {
  this._sel.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
}
```

### 2. Live badge counts via BehaviorSubject

The sidebar subscribes to `NavigationService.badges$`. Any feature can push an update:

```typescript
// In any component or service
const nav = inject(NavigationService);

// New report ready → increment badge
nav.increment('reports');

// User viewed billing → clear badge
nav.clearBadge('billing');

// Explicit value
nav.updateBadge('tracking', 12);
```

### 3. OnPush everywhere

All new components use `ChangeDetectionStrategy.OnPush`. Signals automatically schedule re-renders — no `markForCheck()` needed.

### 4. Lazy loading

Every feature is loaded via `loadComponent()` in `app.routes.ts`. The initial bundle only loads the landing page. The lab shell loads on first authenticated route.

### 5. Print-ready reports

`ReportsComponent` renders a `.report-sheet` div styled for screen. When the operator clicks **Print**, the browser's print dialog activates `_lis-print.scss` which:
- Hides sidebar, topbar, action buttons
- Renders the report sheet full-width on A4
- Preserves brand colours with `print-color-adjust: exact`

---

## Wiring to a real backend

### Replace the mock data

Each feature component has a clearly separated `const DATA = [...]` block at the top of the file. Replace these with service calls:

```typescript
// patient-registration.component.ts
// Replace LAB_TESTS constant with:
export class PatientRegistrationComponent implements OnInit {
  private labService = inject(LabService);
  allTests = signal<LabTest[]>([]);

  ngOnInit() {
    this.labService.getTests().subscribe(t => this.allTests.set(t));
  }
}
```

### Auth guard

`auth.guard.ts` currently checks `session.operator().name`. Replace with a token check:

```typescript
export const authGuard: CanActivateFn = () => {
  const session = inject(UserSessionService);
  const router  = inject(Router);
  const token   = localStorage.getItem('lis_token');
  if (token && !isTokenExpired(token)) return true;
  return router.createUrlTree(['/lis-home']);
};
```

### Critical value alerts

`ResultEntryComponent.evalFlag()` runs locally. Wire to a WebSocket for real-time machine results:

```typescript
private ws = inject(WebSocketService);

ngOnInit() {
  this.ws.results$(this.sampleId).subscribe(param => {
    const i = this.params.findIndex(p => p.id === param.id);
    if (i !== -1) { this.params[i].value = param.value; this.evalFlag(i); }
  });
}
```

---

## SCSS design tokens

All LIS tokens live in `src/assets/scss/themes/_lis-variables.scss` as CSS custom properties so they automatically respect the existing DattaAble dark/light theme switch:

```scss
--lis-primary:        #1D9E75;   // Main brand teal
--lis-primary-deep:   #085041;   // Dark text on teal bg
--lis-primary-xlight: #E1F5EE;   // Teal-tinted card backgrounds
--lis-danger:         #E24B4A;   // Critical values, alerts
--lis-warning:        #EF9F27;   // Pending, amber states
--lis-sidebar-bg:     #04342C;   // Deep teal sidebar
```

---

## Accessibility

- All interactive elements have `aria-label` or visible labels
- Status pills carry `aria-label="Status: pending"` etc.
- Critical value banners use `role="alert"` + `aria-live="assertive"`
- KPI cards use `role="region"` with descriptive `aria-label`
- Skip-to-content link in `AppComponent` for keyboard users
- Print stylesheet verified against WCAG print contrast guidelines
- Segmented controls use `role="group"` + `aria-pressed` on each button
- Stepper uses `role="list"` + `aria-label` on completed steps

---

## Adding a new module (example: Inventory)

```bash
# 1. Create feature folder
mkdir src/app/features/inventory

# 2. Create component
touch src/app/features/inventory/inventory.component.ts
# → standalone, OnPush, imports RouterLink

# 3. Add to routes (app.routes.ts)
{
  path: 'inventory',
  loadComponent: () =>
    import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
  title: 'Inventory — MedPath LIS',
}

# 4. Add to sidebar (sidebar.component.ts)
{ label:'Inventory', route:'/dashboard/inventory', icon:'package' }
```

---

## File checklist — new files added to your project

```
✅ src/app/app.component.ts               (updated — skip-link)
✅ src/app/app.config.ts                  (updated — withViewTransitions)
✅ src/app/app.routes.ts                  (replaced — full LIS route tree)
✅ src/app/core/guards/auth.guard.ts      (new)
✅ src/app/core/services/navigation.service.ts  (new)
✅ src/app/core/services/user-session.service.ts (new)
✅ src/app/layout/components/main-layout/main-layout.component.ts  (updated)
✅ src/app/layout/components/sidebar/sidebar.component.ts          (updated)
✅ src/app/layout/components/topbar/topbar.component.ts            (updated)
✅ src/app/shared/models/lis.models.ts    (new)
✅ src/app/shared/components/kpi-card/kpi-card.component.ts        (new)
✅ src/app/shared/components/status-pill/status-pill.component.ts  (new)
✅ src/app/features/lis-home/lis-landing.component.ts  (new — login page)
✅ src/app/features/lis-home/lis-home.component.ts     (new — home screen)
✅ src/app/features/patient-registration/patient-registration.component.ts (new)
✅ src/app/features/billing/billing.component.ts        (new)
✅ src/app/features/sample-tracking/sample-tracking.component.ts  (new)
✅ src/app/features/result-entry/result-entry.component.ts         (new)
✅ src/app/features/reports/reports.component.ts        (new)
✅ src/app/features/patient-history/patient-history.component.ts  (new)
✅ src/assets/scss/themes/_lis-variables.scss   (new — design tokens)
✅ src/assets/scss/_lis-print.scss             (new — print stylesheet)
✅ src/assets/scss/styles.scss                 (appended — LIS import)
```
