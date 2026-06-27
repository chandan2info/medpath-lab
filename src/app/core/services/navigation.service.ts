import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavBadges } from '../../shared/models/lis.models';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly _badges$ = new BehaviorSubject<NavBadges>({
    billing:  0,
    reports:  0,
    tracking: 0,
  });

  readonly badges$ = this._badges$.asObservable();

  private readonly _badges = signal<NavBadges>(this._badges$.value);
  readonly badges = computed(() => this._badges());

  updateBadge(key: keyof NavBadges, value: number): void {
    const current = this._badges$.value;
    const updated = { ...current, [key]: value };
    this._badges$.next(updated);
    this._badges.set(updated);
  }

  /** Sync all badge counts from a fresh data snapshot */
  syncFromSnapshot(counts: Partial<NavBadges>): void {
    const merged = { ...this._badges$.value, ...counts };
    this._badges$.next(merged);
    this._badges.set(merged);
  }

  increment(key: keyof NavBadges): void {
    this.updateBadge(key, this._badges$.value[key] + 1);
  }

  decrement(key: keyof NavBadges): void {
    this.updateBadge(key, Math.max(0, this._badges$.value[key] - 1));
  }

  clearBadge(key: keyof NavBadges): void {
    this.updateBadge(key, 0);
  }
}
