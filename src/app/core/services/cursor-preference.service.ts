import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const STORAGE_KEY = 'medpath.customCursor.enabled';
const COLOR_KEY = 'medpath.customCursor.color';
const SHAPE_KEY = 'medpath.customCursor.shape';
const DEFAULT_COLOR = '#8b5cf6';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export type CursorShape = 'classic' | 'soft-pointer' | 'rounded' | 'compact';

@Injectable({ providedIn: 'root' })
export class CursorPreferenceService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = this.getStorage();
  private colorStyle?: HTMLStyleElement;

  readonly enabled = signal(this.readEnabled());
  readonly color = signal(this.readColor());
  readonly shape = signal<CursorShape>(this.readShape());

  constructor() {
    this.apply(this.enabled());
    this.applyColor(this.color());

    const view = this.document.defaultView;
    if (view) {
      const onStorage = (event: StorageEvent): void => {
        if (event.key !== null && event.key !== STORAGE_KEY && event.key !== COLOR_KEY && event.key !== SHAPE_KEY) return;

        if (event.key === null || event.key === STORAGE_KEY) {
          const enabled = event.newValue === null || event.newValue === 'true';
          this.enabled.set(enabled);
          this.apply(enabled);
        }
        if (event.key === null || event.key === COLOR_KEY) {
          const color = this.isValidColor(event.newValue) ? event.newValue : DEFAULT_COLOR;
          this.color.set(color);
          this.applyColor(color);
        }
        if (event.key === null || event.key === SHAPE_KEY) {
          const shape = this.isValidShape(event.newValue) ? event.newValue : 'classic';
          this.shape.set(shape);
          this.applyColor(this.color());
        }
      };

      view.addEventListener('storage', onStorage);
      this.destroyRef.onDestroy(() => view.removeEventListener('storage', onStorage));
    }

    this.destroyRef.onDestroy(() => this.colorStyle?.remove());
  }

  toggle(): void {
    this.setEnabled(!this.enabled());
  }

  setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);
    this.apply(enabled);
    try {
      this.storage?.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Keep the in-memory preference if browser storage is unavailable.
    }
  }

  setColor(color: string): void {
    if (!this.isValidColor(color)) return;
    const normalized = color.toLowerCase();
    this.color.set(normalized);
    this.applyColor(normalized);
    try {
      this.storage?.setItem(COLOR_KEY, normalized);
    } catch {
      // Keep the in-memory preference if browser storage is unavailable.
    }
  }

  setShape(shape: CursorShape): void {
    if (!this.isValidShape(shape)) return;
    this.shape.set(shape);
    this.applyColor(this.color());
    try { this.storage?.setItem(SHAPE_KEY, shape); } catch { /* Keep in-memory preference. */ }
  }

  private readShape(): CursorShape {
    try { const stored = this.storage?.getItem(SHAPE_KEY); return this.isValidShape(stored) ? stored : 'classic'; }
    catch { return 'classic'; }
  }

  private isValidShape(value: string | null | undefined): value is CursorShape {
    return value === 'classic' || value === 'soft-pointer' || value === 'rounded' || value === 'compact';
  }

  resetColor(): void {
    this.setColor(DEFAULT_COLOR);
  }

  private readEnabled(): boolean {
    try {
      const stored = this.storage?.getItem(STORAGE_KEY);
      return stored === null || stored === undefined ? true : stored === 'true';
    } catch {
      return true;
    }
  }

  private readColor(): string {
    try {
      const stored = this.storage?.getItem(COLOR_KEY);
      return this.isValidColor(stored) ? stored.toLowerCase() : DEFAULT_COLOR;
    } catch {
      return DEFAULT_COLOR;
    }
  }

  private isValidColor(value: string | null | undefined): value is string {
    return !!value && HEX_COLOR.test(value);
  }

  private apply(enabled: boolean): void {
    this.document.documentElement.classList.toggle('cursor-custom-enabled', enabled);
  }

  private getArrowPath(): string {
    switch (this.shape()) {
      case 'soft-pointer':
        return 'M4 3.5 C4 1.4 6.5 0.2 8.2 1.6 L28 17.4 C31.4 20.1 29.5 25.6 25.2 25.6 H18.7 C16.3 25.6 14.1 26.7 12.6 28.6 L8.6 29.5 C5.9 32 0.8 30.7 0.6 27.9 Z';
      case 'rounded':
        return 'M6 3.5 Q6 1.5 8 3 L27 17 Q31 20 26 23 L19 23 Q17 23 15 26 L12 30 Q9 33 8 28 Z';
      case 'compact':
        return 'M5 3 L5 25 L10 20 L14 28 L18 26 L14 18 L23 18 Z';
      case 'classic':
      default:
        return 'M5 3 L5 25 L11 19 L16 29 L21 26 L16 16 L25 16 Z';
    }
  }

  private applyColor(color: string): void {
    const arrowPath = this.getArrowPath();
    const arrow = this.cursorDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="${arrowPath}" fill="${color}" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/></svg>`);
    const hand = this.cursorDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M12 2.5 C10.9 2.5 10 3.4 10 4.5 V14 L8.1 12.1 C7.3 11.3 6 11.3 5.2 12.1 C4.4 12.9 4.4 14.2 5.2 15 L12.2 22 C13.4 23.2 15 23.8 16.7 23.8 H18 C21.3 23.8 24 21.1 24 17.8 V11 C24 9.9 23.1 9 22 9 C21.4 9 20.9 9.3 20.5 9.7 C20.2 8.7 19.3 8 18.3 8 C17.7 8 17.2 8.3 16.8 8.7 C16.5 7.7 15.6 7 14.6 7 C14 7 13.5 7.3 13.1 7.7 V4.5 C13.1 3.4 12 2.5 12 2.5 Z" fill="${color}" stroke="#ffffff" stroke-width="1.7" stroke-linejoin="round"/></svg>`
    );
    const textCursor = this.cursorDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path d="M6 5 H18 M12 5 V27 M6 27 H18" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/><path d="M6 5 H18 M12 5 V27 M6 27 H18" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/></svg>`
    );

    if (!this.colorStyle) {
      this.colorStyle = this.document.createElement('style');
      this.colorStyle.setAttribute('data-medpath-cursor-color', '');
      this.document.head?.appendChild(this.colorStyle);
    }
    this.colorStyle.textContent = `
      @media (hover: hover) and (pointer: fine) {
        html.cursor-custom-enabled,
        html.cursor-custom-enabled body,
        html.cursor-custom-enabled body * {
          cursor: url("${arrow}") ${this.shape() === 'soft-pointer' ? '4 4' : '4 3'}, auto !important;
        }

        /* Match the specificity of the global cursor overrides so the
           selected hand color wins on hovered controls and their children. */
        /* Search and other text inputs use a colored I-beam, not the old
           hard-coded violet cursor from the global stylesheet. */
        html.cursor-custom-enabled body :is(
          input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]),
          textarea, [contenteditable="true"], [role="textbox"],
          .CodeMirror, .monaco-editor, .cm-content
        ) {
          cursor: url("${textCursor}") 12 16, text !important;
        }

        html.cursor-custom-enabled body :is(
          button:not(:disabled):not([aria-disabled="true"]),
          a,
          [role="button"]:not([aria-disabled="true"]),
          [role="link"], [role="tab"], [role="menuitem"], [role="option"],
          [role="switch"], [role="checkbox"], [role="radio"], [role="treeitem"],
          summary, select, label[for],
          input[type="button"], input[type="submit"], input[type="reset"],
          input[type="checkbox"], input[type="radio"], input[type="range"],
          .clickable, .lis-btn, .cursor-pointer, [ng-reflect-router-link],
          .apexcharts-legend-series, .apexcharts-toolbar > div, .apexcharts-menu-item
        ),
        html.cursor-custom-enabled body :is(
          button:not(:disabled):not([aria-disabled="true"]),
          a,
          [role="button"]:not([aria-disabled="true"]),
          [role="link"], [role="tab"], [role="menuitem"], [role="option"],
          [role="switch"], [role="checkbox"], [role="radio"], [role="treeitem"],
          summary, select, label[for],
          .clickable, .lis-btn, .cursor-pointer, [ng-reflect-router-link]
        ) * {
          cursor: url("${hand}") 10 5, pointer !important;
        }
      }`;
  }

  private cursorDataUri(svg: string): string {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  private getStorage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
