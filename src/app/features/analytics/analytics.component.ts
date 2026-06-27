import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div><h1 class="page-title">Analytics</h1></div>
    </div>
    <div class="placeholder-page" role="region" aria-label="Analytics coming soon">
      <i class="ti ti-chart-bar placeholder-icon" aria-hidden="true"></i>
      <h2 class="placeholder-title">Analytics — Coming soon</h2>
      <p class="placeholder-sub">Revenue trends, test volume charts, and TAT reports will appear here.</p>
    </div>`,
  styles: [`
    :host { display:block; }
    .page-header { margin-bottom:14px; }
    .page-title  { font-size:20px; font-weight:500; color:var(--text-primary); margin:0; }
    .placeholder-page { display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding:60px 20px; gap:14px; text-align:center; }
    .placeholder-icon { font-size:48px; color:var(--lis-primary,#1D9E75); opacity:0.35; }
    .placeholder-title { font-size:18px; font-weight:500; color:var(--text-primary); margin:0; }
    .placeholder-sub   { font-size:13px; color:var(--text-secondary); margin:0; max-width:360px; }
  `]
})
export class AnalyticsComponent {}
