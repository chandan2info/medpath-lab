import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const STORAGE_KEY = 'medpath.customCursor.enabled';

@Injectable({ providedIn: 'root' })
export class CursorPreferenceService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = this.getStorage();
  readonly enabled = signal(this.readInitialValue());

  constructor() {
    this.apply(this.enabled());
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

  private readInitialValue(): boolean {
    try {
      const stored = this.storage?.getItem(STORAGE_KEY);
      return stored === null || stored === undefined ? true : stored === 'true';
    } catch {
      return true;
    }
  }

  private apply(enabled: boolean): void {
    this.document.documentElement.classList.toggle('cursor-custom-enabled', enabled);
  }

  private getStorage(): Storage | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  }
}
