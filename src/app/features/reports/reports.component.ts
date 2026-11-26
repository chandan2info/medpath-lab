import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

interface ReportRow {
  id: string; patientName: string; patientId: string;
  test: string; date: string; status: 'pending' | 'dispatched';
}

interface ReportStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  variant: 'primary' | 'warning' | 'success' | 'danger';
  delta: string;
  deltaType: 'up' | 'down' | 'neutral';
  spark: string; // normalized 0-100 points, space separated "x,y x,y ..."
}

const REPORT_STATS: ReportStat[] = [
  { id: 'total',      label: 'Total Reports',   value: '1,248', icon: 'file-text',      variant: 'primary', delta: '+12.5% vs last month', deltaType: 'up',      spark: '0,28 16,24 32,26 48,18 64,20 80,10 100,6' },
  { id: 'pending',    label: 'Pending Reports', value: '5',     icon: 'hourglass',      variant: 'warning', delta: 'Needs attention',       deltaType: 'neutral', spark: '0,20 16,10 32,16 48,8 64,18 80,12 100,4' },
  { id: 'dispatched', label: 'Dispatched',      value: '320',   icon: 'circle-check',   variant: 'success',  delta: '+8.2% vs last month',   deltaType: 'up',      spark: '0,26 16,22 32,24 48,14 64,18 80,8 100,10' },
  { id: 'critical',   label: 'Critical Alerts', value: '12',    icon: 'alert-triangle', variant: 'danger',  delta: 'Requires follow-up',    deltaType: 'down',    spark: '0,10 16,18 32,12 48,22 64,14 80,24 100,18' },
];

const REPORTS: ReportRow[] = [
  { id:'RPT-2406-041', patientName:'Arun Pillai',   patientId:'PAT-0316', test:'KFT',          date:'23 Jun 2026', status:'pending' },
  { id:'RPT-2406-040', patientName:'Priya Sharma',  patientId:'PAT-0315', test:'Thyroid panel', date:'23 Jun 2026', status:'pending' },
  { id:'RPT-2406-039', patientName:'Deepak Rao',    patientId:'PAT-0321', test:'Blood glucose', date:'23 Jun 2026', status:'pending' },
  { id:'RPT-2406-038', patientName:'Anjali Verma',  patientId:'PAT-0312', test:'CBC + ESR',     date:'23 Jun 2026', status:'pending' },
  { id:'RPT-2406-037', patientName:'Rajan Iyer',    patientId:'PAT-0309', test:'HbA1c',         date:'23 Jun 2026', status:'pending' },
  { id:'RPT-2406-033', patientName:'Meena Joshi',   patientId:'PAT-0302', test:'LFT',           date:'22 Jun 2026', status:'dispatched' },
  { id:'RPT-2406-030', patientName:'Suresh Menon',  patientId:'PAT-0317', test:'Lipid profile', date:'22 Jun 2026', status:'dispatched' },
];

const KFT_ROWS = [
  { name:'Serum creatinine',    result:'2.4', unit:'mg/dL',  ref:'0.7 – 1.3',  flag:'high'     },
  { name:'Blood urea nitrogen', result:'48',  unit:'mg/dL',  ref:'7 – 20',     flag:'high'     },
  { name:'Serum potassium (K⁺)',result:'6.8', unit:'mEq/L',  ref:'3.5 – 5.0',  flag:'critical' },
  { name:'Serum sodium (Na⁺)',  result:'138', unit:'mEq/L',  ref:'136 – 145',  flag:'normal'   },
  { name:'Serum uric acid',     result:'5.2', unit:'mg/dL',  ref:'3.5 – 7.2',  flag:'normal'   },
  { name:'eGFR (CKD-EPI)',      result:'32',  unit:'mL/min', ref:'≥ 60',       flag:'low'      },
];

const PAGE_SIZE = 5;
type ReportStatusFilter = 'all' | 'pending' | 'dispatched';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.css',
})
export class ReportsComponent {
  protected readonly reports  = REPORTS;
  protected readonly kftRows  = KFT_ROWS;
  protected readonly stats    = REPORT_STATS;
  selected = signal<ReportRow | null>(REPORTS[0]);
  query = signal('');
  statusFilter = signal<ReportStatusFilter>('all');
  page = signal(1);
  readonly pageSize = PAGE_SIZE;

  /** Text + status filtered, but not yet paginated — used for the "N pending" badge and page-count math. */
  filteredReports = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.reports.filter(r =>
      (status === 'all' || r.status === status) &&
      (!q || r.patientName.toLowerCase().includes(q) || r.test.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredReports().length / PAGE_SIZE)));
  totalPagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  /** Clamp so an out-of-range page (e.g. after a filter shrinks the result set) never shows a blank list. */
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  pagedReports = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredReports().slice(start, start + PAGE_SIZE);
  });

  rangeStart = computed(() => this.filteredReports().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1);
  rangeEnd   = computed(() => Math.min(this.currentPage() * PAGE_SIZE, this.filteredReports().length));

  pendingCount = computed(() => this.reports.filter(r => r.status === 'pending').length);

  setQuery(q: string): void {
    this.query.set(q);
    this.page.set(1); // any new search starts back at page 1
  }

  setStatusFilter(status: ReportStatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
  }

  goToPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
  }

  prevPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }

  initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0,2); }
}
