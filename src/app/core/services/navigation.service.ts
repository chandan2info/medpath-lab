import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavBadges } from '../../shared/models/lis.models';

/**
 * NavigationService
 * Drives the live badge counts on the sidebar via a BehaviorSubject so any
 * feature can push updates (e.g., new sample arrives → tracking badge ++)
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly _badges$ = new BehaviorSubject<NavBadges>({
    billing:  3,
    reports:  5,
    tracking: 8,
  });

  /** Observable stream — sidebar subscribes via async pipe */
  readonly badges$ = this._badges$.asObservable();

  /** Convenience signals for OnPush components */
  private readonly _badges = signal<NavBadges>(this._badges$.value);
  readonly badges = computed(() => this._badges());

  updateBadge(key: keyof NavBadges, value: number): void {
    const current = this._badges$.value;
    const updated = { ...current, [key]: value };
    this._badges$.next(updated);
    this._badges.set(updated);
  }

  increment(key: keyof NavBadges): void {
    this.updateBadge(key, this._badges$.value[key] + 1);
  }

  decrement(key: keyof NavBadges): void {
    const v = Math.max(0, this._badges$.value[key] - 1);
    this.updateBadge(key, v);
  }

  clearBadge(key: keyof NavBadges): void {
    this.updateBadge(key, 0);
  }
}
