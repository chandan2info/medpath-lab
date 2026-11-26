import { Component, ChangeDetectionStrategy, computed, signal, inject, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';
import { ReportPreviewService } from '../../core/services/report-preview.service';
import { PatientHistoryService, HistoryPatientRecord, HistoryVisitRecord } from './services/patient-history.service';

type VisitRecord = HistoryVisitRecord;
type PatientRecord = HistoryPatientRecord;
interface PatientRow { patient: PatientRecord; latest: VisitRecord; }

@Component({
  selector: 'app-patient-history', standalone: true, imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-history.component.html', styleUrl: './patient-history.component.css',
})
export class PatientHistoryComponent {
  private readonly router = inject(Router);
  private readonly patientFlow = inject(PatientFlowService);
  private readonly workflowStore = inject(LabWorkflowMockService);
  private readonly reportPreview = inject(ReportPreviewService);
  private readonly historyService = inject(PatientHistoryService);
  get allPatients(): PatientRecord[] { return this.historyService.patients(); }
  readonly viewTabs = ['All Patients', 'By Patient', 'By Test', 'Trends & Analytics'];
  readonly detailTabs = ['History', 'Reports', 'Compare', 'Trends'];
  searchQ = signal('');
  selectedPatient = signal<PatientRecord | null>(null);
  activeView = signal('All Patients');
  activeDetailTab = signal('History');
  dateRange = signal('3months');
  testFilter = signal('all');
  resultFilter = signal('all');
  paymentFilter = signal('all');
  genderFilter = signal('all');
  doctorFilter = signal('all');
  abnormalOnly = signal(false);
  fromDate = signal('');
  toDate = signal('');
  menuPatientId = signal<string | null>(null);
  menuPosition = signal({ top: 0, left: 0 });
  notice = signal('');
  layout = signal<'list' | 'grid'>('list');
  selectedCompareOrders = signal<string[]>([]);
  trendParameter = signal('Haemoglobin');
  analyticsPatientId = signal('');
  analyticsPatient = computed(() => this.allPatients.find(p => p.id === this.analyticsPatientId()) ?? this.allPatients[0] ?? { id:'', name:'Select a patient', age:0, sex:'', mobile:'', initials:'', avatarClass:'', visits:[] });
  analyticsResultVisits = computed(() => this.analyticsPatient().visits.filter(visit => visit.results.length > 0).length);
  analyticsResultCount = computed(() => this.analyticsPatient().visits.reduce((count, visit) => count + visit.results.length, 0));
  countPatientTests(patient: PatientRecord): number { return patient.visits.reduce((sum, visit) => sum + visit.tests.length, 0); }
  page = signal(1);
  testPage = signal(1);
  pageSize = signal(10);
  moreFiltersOpen = false;

  availableTests = computed(() => [...new Set(this.allPatients.flatMap(p => p.visits.flatMap(v => v.tests)))].sort());
  availableDoctors = computed(() => [...new Set(this.allPatients.flatMap(p => p.visits.map(v => v.refDoctor)))].sort());
  filteredVisits = computed(() => {
    const now = new Date();
    const q = this.searchQ().trim().toLowerCase();
    const start = new Date(now);
    if (this.dateRange() === 'week') start.setDate(start.getDate() - 7);
    else if (this.dateRange() === 'month') start.setMonth(start.getMonth() - 1);
    else if (this.dateRange() === '3months') start.setMonth(start.getMonth() - 3);
    return this.allPatients.flatMap(patient => patient.visits.filter(visit => {
      const date = new Date(visit.dateValue + 'T00:00:00');
      const inDate = this.dateRange() === 'all' || (this.dateRange() === 'custom'
        ? (!this.fromDate() || visit.dateValue >= this.fromDate()) && (!this.toDate() || visit.dateValue <= this.toDate())
        : date >= start && date <= now);
      const matchesSearch = !q || [patient.name, patient.id, patient.mobile, visit.invoiceId, visit.orderId, ...visit.tests].some(value => value.toLowerCase().includes(q));
      const matchesTest = this.testFilter() === 'all' || visit.tests.includes(this.testFilter());
      const matchesResult = this.resultFilter() === 'all' || (this.resultFilter() === 'critical' ? visit.hasCritical : visit.resultStatus.toLowerCase() === this.resultFilter());
      const matchesPayment = this.paymentFilter() === 'all' || visit.paymentStatus.toLowerCase() === this.paymentFilter();
      const matchesGender = this.genderFilter() === 'all' || patient.sex.toLowerCase() === this.genderFilter();
      const matchesDoctor = this.doctorFilter() === 'all' || visit.refDoctor === this.doctorFilter();
      return inDate && matchesSearch && matchesTest && matchesResult && matchesPayment && matchesGender && matchesDoctor && (!this.abnormalOnly() || visit.hasCritical);
    }).map(visit => ({patient,visit}))).sort((a,b) => b.visit.dateValue.localeCompare(a.visit.dateValue));
  });
  filteredTestRows = computed(() => this.filteredVisits().flatMap(({ patient, visit }) =>
    visit.tests.map(test => ({ patient, visit, test }))
  ));
  filteredPatientRows = computed(() => {
    const map = new Map<string, PatientRow>();
    for (const item of this.filteredVisits()) {
      const current = map.get(item.patient.id);
      if (!current || item.visit.dateValue > current.latest.dateValue) map.set(item.patient.id,{patient:item.patient,latest:item.visit});
    }
    return [...map.values()].sort((a,b) => b.latest.dateValue.localeCompare(a.latest.dateValue));
  });
  pageRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredPatientRows().slice(start,start + this.pageSize());
  });
  pageCount = computed(() => Math.max(1,Math.ceil(this.filteredPatientRows().length / this.pageSize())));
  pageTestRows = computed(() => {
    const start = (this.testPage() - 1) * this.pageSize();
    return this.filteredTestRows().slice(start,start + this.pageSize());
  });
  testPageCount = computed(() => Math.max(1,Math.ceil(this.filteredTestRows().length / this.pageSize())));
  filteredPatientCount = computed(() => this.filteredPatientRows().length);
  filteredVisitCount = computed(() => this.filteredVisits().length);
  filteredTestCount = computed(() => this.filteredVisits().reduce((sum,item) => sum + item.visit.tests.length,0));
  completedCount = computed(() => this.filteredVisits().filter(item => item.visit.resultStatus === 'Completed').length);
  completionRate = computed(() => this.filteredVisitCount() ? Math.round(this.completedCount() / this.filteredVisitCount() * 100) : 0);
  totalTests = computed(() => this.selectedPatient()?.visits.reduce((sum,visit) => sum + visit.tests.length,0) ?? 0);
  criticalCount = computed(() => this.selectedPatient()?.visits.filter(visit => visit.hasCritical).length ?? 0);
  compareEligibleVisits = computed(() => (this.selectedPatient()?.visits ?? []).filter(visit => visit.results.length > 0));
  compareVisits = computed(() => (this.selectedPatient()?.visits ?? [])
    .filter(visit => this.selectedCompareOrders().includes(visit.invoiceId))
    .sort((a,b) => a.dateValue.localeCompare(b.dateValue)));
  compareRows = computed(() => {
    const visits = this.compareVisits();
    const params = [...new Set(visits.flatMap(visit => visit.results.map(result => result.parameter)))];
    return params.map(parameter => ({
      parameter,
      values: visits.map(visit => ({
        visit,
        result: visit.results.find(result => result.parameter === parameter) ?? null
      }))
    }));
  });
  trendPoints = computed(() => {
    const patient = this.activeView() === 'Trends & Analytics' ? this.analyticsPatient() : this.selectedPatient();
    return (patient?.visits ?? []).slice()
      .sort((a,b) => a.dateValue.localeCompare(b.dateValue))
      .map(visit => visit.results.find(result => result.parameter === this.trendParameter()) ?? null)
      .filter((result): result is NonNullable<typeof result> => !!result);
  });
  trendMin = computed(() => {
    const values = this.trendPoints().map(point => point.value);
    return values.length ? Math.min(...values) : 0;
  });
  trendMax = computed(() => {
    const values = this.trendPoints().map(point => point.value);
    return values.length ? Math.max(...values) : 1;
  });
  trendChartCoordinates = computed(() => {
    const points = this.trendPoints();
    const min = this.trendMin();
    const range = this.trendMax() === min ? 1 : this.trendMax() - min;
    const step = 250 / Math.max(1, points.length - 1);
    return points.map((point, index) => ({
      x: 40 + index * step,
      y: 130 - ((point.value - min) / range) * 95,
      label: point.date.slice(0, 6)
    }));
  });
  trendPolyline = computed(() => this.trendChartCoordinates().map(point => `${point.x},${point.y}`).join(' '));

  setDateRange(value: string): void { this.dateRange.set(value); this.page.set(1); this.testPage.set(1); }
  setActiveView(value: string): void {
    this.activeView.set(value);
    if (value === 'By Patient' && !this.selectedPatient() && this.allPatients.length) {
      this.selectPatient(this.allPatients[0]);
    }
    if (value === 'Trends & Analytics' && !this.analyticsPatientId() && this.allPatients.length) {
      this.analyticsPatientId.set(this.allPatients[0].id);
      this.trendParameter.set(this.availableParametersForAnalytics()[0] ?? '');
    }
  }
  setAnalyticsPatient(id: string): void { this.analyticsPatientId.set(id); this.trendParameter.set(this.availableParametersForAnalytics()[0] ?? ''); }
  availableParametersForAnalytics = computed(() => [...new Set(this.analyticsPatient().visits.flatMap(v => v.results.map(r => r.parameter)))].sort());
  selectPatient(patient: PatientRecord): void {
    this.selectedPatient.set(patient);
    this.activeDetailTab.set('History');
    this.selectedCompareOrders.set([]);
    this.menuPatientId.set(null);
    if (this.activeView() !== 'Trends & Analytics') {
      const parameters = [...new Set(patient.visits.flatMap(visit => visit.results.map(result => result.parameter)))].sort();
      if (!parameters.includes(this.trendParameter())) this.trendParameter.set(parameters[0] ?? '');
    }
  }
  openPatientReport(patient: PatientRecord, visit: VisitRecord, reprint = false): void { this.selectPatient(patient); this.openReport(visit, reprint); }
  openPatientInvoice(patient: PatientRecord, visit: VisitRecord): void { this.selectPatient(patient); this.showInvoice(visit); }
  toggleActionMenu(patientId: string, event: MouseEvent): void {
    if (this.menuPatientId() === patientId) { this.menuPatientId.set(null); return; }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.menuPosition.set({ top: Math.max(12, Math.min(rect.bottom + 6, window.innerHeight - 280)), left: Math.max(12, Math.min(rect.right - 205, window.innerWidth - 217)) });
    this.menuPatientId.set(patientId);
  }
  @HostListener('document:click') closeActionMenu(): void { this.menuPatientId.set(null); }
  @HostListener('document:scroll') closeActionMenuOnScroll(): void { this.menuPatientId.set(null); }
  @HostListener('document:keydown.escape') closeActionMenuOnEscape(): void { this.menuPatientId.set(null); this.closeInvoice(); }
  resetPagination(): void { this.page.set(1); this.testPage.set(1); }
  setSearch(value: string): void { this.searchQ.set(value); this.page.set(1); this.testPage.set(1); }
  setPageSize(value: number): void { this.pageSize.set(value); this.page.set(1); this.testPage.set(1); }
  setTestPage(page: number): void { this.testPage.set(Math.min(Math.max(1,page),this.testPageCount())); }
  resetFilters(): void {
    this.searchQ.set(''); this.dateRange.set('3months'); this.testFilter.set('all'); this.resultFilter.set('all');
    this.paymentFilter.set('all'); this.genderFilter.set('all'); this.doctorFilter.set('all');
    this.abnormalOnly.set(false); this.fromDate.set(''); this.toDate.set(''); this.page.set(1); this.testPage.set(1);
  }
  toggleCompare(orderId: string, checked: boolean): void {
    this.selectedCompareOrders.update(ids => checked ? (ids.length < 3 ? [...ids,orderId] : ids) : ids.filter(id => id !== orderId));
  }
  openReport(visit: VisitRecord, reprint = false): void {
    const report = this.workflowStore.reports().find(item => item.id === visit.reportId && item.sampleId === visit.sampleId);
    const sample = this.workflowStore.samples().find(item => item.id === visit.sampleId);
    const result = this.workflowStore.results().find(item => item.sampleId === visit.sampleId && item.status === 'validated');
    const order = this.workflowStore.orders().find(item => item.id === visit.orderId);
    const patient = this.selectedPatient();
    if (!report || !sample || !result || !order || !patient) { this.notice.set('No finalized report is available for this order.'); return; }
    const params = Object.entries(result.values).map(([name, value], index) => ({
      id: 'result-' + index, name, value: String(value), unit: '', refLow: null, refHigh: null,
      refLabel: 'Not recorded', flag: 'normal' as const
    }));
    this.reportPreview.stage({
      patientName: patient.name, patientId: patient.id,
      ageGender: patient.age ? patient.age + ' years / ' + patient.sex : patient.sex,
      referredBy: visit.refDoctor, sampleId: sample.id,
      sampleType: sample.specimenGroups.map(group => group.sampleType).join(', '),
      collectedAt: sample.collectedAt, reportedAt: report.generatedAt,
      priority: order.priority === 'stat' ? 'STAT' : 'Routine',
      testName: visit.tests.join(', '), testCode: visit.tests.join(', '), department: 'Laboratory',
      criticalNote: null, params, reportDate: new Date(report.generatedAt).toLocaleDateString('en-GB'),
      verifyUrl: report.id, invoiceId: visit.invoiceRecordId ?? visit.orderId,
      showRefRange: false, showFlags: false, showNotes: false
    });
    this.activeDetailTab.set('Reports');
    this.router.navigate(['/dashboard/report-preview'], { state: { printAfterOpen: reprint, reportId: report.id } });
  }
  startNewOrder(patient: PatientRecord): void {
    const [firstName, ...lastName] = patient.name.split(' ');
    this.patientFlow.registerPatient({
      firstName, lastName: lastName.join(' '), dob: '', ageYears: String(patient.age), gender: patient.sex,
      bloodGroup: '', mobile: patient.mobile.replace(/\D/g, '').slice(-10), email: '', address: '',
      refDoctor: '', visitType: 'Repeat', fasting: 'No', collection: 'Lab', clinicalNotes: '', medications: ''
    }, patient.id);
    this.router.navigate(['/dashboard/test-order']);
  }
  selectedInvoice = signal<import('../../core/services/lab-workflow-mock.service').MockInvoice | null>(null);
  showInvoice(visit: VisitRecord): void {
    const invoice = this.workflowStore.invoices().find(item => item.id === visit.invoiceRecordId && item.orderId === visit.orderId);
    if (!invoice) { this.notice.set('No invoice has been generated for this order yet.'); return; }
    this.selectedInvoice.set(invoice);
  }
  closeInvoice(): void { this.selectedInvoice.set(null); }
  printInvoice(): void { if (this.selectedInvoice()) window.print(); }
  setPage(page: number): void { this.page.set(Math.min(Math.max(1,page),this.pageCount())); }
  exportCsv(): void {
    const rows = [['Patient','UHID','Mobile','Gender','Referring doctor','Visit date','Invoice ID','Order ID','Test','Result status','Payment status','Amount'],
      ...this.filteredTestRows().map(({patient,visit,test}) => [
        patient.name, patient.id, patient.mobile, patient.sex, visit.refDoctor, visit.date,
        visit.invoiceId, visit.orderId, test, visit.resultStatus, visit.paymentStatus, String(visit.amount)
      ])];
    const csv = rows.map(row => row.map(value => '"' + String(value ?? '').replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'patient-history.csv'; document.body.appendChild(anchor);
    anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}