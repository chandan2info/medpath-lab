import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ThemeService, Palette } from '../../core/services/theme.service';
import { CursorPreferenceService } from '../../core/services/cursor-preference.service';
import { PdfPreferencesService } from '../../core/services/pdf-preferences.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div><h1 class="page-title">Settings</h1></div>
    </div>

    <div class="settings-layout">
    <section class="settings-card appearance-card" aria-labelledby="appearance-heading">
      <div class="settings-card-head">
        <i class="ti ti-palette settings-card-icon" aria-hidden="true"></i>
        <div>
          <h2 id="appearance-heading" class="settings-card-title">Appearance</h2>
          <p class="settings-card-sub">Choose a color theme for MedPath LIS. Your selection applies instantly and is saved on this device.</p>
        </div>
      </div>

      <div class="theme-grid" role="radiogroup" aria-label="Color theme">
        @for (option of theme.paletteOptions; track option.id) {
          <button type="button" class="theme-option"
            [class.active]="theme.palette() === option.id"
            role="radio" [attr.aria-checked]="theme.palette() === option.id"
            (click)="selectPalette(option.id)">
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
        <button type="button" class="mode-switch" role="switch" aria-label="Dark mode"
          [class.is-on]="theme.theme() === 'dark'"
          [attr.aria-checked]="theme.theme() === 'dark'" (click)="theme.toggle()">
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"><i class="ti" [class.ti-moon]="theme.theme() === 'dark'" [class.ti-sun]="theme.theme() === 'light'"></i></span></span>
          <span class="switch-state">{{ theme.theme() === 'dark' ? 'On' : 'Off' }}</span>
        </button>
      </div>
    </section>

    <section class="settings-card cursor-card" aria-labelledby="cursor-heading">
      <div class="settings-card-head">
        <i class="ti ti-pointer settings-card-icon" aria-hidden="true"></i>
        <div>
          <h2 id="cursor-heading" class="settings-card-title">Custom cursor</h2>
          <p class="settings-card-sub">Personalize the arrow and pointer-hand colors. Changes apply instantly and are saved on this device.</p>
        </div>
      </div>

      <div class="cursor-enable-row">
        <div class="mode-row-text">
          <span class="theme-label">Enable custom cursor</span>
          <span class="theme-desc">Use the MedPath cursor instead of the browser default on desktop.</span>
        </div>
        <button type="button" class="mode-switch" role="switch" aria-label="Enable custom cursor"
          [class.is-on]="cursor.enabled()"
          [attr.aria-checked]="cursor.enabled()"
          (click)="cursor.toggle()">
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="switch-state">{{ cursor.enabled() ? 'On' : 'Off' }}</span>
        </button>
      </div>

      <div class="cursor-color-row">
        <div class="cursor-color-copy">
          <span class="theme-label">Cursor color</span>
          <span class="theme-desc">Choose a color for both the arrow and clickable hand.</span>
        </div>
        <div class="color-picker-control">
          <label class="color-picker" [style.--picker-color]="cursor.color()" for="cursor-color">
            <input id="cursor-color" type="color" [value]="cursor.color()" (input)="onCursorColorInput($event)" aria-label="Choose custom cursor color">
            <span class="color-picker-preview" aria-hidden="true"></span>
          </label>
          <code class="color-value">{{ cursor.color() }}</code>
          <button type="button" class="reset-color" (click)="cursor.resetColor()">Reset</button>
        </div>
      </div>

      <div class="cursor-presets" aria-label="Preset cursor colors">
        @for (color of cursorColors; track color.value) {
          <button type="button" class="color-preset"
            [style.--preset-color]="color.value"
            [class.selected]="cursor.color() === color.value"
            [attr.aria-label]="'Set cursor color to ' + color.label"
            [attr.aria-pressed]="cursor.color() === color.value"
            (click)="cursor.setColor(color.value)">
            <span></span>
            <small>{{ color.label }}</small>
          </button>
        }
      </div>
    </section>

    <section class="settings-card pdf-card" aria-labelledby="pdf-export-heading">
      <div class="settings-card-head">
        <i class="ti ti-file-type-pdf settings-card-icon" aria-hidden="true"></i>
        <div>
          <h2 id="pdf-export-heading" class="settings-card-title">PDF export</h2>
          <p class="settings-card-sub">Control whether report exports can use custom paper size, orientation and margin settings. When disabled, reports use the standard A4 portrait format.</p>
        </div>
      </div>
      <div class="mode-row pdf-preference-row">
        <div class="mode-row-text">
          <span class="theme-label">Enable custom PDF settings</span>
          <span class="theme-desc">Allow users to change paper size, orientation and margins in the report PDF preview.</span>
        </div>
        <button type="button" class="mode-switch" role="switch" aria-label="Enable custom PDF settings"
          [class.is-on]="pdfPreferences.customSettingsEnabled()"
          [attr.aria-checked]="pdfPreferences.customSettingsEnabled()"
          (click)="togglePdfSettings()">
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="switch-state">{{ pdfPreferences.customSettingsEnabled() ? 'On' : 'Off' }}</span>
        </button>
      </div>
      <p class="settings-card-sub pdf-preference-status">
        {{ pdfPreferences.customSettingsEnabled() ? 'Custom PDF controls are available on the Reports page.' : 'Custom PDF controls are hidden. Standard A4 portrait defaults will be used.' }}
      </p>
    </section>
    </div>

    <div class="placeholder-page" role="region" aria-label="More settings coming soon">
      <i class="ti ti-settings placeholder-icon" aria-hidden="true"></i>
      <h2 class="placeholder-title">More settings — Coming soon</h2>
      <p class="placeholder-sub">Lab profile, user management, printer config, and backup settings will appear here.</p>
    </div>`,
  styles: [`
    :host { display:block; }
    .page-header { margin-bottom:14px; }
    .page-title { font-size:20px; font-weight:500; color:var(--text-primary); margin:0; }
    .settings-layout {
      display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px;
      align-items:stretch;
    }
    .settings-card {
      min-width:0; background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg);
      box-shadow:var(--shadow-card); padding:var(--space-6); margin:0;
    }
    .appearance-card { grid-column:1 / -1; }
    .cursor-card,.pdf-card { height:100%; }
    .pdf-card { display:flex; flex-direction:column; }
    .pdf-preference-row { align-items:center; }
    .pdf-preference-status { margin-top:auto; padding-top:18px; }
    .settings-card-head { display:flex; align-items:flex-start; gap:var(--space-3); margin-bottom:var(--space-5); }
    .settings-card-icon { font-size:22px; color:var(--primary-deeper); flex-shrink:0; margin-top:2px; }
    .settings-card-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0 0 2px; }
    .settings-card-sub { font-size:13px; color:var(--text-secondary); margin:0; max-width:520px; }
    .theme-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .theme-option {
      min-width:0; position:relative; display:flex; align-items:center; gap:var(--space-3); text-align:left;
      padding:var(--space-3) var(--space-4); border:1.5px solid var(--border); border-radius:var(--radius-md);
      background:var(--bg-surface-alt); cursor:pointer; transition:border-color var(--transition-fast),box-shadow var(--transition-fast),transform var(--transition-fast); font-family:inherit;
    }
    .theme-option:hover { border-color:var(--primary-light); transform:translateY(-1px); }
    .theme-option:focus-visible { outline:2px solid var(--primary-deeper); outline-offset:2px; }
    .theme-option.active { border-color:var(--primary-deeper); box-shadow:0 0 0 3px var(--primary-xlight); background:var(--bg-surface); }
    .theme-swatches { display:flex; flex-shrink:0; }
    .swatch { width:18px; height:18px; border-radius:50%; border:2px solid var(--bg-surface); box-shadow:0 0 0 1px var(--border); }
    .swatch + .swatch { margin-left:-7px; }
    .theme-text,.cursor-color-copy,.mode-row-text { display:flex; flex-direction:column; gap:3px; min-width:0; }
    .theme-text { padding-right:12px; }
    .theme-desc { line-height:1.45; }
    .theme-label { font-size:13px; font-weight:600; color:var(--text-primary); }
    .theme-desc { font-size:11.5px; color:var(--text-secondary); }
    .theme-check { position:absolute; top:8px; right:8px; font-size:16px; color:var(--primary-deeper); }
    .mode-row,.cursor-enable-row,.cursor-color-row {
      display:flex; align-items:center; justify-content:space-between; gap:var(--space-4);
      margin-top:var(--space-5); padding-top:var(--space-5); border-top:1px solid var(--border);
    }
    .mode-switch {
      display:inline-flex; align-items:center; justify-content:flex-start; gap:10px;
      min-width:94px; padding:5px 11px 5px 6px; border:1px solid var(--border);
      border-radius:999px; background:var(--bg-surface-alt); color:var(--text-secondary);
      cursor:pointer; font:600 12px/1 inherit; transition:background .2s ease,border-color .2s ease,box-shadow .2s ease;
      -webkit-tap-highlight-color:transparent;
    }
    .mode-switch:hover { border-color:var(--primary-light); }
    .mode-switch:focus-visible { outline:2px solid var(--primary-deeper); outline-offset:3px; }
    .switch-track {
      width:38px; height:22px; flex:0 0 38px; display:flex; align-items:center;
      padding:3px; border-radius:999px; background:var(--border);
      transition:background .22s ease,box-shadow .22s ease;
    }
    .switch-thumb {
      width:16px; height:16px; display:grid; place-items:center; border-radius:50%;
      background:var(--bg-surface); color:var(--text-secondary);
      box-shadow:0 1px 3px rgba(0,0,0,.24); transform:translateX(0);
      transition:transform .22s cubic-bezier(.2,.8,.2,1),color .2s ease;
    }
    .switch-thumb i { font-size:10px; }
    .mode-switch.is-on { color:var(--primary-deeper); border-color:color-mix(in srgb,var(--primary-deeper) 42%,var(--border)); }
    .mode-switch.is-on .switch-track { background:var(--primary-deeper); box-shadow:0 0 0 3px var(--primary-xlight); }
    .mode-switch.is-on .switch-thumb { transform:translateX(16px); color:var(--primary-deeper); }
    .switch-state { min-width:20px; text-align:center; letter-spacing:.02em; text-transform:uppercase; }
    .color-picker-control { display:flex; align-items:center; gap:10px; }
    .color-picker { width:38px; height:38px; display:grid; place-items:center; padding:4px; border:1px solid var(--border); border-radius:10px; background:var(--bg-surface-alt); cursor:pointer; }
    .color-picker input { position:absolute; width:1px; height:1px; opacity:0; }
    .color-picker-preview { width:26px; height:26px; border-radius:7px; background:var(--picker-color); box-shadow:inset 0 0 0 1px rgba(0,0,0,.12); }
    .color-picker:focus-within { outline:2px solid var(--primary-deeper); outline-offset:2px; }
    .color-value { font-size:12px; color:var(--text-secondary); min-width:64px; }
    .reset-color { border:0; background:transparent; color:var(--primary-deeper); font:inherit; font-size:12px; font-weight:600; cursor:pointer; padding:6px; }
    .cursor-presets { display:flex; flex-wrap:wrap; gap:14px; margin-top:18px; }
    .color-preset { display:flex; flex-direction:column; align-items:center; gap:5px; padding:4px; border:1px solid transparent; border-radius:9px; background:transparent; cursor:pointer; }
    .color-preset span { width:22px; height:22px; border-radius:50%; background:var(--preset-color); box-shadow:0 0 0 1px var(--border),inset 0 0 0 2px var(--bg-surface); }
    .color-preset small { font-size:10px; color:var(--text-secondary); }
    .color-preset.selected { border-color:var(--primary-deeper); background:var(--primary-xlight); }
    .pdf-preference-row { margin-top:0; padding-top:0; border-top:0; }
    .pdf-preference-status { margin:auto 0 0; padding-top:18px; }
    .placeholder-page { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; gap:14px; text-align:center; }
    .placeholder-icon { font-size:48px; color:var(--lis-primary,#1D9E75); opacity:.35; }
    .placeholder-title { font-size:18px; font-weight:500; color:var(--text-primary); margin:0; }
    .placeholder-sub { font-size:13px; color:var(--text-secondary); margin:0; max-width:360px; }
    @media(max-width:1100px) {
      .theme-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media(max-width:900px) {
      .settings-layout { grid-template-columns:minmax(0,1fr); gap:16px; }
      .appearance-card { grid-column:auto; }
    }
    @media(max-width:560px) {
      .settings-card { padding:16px; }
      .theme-grid { grid-template-columns:minmax(0,1fr); }
      .cursor-enable-row,.cursor-color-row { align-items:flex-start; flex-direction:column; }
      .color-picker-control { flex-wrap:wrap; }
    }
  `]
})
export class SettingsComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly cursor = inject(CursorPreferenceService);
  protected readonly pdfPreferences = inject(PdfPreferencesService);
  protected readonly cursorColors = [
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Teal', value: '#0d9488' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Rose', value: '#e11d48' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Black', value: '#171717' },
  ];

  protected togglePdfSettings(): void {
    this.pdfPreferences.setCustomSettingsEnabled(!this.pdfPreferences.customSettingsEnabled());
  }

  protected selectPalette(id: Palette): void {
    this.theme.setPalette(id);
  }

  protected onCursorColorInput(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) this.cursor.setColor(input.value);
  }
}
