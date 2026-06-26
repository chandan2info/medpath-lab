import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { SocialCard } from '../../models/dashboard.models';

interface PlatformConfig {
  color: string;
  bgClass: string;
  icon: string;
  label: string;
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  facebook: { color: '#1877f2', bgClass: 'plat-facebook', icon: 'brand-facebook', label: 'Facebook' },
  twitter:  { color: '#1da1f2', bgClass: 'plat-twitter',  icon: 'brand-x',        label: 'X (Twitter)' },
  youtube:  { color: '#ff0000', bgClass: 'plat-youtube',  icon: 'brand-youtube',  label: 'YouTube' },
  linkedin: { color: '#0a66c2', bgClass: 'plat-linkedin', icon: 'brand-linkedin', label: 'LinkedIn' },
};

@Component({
  selector: 'app-social-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card social-card" role="region" [attr.aria-label]="platformCfg().label + ' social stats'">
      <!-- Header -->
      <div class="social-header">
        <div class="social-platform-icon" [ngClass]="platformCfg().bgClass" aria-hidden="true">
          <i class="ti ti-{{ platformCfg().icon }}"></i>
        </div>
        <div class="social-header-info">
          <p class="social-platform-name">{{ platformCfg().label }}</p>
          <div class="social-count-row">
            <span class="social-total" [attr.aria-label]="card().totalCount + ' ' + card().label">
              {{ card().totalCount }}
            </span>
            <span
              class="social-change"
              [ngClass]="card().changePercent >= 0 ? 'change-up' : 'change-down'"
              [attr.aria-label]="(card().changePercent >= 0 ? 'Up' : 'Down') + ' ' + Math.abs(card().changePercent) + ' percent'"
            >
              <i class="ti ti-{{ card().changePercent >= 0 ? 'arrow-up-right' : 'arrow-down-right' }}" aria-hidden="true"></i>
              {{ card().changePercent > 0 ? '+' : '' }}{{ card().changePercent }}%
            </span>
          </div>
          <p class="social-label">{{ card().label }}</p>
        </div>
      </div>

      <!-- Divider -->
      <div class="social-divider" aria-hidden="true"></div>

      <!-- Stats -->
      <div class="social-stats">
        <div class="social-stat-item">
          <div class="social-stat-header">
            <span class="social-stat-title">Target</span>
            <span class="social-stat-val">{{ card().targetCount }}</span>
          </div>
          <div
            class="social-progress"
            role="progressbar"
            [attr.aria-valuenow]="card().targetProgress"
            aria-valuemin="0" aria-valuemax="100"
            [attr.aria-label]="'Target progress: ' + card().targetProgress + '%'"
          >
            <div
              class="social-progress-fill"
              [ngClass]="platformCfg().bgClass + '-fill'"
              [style.width.%]="card().targetProgress"
            ></div>
          </div>
          <span class="social-progress-pct" aria-hidden="true">{{ card().targetProgress }}%</span>
        </div>

        <div class="social-stat-item">
          <div class="social-stat-header">
            <span class="social-stat-title">Today</span>
            <span class="social-stat-val">{{ card().todayCount }}</span>
          </div>
          <div
            class="social-progress"
            role="progressbar"
            [attr.aria-valuenow]="card().todayProgress"
            aria-valuemin="0" aria-valuemax="100"
            [attr.aria-label]="'Today progress: ' + card().todayProgress + '%'"
          >
            <div
              class="social-progress-fill today-fill"
              [style.width.%]="card().todayProgress"
            ></div>
          </div>
          <span class="social-progress-pct" aria-hidden="true">{{ card().todayProgress }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .social-card { padding: 20px; height: 100%; transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
    .social-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); }

    .social-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }

    .social-platform-icon {
      width: 48px; height: 48px;
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .plat-facebook { background: rgba(24,119,242,0.12); color: #1877f2; }
    .plat-twitter  { background: rgba(0,0,0,0.08);      color: #0f0f0f; }
    .plat-youtube  { background: rgba(255,0,0,0.10);    color: #ff0000; }
    .plat-linkedin { background: rgba(10,102,194,0.12); color: #0a66c2; }
    [data-theme="dark"] .plat-twitter { background: rgba(255,255,255,0.08); color: #e7e9ea; }

    .social-header-info { flex: 1; min-width: 0; }
    .social-platform-name { font-size: 11px; font-weight: 600; color: var(--text-muted); margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .social-count-row { display: flex; align-items: center; gap: 8px; }
    .social-total { font-size: 22px; font-weight: 700; color: var(--text-base); line-height: 1.2; }
    .social-label { font-size: 12px; color: var(--text-subtle); margin: 2px 0 0; }

    .social-change {
      display: inline-flex; align-items: center; gap: 2px;
      font-size: 11px; font-weight: 700;
      padding: 3px 7px; border-radius: var(--radius-sm);
    }
    .social-change i { font-size: 12px; }
    .change-up   { background: rgba(16,185,129,0.12); color: var(--color-success); }
    .change-down { background: rgba(239,68,68,0.12);  color: var(--color-danger); }

    .social-divider { height: 1px; background: var(--border); margin-bottom: 16px; }

    .social-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .social-stat-item {}
    .social-stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .social-stat-title { font-size: 11px; color: var(--text-muted); font-weight: 500; }
    .social-stat-val   { font-size: 12px; color: var(--text-base); font-weight: 600; }

    .social-progress {
      height: 5px; background: var(--border);
      border-radius: 999px; overflow: hidden; margin-bottom: 4px;
    }
    .social-progress-fill {
      height: 100%; border-radius: 999px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .plat-facebook-fill { background: #1877f2; }
    .plat-twitter-fill  { background: #1da1f2; }
    .plat-youtube-fill  { background: #ff0000; }
    .plat-linkedin-fill { background: #0a66c2; }
    .today-fill { background: linear-gradient(90deg, var(--color-success), #059669); }

    .social-progress-pct { font-size: 10px; color: var(--text-subtle); }
  `],
})
export class SocialCardComponent {
  readonly card = input.required<SocialCard>();
  protected Math = Math;
  platformCfg() { return PLATFORM_CONFIG[this.card().platform] ?? PLATFORM_CONFIG['facebook']; }
}
