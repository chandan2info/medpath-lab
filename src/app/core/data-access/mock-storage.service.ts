import { Injectable } from '@angular/core';

/**
 * Browser-backed persistence for development/demo repositories only.
 *
 * This is deliberately an adapter boundary, not a production database.
 * Domain services should depend on repository contracts and use this store
 * only from mock implementations. API adapters can replace those mocks
 * without changing page components.
 */
interface StoredEnvelope<T> {
  schemaVersion: number;
  data: T;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class MockStorageService {
  private readonly schemaVersion = 1;

  read<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
    if (typeof localStorage === 'undefined') return this.clone(fallback);

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return this.clone(fallback);

      const parsed: unknown = JSON.parse(raw);
      const candidate = this.isEnvelope<T>(parsed) ? parsed.data : parsed;

      // Accept the previous un-enveloped mock format for backward compatibility.
      if (isValid(candidate)) return this.clone(candidate);
      return this.clone(fallback);
    } catch {
      // A corrupt demo cache must not prevent the UI from loading.
      return this.clone(fallback);
    }
  }

  write<T>(key: string, data: T): void {
    if (typeof localStorage === 'undefined') return;

    const envelope: StoredEnvelope<T> = {
      schemaVersion: this.schemaVersion,
      data: this.clone(data),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(key, JSON.stringify(envelope));
    } catch {
      throw new Error('Unable to persist demo data. Browser storage may be unavailable or full.');
    }
  }

  remove(key: string): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  }

  private isEnvelope<T>(value: unknown): value is StoredEnvelope<T> {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<StoredEnvelope<T>>;
    return typeof candidate.schemaVersion === 'number' && 'data' in candidate;
  }

  private clone<T>(value: T): T {
    if (value === undefined || value === null) return value;
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
