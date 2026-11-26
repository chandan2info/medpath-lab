import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReportsDataService } from './reports-data.service';
import type { ReportRow } from './reports-data.service';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { PdfPreferencesService } from '../../core/services/pdf-preferences.service';

const PAGE_SIZE_OPTIONS = [5, 6, 7, 10] as const;
type ReportStatusFilter = 'all' | 'pending' | 'dispatched';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent {
  private readonly reportsData = inject(ReportsDataService);
  private readonly pdfPreferences = inject(PdfPreferencesService);
  readonly customPdfSettings = this.pdfPreferences.customSettingsEnabled;
  reports = this.reportsData.reports;
  selected = signal<ReportRow | null>(this.reports()[0] ?? null);
  previewExpanded = signal(false);
  showDispatchConfirm = signal(false);
  showPdfPreview = signal(false);
  pdfZoom = signal(85);
  pdfPaperSize = signal<'A4' | 'A3' | 'Letter' | 'Legal'>('A4');
  pdfOrientation = signal<'portrait' | 'landscape'>('portrait');
  pdfMargins = signal<'default' | 'narrow' | 'moderate' | 'wide'>('default');
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
    this.showDispatchConfirm.set(true);
  }

  cancelDispatch(): void {
    this.showDispatchConfirm.set(false);
  }

  confirmDispatch(): void {
    const report = this.selected();
    if (!report || report.status !== 'pending') {
      this.showDispatchConfirm.set(false);
      return;
    }

    this.reportsData.markAsDispatched(report.id);
    this.showDispatchConfirm.set(false);
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
    if (!this.selected()) return;
    this.showPdfPreview.set(true);
  }

  closePdfPreview(): void {
    this.showPdfPreview.set(false);
  }

  changePdfZoom(delta: number): void {
    this.pdfZoom.update(value => Math.min(120, Math.max(60, value + delta)));
  }

  setPdfPaperSize(value: string): void {
    if (['A4', 'A3', 'Letter', 'Legal'].includes(value)) {
      this.pdfPaperSize.set(value as 'A4' | 'A3' | 'Letter' | 'Legal');
    }
  }

  setPdfOrientation(value: string): void {
    if (value === 'portrait' || value === 'landscape') this.pdfOrientation.set(value);
  }

  setPdfMargins(value: string): void {
    if (['default', 'narrow', 'moderate', 'wide'].includes(value)) {
      this.pdfMargins.set(value as 'default' | 'narrow' | 'moderate' | 'wide');
    }
  }

  pdfPageWidth(): string {
    const sizes: Record<string, [number, number]> = {
      A4: [794, 1123], A3: [1123, 1587], Letter: [816, 1056], Legal: [816, 1344],
    };
    const [portraitWidth, portraitHeight] = sizes[this.customPdfSettings() ? this.pdfPaperSize() : 'A4'];
    const width = this.customPdfSettings() && this.pdfOrientation() === 'landscape' ? portraitHeight : portraitWidth;
    return `min(100%, ${width}px)`;
  }

  pdfPageAspectRatio(): string {
    const sizes: Record<string, [number, number]> = {
      A4: [794, 1123], A3: [1123, 1587], Letter: [816, 1056], Legal: [816, 1344],
    };
    const [portraitWidth, portraitHeight] = sizes[this.customPdfSettings() ? this.pdfPaperSize() : 'A4'];
    return this.customPdfSettings() && this.pdfOrientation() === 'landscape'
      ? `${portraitHeight} / ${portraitWidth}`
      : `${portraitWidth} / ${portraitHeight}`;
  }

  pdfPagePadding(): string {
    const marginMap = { default: '12mm', narrow: '6mm', moderate: '16mm', wide: '24mm' };
    return this.customPdfSettings() ? marginMap[this.pdfMargins()] : '12mm';
  }

  savePdfFromPreview(): void {
    const pageSize = this.customPdfSettings() ? this.pdfPaperSize() : 'A4';
    const orientation = this.customPdfSettings() ? this.pdfOrientation() : 'portrait';
    const marginMap = { default: '12mm', narrow: '6mm', moderate: '16mm', wide: '24mm' };
    const margin = this.customPdfSettings() ? marginMap[this.pdfMargins()] : '12mm';

    const previous = document.getElementById('reports-dynamic-print-settings');
    previous?.remove();
    const style = document.createElement('style');
    style.id = 'reports-dynamic-print-settings';
    style.textContent = `@page { size: ${pageSize} ${orientation}; margin: ${margin}; }`;
    document.head.appendChild(style);
    window.addEventListener('afterprint', () => style.remove(), { once: true });
    window.print();
  }

  printReport(): void {
    window.print();
  }
}
