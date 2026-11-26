import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

type ReportStatus = 'pending' | 'dispatched';
type ResultFlag = 'high' | 'low' | 'critical' | 'normal';

interface ResultRow {
  name: string;
  result: string;
  unit: string;
  ref: string;
  flag: ResultFlag;
}

interface ReportRow {
  id: string;
  patientName: string;
  patientId: string;
  test: string;
  date: string;
  status: ReportStatus;
}

interface ReportDetail {
  patientAgeSex: string;
  collectedOn: string;
  referredBy: string;
  reportedOn: string;
  testTitle: string;
  sampleId: string;
  note: string;
  specimen: string;
  fasting: string;
  groupTitle: string;
  rows: ResultRow[];
  authorisedBy: string;
  qualification: string;
}

interface ReportStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  variant: 'primary' | 'warning' | 'success' | 'danger';
  delta: string;
  deltaType: 'up' | 'down' | 'neutral';
  spark: string;
}

const REPORTS: ReportRow[] = [
  { id: 'RPT-2406-041', patientName: 'Arun Pillai',  patientId: 'PAT-2406-0316', test: 'KFT',            date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-040', patientName: 'Priya Sharma', patientId: 'PAT-2406-0315', test: 'Thyroid panel',  date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-039', patientName: 'Deepak Rao',   patientId: 'PAT-2406-0321', test: 'Blood glucose', date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-038', patientName: 'Anjali Verma', patientId: 'PAT-2406-0312', test: 'CBC + ESR',      date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-037', patientName: 'Rajan Iyer',   patientId: 'PAT-2406-0309', test: 'HbA1c',         date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-033', patientName: 'Meena Joshi',  patientId: 'PAT-2406-0302', test: 'LFT',           date: '22 Jun 2026', status: 'dispatched' },
  { id: 'RPT-2406-030', patientName: 'Suresh Menon', patientId: 'PAT-2406-0317', test: 'Lipid profile',date: '22 Jun 2026', status: 'dispatched' },
];

// Explicitly illustrative demo values. Each list row has a matching preview record.
const REPORT_DETAILS: Record<string, ReportDetail> = {
  'RPT-2406-041': {
    patientAgeSex: '61 years / Male', collectedOn: '23 Jun 2026 · 9:20 AM',
    referredBy: 'Dr. Suresh Menon', reportedOn: '23 Jun 2026 · 11:05 AM',
    testTitle: 'Kidney Function Test (KFT)', sampleId: 'SMP-2406-087',
    note: 'Critical value — Serum Potassium (K⁺) is significantly elevated. Referring physician has been notified.',
    specimen: 'Serum (Red top SST)', fasting: 'Non-fasting', groupTitle: 'Biochemistry — Renal profile',
    rows: [
      { name: 'Serum creatinine', result: '2.4', unit: 'mg/dL', ref: '0.7 – 1.3', flag: 'high' },
      { name: 'Blood urea nitrogen', result: '48', unit: 'mg/dL', ref: '7 – 20', flag: 'high' },
      { name: 'Serum potassium (K⁺)', result: '6.8', unit: 'mEq/L', ref: '3.5 – 5.0', flag: 'critical' },
      { name: 'Serum sodium (Na⁺)', result: '138', unit: 'mEq/L', ref: '136 – 145', flag: 'normal' },
      { name: 'Serum uric acid', result: '5.2', unit: 'mg/dL', ref: '3.5 – 7.2', flag: 'normal' },
      { name: 'eGFR (CKD-EPI)', result: '32', unit: 'mL/min', ref: '≥ 60', flag: 'low' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-040': {
    patientAgeSex: '34 years / Female', collectedOn: '23 Jun 2026 · 8:45 AM',
    referredBy: 'Dr. Kavita Rao', reportedOn: '23 Jun 2026 · 10:30 AM',
    testTitle: 'Thyroid Profile', sampleId: 'SMP-2406-086',
    note: 'Thyroid profile results are within the supplied reference ranges.',
    specimen: 'Serum', fasting: 'Not required', groupTitle: 'Immunoassay — Thyroid profile',
    rows: [
      { name: 'T3', result: '1.2', unit: 'ng/mL', ref: '0.8 – 2.0', flag: 'normal' },
      { name: 'T4', result: '8.1', unit: 'µg/dL', ref: '5.1 – 14.1', flag: 'normal' },
      { name: 'TSH', result: '2.4', unit: 'µIU/mL', ref: '0.4 – 4.5', flag: 'normal' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-039': {
    patientAgeSex: '45 years / Male', collectedOn: '23 Jun 2026 · 9:05 AM',
    referredBy: 'Dr. Amit Verma', reportedOn: '23 Jun 2026 · 10:15 AM',
    testTitle: 'Blood Glucose', sampleId: 'SMP-2406-085',
    note: 'Fasting glucose result is above the supplied reference range.',
    specimen: 'Fluoride plasma', fasting: 'Fasting', groupTitle: 'Biochemistry — Glucose',
    rows: [
      { name: 'Fasting blood glucose', result: '132', unit: 'mg/dL', ref: '70 – 99', flag: 'high' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-038': {
    patientAgeSex: '29 years / Female', collectedOn: '23 Jun 2026 · 8:30 AM',
    referredBy: 'Dr. Neha Shah', reportedOn: '23 Jun 2026 · 11:20 AM',
    testTitle: 'Complete Blood Count (CBC) + ESR', sampleId: 'SMP-2406-084',
    note: 'Haemoglobin is slightly below the supplied reference range.',
    specimen: 'EDTA whole blood', fasting: 'Not required', groupTitle: 'Haematology — CBC + ESR',
    rows: [
      { name: 'Haemoglobin', result: '11.2', unit: 'g/dL', ref: '12.0 – 15.0', flag: 'low' },
      { name: 'Total WBC count', result: '7,400', unit: '/µL', ref: '4,000 – 11,000', flag: 'normal' },
      { name: 'Platelet count', result: '2.6', unit: 'lakh/µL', ref: '1.5 – 4.5', flag: 'normal' },
      { name: 'ESR', result: '24', unit: 'mm/hr', ref: '0 – 20', flag: 'high' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-037': {
    patientAgeSex: '52 years / Male', collectedOn: '23 Jun 2026 · 9:15 AM',
    referredBy: 'Dr. Suresh Menon', reportedOn: '23 Jun 2026 · 10:45 AM',
    testTitle: 'HbA1c', sampleId: 'SMP-2406-083',
    note: 'HbA1c is above the supplied reference range.',
    specimen: 'EDTA whole blood', fasting: 'Not required', groupTitle: 'Biochemistry — Glycated haemoglobin',
    rows: [
      { name: 'HbA1c', result: '7.2', unit: '%', ref: 'Below 5.7', flag: 'high' },
      { name: 'Estimated average glucose', result: '160', unit: 'mg/dL', ref: 'Interpret with HbA1c', flag: 'high' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-033': {
    patientAgeSex: '40 years / Female', collectedOn: '22 Jun 2026 · 9:10 AM',
    referredBy: 'Dr. Kavita Rao', reportedOn: '22 Jun 2026 · 11:00 AM',
    testTitle: 'Liver Function Test (LFT)', sampleId: 'SMP-2406-079',
    note: 'Liver function results are within the supplied reference ranges.',
    specimen: 'Serum', fasting: 'Not required', groupTitle: 'Biochemistry — Hepatic profile',
    rows: [
      { name: 'Total bilirubin', result: '0.8', unit: 'mg/dL', ref: '0.2 – 1.2', flag: 'normal' },
      { name: 'ALT (SGPT)', result: '28', unit: 'U/L', ref: '7 – 35', flag: 'normal' },
      { name: 'AST (SGOT)', result: '25', unit: 'U/L', ref: '8 – 35', flag: 'normal' },
      { name: 'Alkaline phosphatase', result: '82', unit: 'U/L', ref: '44 – 147', flag: 'normal' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-030': {
    patientAgeSex: '58 years / Male', collectedOn: '22 Jun 2026 · 8:55 AM',
    referredBy: 'Dr. Amit Verma', reportedOn: '22 Jun 2026 · 10:50 AM',
    testTitle: 'Lipid Profile', sampleId: 'SMP-2406-076',
    note: 'Total cholesterol and LDL cholesterol are above the supplied reference ranges.',
    specimen: 'Serum', fasting: 'Fasting', groupTitle: 'Biochemistry — Lipid profile',
    rows: [
      { name: 'Total cholesterol', result: '228', unit: 'mg/dL', ref: 'Below 200', flag: 'high' },
      { name: 'LDL cholesterol', result: '148', unit: 'mg/dL', ref: 'Below 100', flag: 'high' },
      { name: 'HDL cholesterol', result: '52', unit: 'mg/dL', ref: 'Above 40', flag: 'normal' },
      { name: 'Triglycerides', result: '140', unit: 'mg/dL', ref: 'Below 150', flag: 'normal' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
};

const PAGE_SIZE = 5;
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
  protected readonly reports = REPORTS;
  selected = signal<ReportRow | null>(REPORTS[0]);
  query = signal('');
  statusFilter = signal<ReportStatusFilter>('all');
  page = signal(1);
  readonly pageSize = PAGE_SIZE;

  selectedDetail = computed(() => {
    const id = this.selected()?.id;
    return id ? REPORT_DETAILS[id] ?? null : null;
  });

  filteredReports = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.reports.filter(r =>
      (status === 'all' || r.status === status) &&
      (!q || [r.patientName, r.patientId, r.test, r.id].some(value => value.toLowerCase().includes(q)))
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredReports().length / PAGE_SIZE)));
  totalPagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  pagedReports = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredReports().slice(start, start + PAGE_SIZE);
  });
  rangeStart = computed(() => this.filteredReports().length === 0 ? 0 : (this.currentPage() - 1) * PAGE_SIZE + 1);
  rangeEnd = computed(() => Math.min(this.currentPage() * PAGE_SIZE, this.filteredReports().length));
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

  selectReport(report: ReportRow): void {
    this.selected.set(report);
  }

  private selectFirstVisible(): void {
    const first = this.filteredReports()[0] ?? null;
    if (!first || !this.filteredReports().some(r => r.id === this.selected()?.id)) {
      this.selected.set(first);
    }
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
