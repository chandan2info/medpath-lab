import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'medpath.pdf.custom-settings.enabled';

function readEnabled(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class PdfPreferencesService {
  readonly customSettingsEnabled = signal(readEnabled());

  setCustomSettingsEnabled(enabled: boolean): void {
    this.customSettingsEnabled.set(enabled);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(enabled));
      }
    } catch {
      // Keep the in-memory preference if browser storage is unavailable.
    }
  }
}