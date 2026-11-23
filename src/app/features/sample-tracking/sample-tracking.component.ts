// ─────────────────────────────────────────────
//  Screen 4b — Sample Tracking
//  Lab-wide operations dashboard: search, filter,
//  sort and drill into every sample in the queue.
//  (For the single-patient collection task screen
//  entered right after billing, see Screen 4a —
//  Sample Collection.)
// ─────────────────────────────────────────────
import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
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
  private readonly svc = inject(SampleTrackingService);

  protected readonly filterOpts  = FILTER_OPTS;

  searchQ        = signal('');
  activeFilter   = signal<SampleStatus | 'all' | 'stat-priority'>('all');
  selectedSample = signal<Sample | null>(null);
  actionError = signal('');

  constructor() {
    // Default the detail panel to the first row once the queue loads.
    const first = this.svc.samples()[0];
    if (first) this.selectedSample.set(first);
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
  }

  /** Drives a one-time 360° spin on the search clear (×) button when clicked
   *  — purely a tactile "cleared" acknowledgment, not a loading state. */
  clearSpin = signal(false);

  clearSearch(): void {
    this.searchQ.set('');
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
