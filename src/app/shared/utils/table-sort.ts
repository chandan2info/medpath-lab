import { signal, Signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

/**
 * TableSort<T>
 * ────────────
 * Generic, reusable column-sort state for any HTML table.
 * One instance per table — works with any row shape.
 *
 * Usage in a component:
 *   protected readonly sort = new TableSort<TopTest>();
 *   protected readonly rows = computed(() => this.sort.apply(this.data.topTests()));
 *
 * Usage in the template (repeat per column):
 *   <th scope="col" [attr.aria-sort]="sort.ariaSort('orders')">
 *     <button type="button" class="th-sort"
 *       [class.th-sort--active]="sort.isActive('orders')"
 *       (click)="sort.toggle('orders')">
 *       Orders
 *       <i class="ti th-sort-icon"
 *          [class.ti-arrows-sort]="!sort.isActive('orders')"
 *          [class.ti-sort-ascending]="sort.isActive('orders') && sort.dir() === 'asc'"
 *          [class.ti-sort-descending]="sort.isActive('orders') && sort.dir() === 'desc'"
 *          aria-hidden="true"></i>
 *     </button>
 *   </th>
 */
export class TableSort<T> {
  private readonly _key = signal<keyof T | null>(null);
  private readonly _dir = signal<SortDirection>('asc');

  readonly key: Signal<keyof T | null> = this._key.asReadonly();
  readonly dir: Signal<SortDirection> = this._dir.asReadonly();

  /**
   * Per-column value extractors, for columns whose displayed field
   * isn't directly comparable — e.g. a "₹4,750" string column that
   * should sort by its numeric amount, not lexically.
   */
  constructor(
    initialKey: keyof T | null = null,
    initialDir: SortDirection = 'asc',
    private readonly accessors: Partial<Record<keyof T, (row: T) => string | number>> = {},
  ) {
    this._key.set(initialKey);
    this._dir.set(initialDir);
  }

  /** Click handler for a column header — 1st click sorts ascending, 2nd flips to descending. */
  toggle(column: keyof T): void {
    if (this._key() === column) {
      this._dir.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this._key.set(column);
      this._dir.set('asc');
    }
  }

  isActive(column: keyof T): boolean {
    return this._key() === column;
  }

  /** For [attr.aria-sort] on the <th> — screen readers announce the active sort. */
  ariaSort(column: keyof T): 'ascending' | 'descending' | 'none' {
    if (this._key() !== column) return 'none';
    return this._dir() === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Returns a new, sorted array — the source array is never mutated.
   * Numbers sort numerically; everything else sorts locale-aware
   * (so "Test 2" sorts before "Test 10"). Nullish values always sink
   * to the bottom, regardless of direction.
   */
  apply(rows: readonly T[]): T[] {
    const key = this._key();
    if (!key) return [...rows];
    const dir = this._dir() === 'asc' ? 1 : -1;

    const getValue = this.accessors[key];

    return [...rows].sort((a, b) => {
      const av = getValue ? getValue(a) : a[key];
      const bv = getValue ? getValue(b) : b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  }
}
