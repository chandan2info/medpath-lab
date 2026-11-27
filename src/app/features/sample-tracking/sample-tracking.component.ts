// ─────────────────────────────────────────────
//  Screen 4b — Sample Tracking
//  Lab-wide operations dashboard: search, filter,
//  sort and drill into every sample in the queue.
//  (For the single-patient collection task screen
//  entered right after billing, see Screen 4a —
//  Sample Collection.)
// ─────────────────────────────────────────────
import { Component, signal, computed, ChangeDetectionStrategy, inject, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { Sample, SampleStatus } from '../../shared/models/lis.models';
import { TableSort } from '../../shared/utils/table-sort';
import { SampleTrackingService } from '../../core/services/sample-tracking.service';

/** Sortable projection of a Sample row — priority/status ranked so STAT/critical sort to the top. */
interface SampleRow extends Sample {
  prioritySortRank: number;
  statusSortRank: number;
}

const PRIORITY_RANK: Record<Sample['priority'], number> = { stat: 0, urgent: 1, routine: 2 };
const STATUS_RANK: Record<SampleStatus, number> = { critical: 0, rejected: 1, pending: 2, received: 3, processing: 4, ready: 5, dispatched: 6 };

const FILTER_OPTS: { label: string; value: SampleStatus | 'all' | 'stat-priority' }[] = [
  { label: 'All samples', value: 'all' },
  { label: 'STAT priority', value: 'stat-priority' },
  { label: 'Awaiting receipt', value: 'pending' },
  { label: 'Received', value: 'received' },
  { label: 'Processing', value: 'processing' },
  { label: 'Ready for entry', value: 'ready' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Critical', value: 'critical' },
];

@Component({
  selector: 'app-sample-tracking',
  standalone: true,
  imports: [RouterLink, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample-tracking.component.html',
  styleUrl: './sample-tracking.component.css',
})
export class SampleTrackingComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly svc = inject(SampleTrackingService);
  private readonly route = inject(ActivatedRoute);

  protected readonly filterOpts  = FILTER_OPTS;

  searchQ        = signal('');
  activeFilter   = signal<SampleStatus | 'all' | 'stat-priority'>('all');
  selectedSample = signal<Sample | null>(null);
  actionError = signal('');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const search = params.get('search')?.trim() ?? '';
      this.searchQ.set(search);
      const exactMatch = search
        ? this.svc.samples().find(sample => sample.id.toLowerCase() === search.toLowerCase())
        : undefined;
      const first = this.svc.samples()[0];
      this.selectedSample.set(exactMatch ?? (search ? null : first ?? null));
      this.syncSelectionToVisibleRows();
    });
  }

  formatCollectedAt(value: string): string {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(date);
    }
    return value;
  }

  /** Keep selection and available actions within the currently visible rows. */
  private syncSelectionToVisibleRows(): void {
    const visible = this.sortedSamples();
    const selectedId = this.selectedSample()?.id;
    if (selectedId && visible.some(sample => sample.id === selectedId)) return;
    this.selectedSample.set(visible[0] ?? null);
    this.actionError.set('');
  }

  updateSearch(value: string): void {
    this.searchQ.set(value);
    this.syncSelectionToVisibleRows();
  }

  setActiveFilter(filter: SampleStatus | 'all' | 'stat-priority'): void {
    this.activeFilter.set(filter);
    this.syncSelectionToVisibleRows();
  }

  /** Total samples in the queue, unfiltered — shown next to the filtered count so
   *  a user narrowing a search can tell the difference between "no matches" and
   *  "still loading". */
  totalCount = computed(() => this.svc.samples().length);

  filteredSamples = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQ().toLowerCase();
    return this.svc.samples().filter(s =>
      (f === 'all'
        || (f === 'stat-priority' && s.priority === 'stat')
        || s.status === f) &&
      (s.patientName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    );
  });

  // ── Column sorting ───────────────────────────────────────────
  protected readonly sort = new TableSort<SampleRow>('statusSortRank', 'asc');

  protected readonly sortedSamples = computed<SampleRow[]>(() => {
    const rows: SampleRow[] = this.filteredSamples().map(s => ({
      ...s,
      prioritySortRank: PRIORITY_RANK[s.priority],
      statusSortRank: STATUS_RANK[s.status],
    }));
    return this.sort.apply(rows);
  });

  focusSample(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'ArrowDown' && keyboardEvent.key !== 'ArrowUp') return;
    keyboardEvent.preventDefault();
    const direction: -1 | 1 = keyboardEvent.key === 'ArrowDown' ? 1 : -1;
    const root = this.host.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('.sample-tbl tbody tr[tabindex="0"]')) as HTMLElement[];
    const current = rows.indexOf(keyboardEvent.currentTarget as HTMLElement);
    const next = Math.max(0, Math.min(rows.length - 1, current + direction));
    rows[next]?.focus();
    const sample = this.sortedSamples()[next];
    if (sample) this.selectSample(sample);
  }

  selectSample(s: Sample): void { this.selectedSample.set(s); this.actionError.set(''); }

  private runSampleAction(action: (id: string) => Sample | undefined): void {
    const current = this.selectedSample();
    if (!current) return;
    this.actionError.set('');
    try {
      const updated = action(current.id);
      if (updated) this.selectedSample.set(updated);
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Unable to update sample status.');
    }
  }

  receiveSample(): void { this.runSampleAction(id => this.svc.receiveSample(id)); }
  startProcessing(): void { this.runSampleAction(id => this.svc.startProcessing(id)); }
  markReady(): void { this.runSampleAction(id => this.svc.updateStatus(id, 'ready')); }
  rejectSample(): void {
    const reason = window.prompt('Enter the specimen rejection reason:');
    if (!reason?.trim()) return;
    if (!window.confirm('Reject this specimen and return it for recollection?')) return;
    this.runSampleAction(id => this.svc.rejectSample(id, reason));
  }
  requestRecollection(): void { this.runSampleAction(id => this.svc.requestRecollection(id)); }
  canEnterResults(): boolean {
    const status = this.selectedSample()?.status;
    return status === 'ready' || status === 'critical';
  }

  /** Clears search text and resets the status/priority filter back to "All". */
  clearFilters(): void {
    this.searchQ.set('');
    this.activeFilter.set('all');
    this.syncSelectionToVisibleRows();
  }

  /** Drives a one-time 360° spin on the search clear (×) button when clicked
   *  — purely a tactile "cleared" acknowledgment, not a loading state. */
  clearSpin = signal(false);

  clearSearch(): void {
    this.updateSearch('');
    this.clearSpin.set(true);
    setTimeout(() => this.clearSpin.set(false), 350);
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  /** Header action: print labels for whatever's currently visible in the table. */
  printLabels(): void {
    window.print();
  }
}
