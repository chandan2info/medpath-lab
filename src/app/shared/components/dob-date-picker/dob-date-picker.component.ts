// ─────────────────────────────────────────────
//  Custom DOB Date Picker
//  Replaces the native <input type="date"> so the
//  calendar matches the app's design system instead
//  of the operating system's picker (dark theme,
//  rounded corners, card shadow, keyboard nav, and
//  a 10-year jump for fast date-of-birth entry).
// ─────────────────────────────────────────────
import {
  Component, ChangeDetectionStrategy, signal, computed,
  ElementRef, HostListener, forwardRef, input, inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const WEEKDAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface DayCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  disabled: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-dob-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DobDatePickerComponent),
    multi: true,
  }],
  templateUrl: './dob-date-picker.component.html',
  styleUrl: './dob-date-picker.component.css',
})
export class DobDatePickerComponent implements ControlValueAccessor {
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  /** ISO (yyyy-mm-dd) upper bound — DOB can't be in the future. */
  max = input<string>(new Date().toISOString().split('T')[0]);
  invalid = input<boolean>(false);
  inputId = input<string>('dob');

  open       = signal(false);
  mode       = signal<'days' | 'years'>('days');
  viewYear   = signal(new Date().getFullYear());
  viewMonth  = signal(new Date().getMonth()); // 0-11
  focusedIso = signal<string | null>(null);
  selectedIso = signal<string | null>(null);
  disabled   = signal(false);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly maxDate = computed(() => this.parseIso(this.max()) ?? new Date());

  readonly displayLabel = computed(() => {
    const iso = this.selectedIso();
    if (!iso) return '';
    const d = this.parseIso(iso)!;
    return `${String(d.getDate()).padStart(2,'0')} ${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  });

  readonly monthYearLabel = computed(() => `${MONTH_NAMES[this.viewMonth()]} ${this.viewYear()}`);

  readonly weekdayLabels = WEEKDAY_LABELS;

  readonly decadeStart = computed(() => Math.floor(this.viewYear() / 10) * 10);
  readonly decadeYears = computed(() => {
    const start = this.decadeStart() - 1; // show one year before/after for continuity
    return Array.from({ length: 12 }, (_, i) => start + i);
  });

  readonly days = computed<DayCell[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const max = this.maxDate();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const iso = this.toIso(d);
      const today = new Date();
      return {
        date: d,
        iso,
        inMonth: d.getMonth() === month,
        disabled: d > max,
        isToday: this.toIso(d) === this.toIso(today),
      };
    });
  });

  // ── ControlValueAccessor ──────────────────────────
  writeValue(value: string): void {
    this.selectedIso.set(value || null);
    const base = this.parseIso(value) ?? new Date();
    this.viewYear.set(base.getFullYear());
    this.viewMonth.set(base.getMonth());
    this.focusedIso.set(value || this.toIso(base));
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  // ── Panel open/close ──────────────────────────────
  togglePanel(): void {
    if (this.disabled()) return;
    this.open.update(v => !v);
    if (this.open()) this.mode.set('days');
  }

  closePanel(): void {
    this.open.set(false);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: MouseEvent): void {
    if (this.open() && !this.hostRef.nativeElement.contains(evt.target as Node)) {
      this.closePanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closePanel();
  }

  // ── Month navigation ──────────────────────────────
  shiftMonth(delta: number): void {
    let m = this.viewMonth() + delta;
    let y = this.viewYear();
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    this.viewMonth.set(m);
    this.viewYear.set(y);
  }

  // ── Year / decade navigation (10-year jump for DOB) ──
  openYearPicker(): void { this.mode.set('years'); }
  shiftDecade(delta: number): void { this.viewYear.update(y => y + delta * 10); }
  pickYear(y: number): void {
    this.viewYear.set(y);
    this.mode.set('days');
  }

  // ── Day selection ─────────────────────────────────
  selectDay(cell: DayCell): void {
    if (cell.disabled) return;
    this.selectedIso.set(cell.iso);
    this.focusedIso.set(cell.iso);
    this.onChange(cell.iso);
    this.closePanel();
  }

  // Arrow-key navigation across the day grid.
  onGridKeydown(evt: KeyboardEvent, cell: DayCell): void {
    const deltaMap: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      this.selectDay(cell);
      return;
    }
    const delta = deltaMap[evt.key];
    if (delta === undefined) return;
    evt.preventDefault();
    const next = new Date(cell.date);
    next.setDate(next.getDate() + delta);
    this.viewYear.set(next.getFullYear());
    this.viewMonth.set(next.getMonth());
    this.focusedIso.set(this.toIso(next));
    queueMicrotask(() => {
      const el = this.hostRef.nativeElement.querySelector(
        `[data-day-iso="${this.toIso(next)}"]`
      ) as HTMLElement | null;
      el?.focus();
    });
  }

  trackByIso = (_: number, cell: DayCell) => cell.iso;

  // ── Helpers ────────────────────────────────────────
  private toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  private parseIso(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const [y,m,d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m-1, d);
  }
}
