import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { KpiCard } from '../../models/lis.models';

@Component({
  selector: 'lis-kpi-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi-card" role="region" [attr.aria-label]="card().label">
      <div class="kpi-label">
        <i class="ti ti-{{ card().icon }}" aria-hidden="true"></i>
        {{ card().label }}
      </div>
      <div class="kpi-value">{{ card().value }}</div>
      @if (card().delta) {
        <div
          class="kpi-delta"
          [ngClass]="card().deltaUp ? 'kpi-delta--up' : 'kpi-delta--neutral'"
        >
          {{ card().delta }}
        </div>
      }
      @if (card().barPct !== undefined) {
        <div class="kpi-bar" role="progressbar"
          [attr.aria-valuenow]="card().barPct"
          aria-valuemin="0" aria-valuemax="100">
          <div
            class="kpi-bar__fill"
            [ngClass]="'kpi-bar__fill--' + (card().barColor ?? 'teal')"
            [style.width.%]="card().barPct"
          ></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .kpi-card {
      background: var(--card-bg);
      border: 0.5px solid var(--border-color);
      border-radius: var(--lis-card-radius, 10px);
      padding: 13px 15px;
    }
    .kpi-label {
      font-size: 11px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 6px;
      i { font-size: 14px; }
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1;
    }
    .kpi-delta {
      font-size: 11px;
      margin-top: 4px;
    }
    .kpi-delta--up      { color: #0F6E56; }
    .kpi-delta--neutral { color: var(--text-secondary); }
    .kpi-bar {
      height: 3px;
      background: var(--body-bg);
      border-radius: 2px;
      margin-top: 9px;
      overflow: hidden;
    }
    .kpi-bar__fill {
      height: 100%;
      border-radius: 2px;
    }
    .kpi-bar__fill--teal  { background: var(--lis-primary, #1D9E75); }
    .kpi-bar__fill--amber { background: var(--lis-warning, #EF9F27); }
    .kpi-bar__fill--red   { background: var(--lis-danger,  #E24B4A); }
  `],
})
export class KpiCardComponent {
  readonly card = input.required<KpiCard>();
}
