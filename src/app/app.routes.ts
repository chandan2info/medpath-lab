import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'lis-home',
    pathMatch: 'full',
  },
  {
    path: 'lis-home',
    loadComponent: () =>
      import('./features/lis-home/lis-landing.component').then(m => m.LisLandingComponent),
    title: 'MedPath Diagnostics — Lab Information System',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./layout/components/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/lis-home/lis-home.component').then(m => m.LisHomeComponent),
        title: 'Home — MedPath LIS',
      },
      {
        path: 'registration',
        loadComponent: () =>
          import('./features/patient-registration/patient-registration.component').then(m => m.PatientRegistrationComponent),
        title: 'Patient Registration — MedPath LIS',
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing.component').then(m => m.BillingComponent),
        title: 'Billing — MedPath LIS',
      },
      {
        path: 'collection',
        loadComponent: () =>
          import('./features/sample-tracking/sample-tracking.component').then(m => m.SampleTrackingComponent),
        title: 'Sample Collection — MedPath LIS',
      },
      {
        path: 'tracking',
        loadComponent: () =>
          import('./features/sample-tracking/sample-tracking.component').then(m => m.SampleTrackingComponent),
        title: 'Sample Tracking — MedPath LIS',
      },
      {
        path: 'results',
        loadComponent: () =>
          import('./features/result-entry/result-entry.component').then(m => m.ResultEntryComponent),
        title: 'Result Entry — MedPath LIS',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reports — MedPath LIS',
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/patient-history/patient-history.component').then(m => m.PatientHistoryComponent),
        title: 'Patient History — MedPath LIS',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'Analytics — MedPath LIS',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Settings — MedPath LIS',
      },
      {
        path: '**',
        redirectTo: 'home',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'lis-home',
  },
];
