import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.getStoredTheme());

  constructor() {
    // Apply immediately on construction to avoid flash
    this.applyTheme(this.theme());

    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
      localStorage.setItem('theme', t);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  private applyTheme(t: Theme): void {
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private getStoredTheme(): Theme {
    return (localStorage.getItem('theme') as Theme) ?? 'light';
  }
}
