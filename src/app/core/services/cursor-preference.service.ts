import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const STORAGE_KEY = 'medpath.customCursor.enabled';
const COLOR_KEY = 'medpath.customCursor.color';
const DEFAULT_COLOR = '#8b5cf6';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

@Injectable({ providedIn: 'root' })
export class CursorPreferenceService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = this.getStorage();
  private colorStyle?: HTMLStyleElement;

  readonly enabled = signal(this.readEnabled());
  readonly color = signal(this.readColor());

  constructor() {
    this.apply(this.enabled());
    this.applyColor(this.color());

    const view = this.document.defaultView;
    if (view) {
      const onStorage = (event: StorageEvent): void => {
        if (event.key !== null && event.key !== STORAGE_KEY && event.key !== COLOR_KEY) return;

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

  private applyColor(color: string): void {
    const arrow = this.cursorDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M5 3 L5 25 L11 19 L16 29 L21 26 L16 16 L25 16 Z" fill="${color}" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/></svg>`
    );
    const hand = this.cursorDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M12 2.5 C10.9 2.5 10 3.4 10 4.5 V14 L8.1 12.1 C7.3 11.3 6 11.3 5.2 12.1 C4.4 12.9 4.4 14.2 5.2 15 L12.2 22 C13.4 23.2 15 23.8 16.7 23.8 H18 C21.3 23.8 24 21.1 24 17.8 V11 C24 9.9 23.1 9 22 9 C21.4 9 20.9 9.3 20.5 9.7 C20.2 8.7 19.3 8 18.3 8 C17.7 8 17.2 8.3 16.8 8.7 C16.5 7.7 15.6 7 14.6 7 C14 7 13.5 7.3 13.1 7.7 V4.5 C13.1 3.4 12 2.5 12 2.5 Z" fill="${color}" stroke="#ffffff" stroke-width="1.7" stroke-linejoin="round"/></svg>`
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
          cursor: url("${arrow}") 4 3, auto !important;
        }
        html.cursor-custom-enabled body :is(
          a, button:not(:disabled), [role="button"], [role="tab"], [role="menuitem"],
          [role="option"], [role="link"], [role="switch"], [role="checkbox"],
          [role="radio"], [role="treeitem"], summary, select, label[for],
          input[type="button"], input[type="submit"], input[type="reset"],
          input[type="checkbox"], input[type="radio"], input[type="range"],
          .clickable, .lis-btn, [ng-reflect-router-link]
        ),
        html.cursor-custom-enabled body :is(
          a, button:not(:disabled), [role="button"], [role="tab"], [role="menuitem"],
          [role="option"], [role="link"], [role="switch"], [role="checkbox"],
          [role="radio"], [role="treeitem"], summary, select, label[for],
          .clickable, .lis-btn, [ng-reflect-router-link]
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
