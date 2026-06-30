import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ThemeService, Palette } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div><h1 class="page-title">Settings</h1></div>
    </div>

    <section class="settings-card" aria-labelledby="appearance-heading">
      <div class="settings-card-head">
        <i class="ti ti-palette settings-card-icon" aria-hidden="true"></i>
        <div>
          <h2 id="appearance-heading" class="settings-card-title">Appearance</h2>
          <p class="settings-card-sub">Choose a color theme for MedPath LIS. Your selection applies instantly and is saved on this device.</p>
        </div>
      </div>

      <div class="theme-grid" role="radiogroup" aria-label="Color theme">
        @for (option of theme.paletteOptions; track option.id) {
          <button
            type="button"
            class="theme-option"
            [class.active]="theme.palette() === option.id"
            role="radio"
            [attr.aria-checked]="theme.palette() === option.id"
            (click)="selectPalette(option.id)"
          >
            <span class="theme-swatches" aria-hidden="true">
              <span class="swatch" [style.background]="option.swatches.primary"></span>
              <span class="swatch" [style.background]="option.swatches.accent"></span>
              <span class="swatch" [style.background]="option.swatches.secondary"></span>
            </span>
            <span class="theme-text">
              <span class="theme-label">{{ option.label }}</span>
              <span class="theme-desc">{{ option.description }}</span>
            </span>
            @if (theme.palette() === option.id) {
              <i class="ti ti-circle-check-filled theme-check" aria-hidden="true"></i>
            }
          </button>
        }
      </div>

      <div class="mode-row">
        <div class="mode-row-text">
          <span class="theme-label">Dark mode</span>
          <span class="theme-desc">Switch between light and dark backgrounds.</span>
        </div>
        <button
          type="button"
          class="mode-toggle"
          role="switch"
          [attr.aria-checked]="theme.theme() === 'dark'"
          (click)="theme.toggle()"
        >
          <i class="ti" [class.ti-sun]="theme.theme() === 'light'" [class.ti-moon]="theme.theme() === 'dark'" aria-hidden="true"></i>
          {{ theme.theme() === 'dark' ? 'Dark' : 'Light' }}
        </button>
      </div>
    </section>

    <div class="placeholder-page" role="region" aria-label="More settings coming soon">
      <i class="ti ti-settings placeholder-icon" aria-hidden="true"></i>
      <h2 class="placeholder-title">More settings — Coming soon</h2>
      <p class="placeholder-sub">Lab profile, user management, printer config, and backup settings will appear here.</p>
    </div>`,
  styles: [`
    :host { display:block; }

    .page-header { margin-bottom:14px; }
    .page-title  { font-size:20px; font-weight:500; color:var(--text-primary); margin:0; }

    .settings-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .settings-card-head {
      display:flex;
      align-items:flex-start;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
    }
    .settings-card-icon {
      font-size: 22px;
      color: var(--primary-deeper);
      flex-shrink: 0;
      margin-top: 2px;
    }
    .settings-card-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0 0 2px; }
    .settings-card-sub   { font-size:13px; color:var(--text-secondary); margin:0; max-width:520px; }

    .theme-grid {
      display:grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-3);
    }

    .theme-option {
      position: relative;
      display:flex;
      align-items:center;
      gap: var(--space-3);
      text-align:left;
      padding: var(--space-3) var(--space-4);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-surface-alt);
      cursor: pointer;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
      font-family: inherit;
    }
    .theme-option:hover {
      border-color: var(--primary-light);
      transform: translateY(-1px);
    }
    .theme-option:focus-visible {
      outline: 2px solid var(--primary-deeper);
      outline-offset: 2px;
    }
    .theme-option.active {
      border-color: var(--primary-deeper);
      box-shadow: 0 0 0 3px var(--primary-xlight);
      background: var(--bg-surface);
    }

    .theme-swatches {
      display:flex;
      flex-shrink:0;
    }
    .swatch {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--bg-surface);
      box-shadow: 0 0 0 1px var(--border);
    }
    .swatch + .swatch { margin-left: -7px; }

    .theme-text { display:flex; flex-direction:column; gap:1px; min-width:0; }
    .theme-label { font-size:13px; font-weight:600; color:var(--text-primary); }
    .theme-desc  { font-size:11.5px; color:var(--text-secondary); }

    .theme-check {
      position:absolute;
      top:8px;
      right:8px;
      font-size:16px;
      color: var(--primary-deeper);
    }

    .mode-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap: var(--space-4);
      margin-top: var(--space-5);
      padding-top: var(--space-5);
      border-top: 1px solid var(--border);
    }
    .mode-row-text { display:flex; flex-direction:column; gap:1px; }

    .mode-toggle {
      display:flex;
      align-items:center;
      gap: var(--space-2);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      background: var(--bg-surface-alt);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 8px 14px;
      cursor: pointer;
      transition: border-color var(--transition-fast), background var(--transition-fast);
      font-family: inherit;
    }
    .mode-toggle:hover { border-color: var(--primary-light); }
    .mode-toggle i { font-size: 16px; color: var(--theme-icon-color, var(--primary-deeper)); }

    .placeholder-page { display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding:60px 20px; gap:14px; text-align:center; }
    .placeholder-icon { font-size:48px; color:var(--lis-primary,#1D9E75); opacity:0.35; }
    .placeholder-title { font-size:18px; font-weight:500; color:var(--text-primary); margin:0; }
    .placeholder-sub   { font-size:13px; color:var(--text-secondary); margin:0; max-width:360px; }
  `]
})
export class SettingsComponent {
  protected readonly theme = inject(ThemeService);

  protected selectPalette(id: Palette): void {
    this.theme.setPalette(id);
  }
}
