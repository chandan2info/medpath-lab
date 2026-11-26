import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReportsDataService } from './reports-data.service';
import type { ReportRow } from './reports-data.service';
import { RouterLink } from '@angular/router';

const PAGE_SIZE_OPTIONS = [5, 6, 7, 10] as const;
type ReportStatusFilter = 'all' | 'pending' | 'dispatched';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent {
  private readonly reportsData = inject(ReportsDataService);
  reports = this.reportsData.reports;
  selected = signal<ReportRow | null>(this.reports()[0] ?? null);
  previewExpanded = signal(false);
  query = signal('');
  statusFilter = signal<ReportStatusFilter>('all');
  page = signal(1);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  pageSize = signal<number>(7);

  selectedDetail = computed(() => {
    const id = this.selected()?.id;
    return id ? this.reportsData.getReportDetail(id) : null;
  });

  filteredReports = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.reports().filter(r =>
      (status === 'all' || r.status === status) &&
      (!q || [r.patientName, r.patientId, r.test, r.id].some(value => value.toLowerCase().includes(q)))
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredReports().length / this.pageSize())));
  totalPagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  pagedReports = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredReports().slice(start, start + this.pageSize());
  });
  rangeStart = computed(() => this.filteredReports().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1);
  rangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredReports().length));
  listCountLabel = computed(() => {
    const count = this.filteredReports().length;
    const filter = this.statusFilter();
    if (filter === 'pending') return `${count} pending`;
    if (filter === 'dispatched') return `${count} dispatched`;
    return `${count} reports`;
  });

  setQuery(q: string): void {
    this.query.set(q);
    this.page.set(1);
    this.selectFirstVisible();
  }

  setStatusFilter(status: ReportStatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.selectFirstVisible();
  }

  setPageSize(size: number): void {
    if (!PAGE_SIZE_OPTIONS.includes(size as typeof PAGE_SIZE_OPTIONS[number])) return;
    this.pageSize.set(size);
    this.page.set(1);
    this.selectFirstVisible();
  }

  togglePreviewExpanded(): void {
    this.previewExpanded.update(expanded => !expanded);
  }

  selectReport(report: ReportRow): void {
    this.selected.set(report);
    this.previewExpanded.set(false);
  }

  markAsDispatched(): void {
    const report = this.selected();
    if (!report || report.status !== 'pending') return;
    const confirmed = window.confirm(`Mark report ${report.id} as dispatched? This demo action updates the local mock data only.`);
    if (!confirmed) return;

    this.reportsData.markAsDispatched(report.id);
    const updated = this.reports().find(item => item.id === report.id) ?? null;
    if (this.statusFilter() === 'pending') {
      this.selectFirstVisible();
    } else {
      this.selected.set(updated);
    }
  }

  private selectFirstVisible(): void {
    const first = this.pagedReports()[0] ?? null;
    this.selected.set(first);
    this.previewExpanded.set(false);
  }

  goToPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
    const first = this.pagedReports()[0];
    if (first) this.selected.set(first);
  }

  prevPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  downloadPdf(): void {
    // Browser print dialog supports Save as PDF without pretending a file was generated.
    window.print();
  }

  printReport(): void {
    window.print();
  }
}
