import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { StatCard } from '../../models/dashboard.models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card stat-card" role="region" [attr.aria-label]="card().title + ' statistics'">
      <div class="stat-card-inner">
        <!-- Icon -->
        <div class="stat-icon-wrap" [ngClass]="'stat-icon-' + card().colorVariant" aria-hidden="true">
          <i class="ti ti-{{ card().icon }}"></i>
        </div>

        <!-- Content -->
        <div class="stat-content">
          <p class="stat-label">{{ card().title }}</p>
          <p class="stat-value" [attr.aria-label]="card().value">{{ card().value }}</p>
          @if (card().subtitle) {
            <p class="stat-subtitle">{{ card().subtitle }}</p>
          }
        </div>

        <!-- Badge -->
        <div
          class="stat-badge"
          [ngClass]="card().trend === 'up' ? 'stat-badge-up' : card().trend === 'down' ? 'stat-badge-down' : 'stat-badge-neutral'"
          [attr.aria-label]="(card().changePercent > 0 ? 'Up' : 'Down') + ' ' + Math.abs(card().changePercent) + ' percent'"
        >
          @if (card().trend === 'up') {
            <i class="ti ti-arrow-up-right" aria-hidden="true"></i>
          } @else if (card().trend === 'down') {
            <i class="ti ti-arrow-down-right" aria-hidden="true"></i>
          }
          <span>{{ card().changePercent > 0 ? '+' : '' }}{{ card().changePercent }}%</span>
        </div>
      </div>

      <!-- Progress -->
      <div class="stat-progress-wrap">
        <div
          class="stat-progress"
          role="progressbar"
          [attr.aria-valuenow]="card().progressValue"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="card().progressValue + '% of target'"
        >
          <div
            class="stat-progress-fill"
            [ngClass]="'stat-progress-' + card().colorVariant"
            [style.width.%]="card().progressValue"
          ></div>
        </div>
        <span class="stat-progress-label" aria-hidden="true">{{ card().progressValue }}% of target</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      height: 100%;
      padding: 20px;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-hover);
    }

    .stat-card-inner {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 16px;
    }

    .stat-icon-wrap {
      width: 48px; height: 48px;
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-size: 22px;
    }
    .stat-icon-primary  { background: var(--primary-light);   color: var(--primary-deeper); }
    .stat-icon-secondary{ background: var(--secondary-light); color: var(--secondary-dark); }
    .stat-icon-accent   { background: var(--accent-light);    color: var(--accent-dark); }
    .stat-icon-success  { background: rgba(16,185,129,0.12);  color: var(--color-success); }
    .stat-icon-danger   { background: rgba(239,68,68,0.12);   color: var(--color-danger); }
    .stat-icon-warning  { background: rgba(245,158,11,0.12);  color: var(--color-warning); }

    .stat-content { flex: 1; min-width: 0; }
    .stat-label  { font-size: 12px; font-weight: 500; color: var(--text-muted); margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value  { font-size: 22px; font-weight: 700; color: var(--text-base); margin: 0 0 2px; line-height: 1.2; }
    .stat-subtitle { font-size: 11px; color: var(--text-subtle); margin: 0; }

    .stat-badge {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 12px; font-weight: 700;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .stat-badge i { font-size: 13px; }
    .stat-badge-up      { background: rgba(16,185,129,0.12); color: var(--color-success); }
    .stat-badge-down    { background: rgba(239,68,68,0.12);  color: var(--color-danger); }
    .stat-badge-neutral { background: var(--bg-surface-alt); color: var(--text-muted); }

    .stat-progress-wrap {
      display: flex; align-items: center; gap: 10px;
    }
    .stat-progress {
      flex: 1; height: 6px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
    }
    .stat-progress-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-progress-primary   { background: linear-gradient(90deg, var(--primary), var(--primary-dark)); }
    .stat-progress-secondary { background: linear-gradient(90deg, var(--secondary), var(--secondary-dark)); }
    .stat-progress-accent    { background: linear-gradient(90deg, var(--accent), var(--accent-dark)); }
    .stat-progress-success   { background: linear-gradient(90deg, #10b981, #059669); }
    .stat-progress-danger    { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .stat-progress-warning   { background: linear-gradient(90deg, #f59e0b, #d97706); }

    .stat-progress-label { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
  `],
})
export class StatCardComponent {
  readonly card = input.required<StatCard>();
  protected Math = Math;
}
