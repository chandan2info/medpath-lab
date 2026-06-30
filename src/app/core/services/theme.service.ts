import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

/** 'default' = original Teal/Indigo brand palette (no data-palette attr). */
export type Palette = 'default' | 'ocean' | 'sunset' | 'violet';

export interface PaletteOption {
  id: Palette;
  label: string;
  description: string;
  /** Swatches used for the preview dot/card — kept in sync with styles.css */
  swatches: { primary: string; secondary: string; accent: string };
}

export const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: 'default',
    label: 'Teal & Indigo',
    description: 'The original MedPath LIS theme.',
    swatches: { primary: '#3DC9A8', secondary: '#F07057', accent: '#5367FE' },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Cool blues with a warm amber accent.',
    swatches: { primary: '#0EA5E9', secondary: '#F59E0B', accent: '#2563EB' },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm coral and amber tones.',
    swatches: { primary: '#FB7185', secondary: '#FBBF24', accent: '#F97316' },
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'Rich purple with a magenta accent.',
    swatches: { primary: '#8B5CF6', secondary: '#EC4899', accent: '#C026D3' },
  },
];

const THEME_KEY = 'theme';
const PALETTE_KEY = 'theme-palette';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.getStoredTheme());
  readonly palette = signal<Palette>(this.getStoredPalette());

  readonly paletteOptions = PALETTE_OPTIONS;

  constructor() {
    // Apply immediately on construction to avoid flash
    this.applyTheme(this.theme());
    this.applyPalette(this.palette());

    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
      localStorage.setItem(THEME_KEY, t);
    });

    effect(() => {
      const p = this.palette();
      this.applyPalette(p);
      localStorage.setItem(PALETTE_KEY, p);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setPalette(p: Palette): void {
    this.palette.set(p);
  }

  private applyTheme(t: Theme): void {
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private applyPalette(p: Palette): void {
    if (p === 'default') {
      document.documentElement.removeAttribute('data-palette');
    } else {
      document.documentElement.setAttribute('data-palette', p);
    }
  }

  private getStoredTheme(): Theme {
    return (localStorage.getItem(THEME_KEY) as Theme) ?? 'light';
  }

  private getStoredPalette(): Palette {
    const stored = localStorage.getItem(PALETTE_KEY) as Palette | null;
    const valid = PALETTE_OPTIONS.some(o => o.id === stored);
    return valid ? (stored as Palette) : 'default';
  }
}
