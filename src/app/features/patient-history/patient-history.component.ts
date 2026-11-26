import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PatientFlowService } from '../../core/services/patient-flow.service';

interface VisitRecord {
  date: string; time: string; dateValue: string; invoiceId: string; tests: string[];
  refDoctor: string; amount: number; keyFinding: string; hasCritical: boolean;
  resultStatus: 'Completed' | 'Pending'; paymentStatus: 'Paid' | 'Unpaid';
  reports: { name: string; status: 'Available' | 'Pending' }[];
  results: { parameter: string; value: number; unit: string; reference: string; date: string }[];
}
interface PatientRecord {
  id: string; name: string; age: number; sex: string; mobile: string;
  initials: string; avatarClass: string; visits: VisitRecord[];
}
interface PatientRow { patient: PatientRecord; latest: VisitRecord; }

const PATIENTS: PatientRecord[] = [
  { id:'PAT-0316', name:'Arun Pillai', age:61, sex:'Male', mobile:'+91 98xxx316', initials:'AP', avatarClass:'av-t', visits:[
    {date:'25 Nov 2026',time:'10:24 AM',dateValue:'2026-11-25',invoiceId:'ORD-016832',tests:['CBC','KFT'],refDoctor:'Dr. Suresh Menon',amount:600,keyFinding:'K⁺ 6.8 mEq/L — Critical ↑↑',hasCritical:true,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'CBC',status:'Available'},{name:'KFT',status:'Available'}],results:[{parameter:'Haemoglobin',value:13.8,unit:'g/dL',reference:'13.0–17.0',date:'25 Nov 2026'},{parameter:'Total WBC',value:7200,unit:'/µL',reference:'4,000–11,000',date:'25 Nov 2026'},{parameter:'Platelets',value:2.35,unit:'lakh/µL',reference:'1.50–4.50',date:'25 Nov 2026'},{parameter:'Creatinine',value:1.9,unit:'mg/dL',reference:'0.7–1.3',date:'25 Nov 2026'}]},
    {date:'10 Oct 2026',time:'05:12 PM',dateValue:'2026-10-10',invoiceId:'ORD-015901',tests:['Lipid Profile'],refDoctor:'Dr. Suresh Menon',amount:700,keyFinding:'Creatinine 1.9 mg/dL ↑',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'Lipid Profile',status:'Available'}],results:[{parameter:'Haemoglobin',value:12.9,unit:'g/dL',reference:'13.0–17.0',date:'10 Oct 2026'},{parameter:'Total WBC',value:6800,unit:'/µL',reference:'4,000–11,000',date:'10 Oct 2026'},{parameter:'Platelets',value:1.98,unit:'lakh/µL',reference:'1.50–4.50',date:'10 Oct 2026'}]},
    {date:'15 Aug 2026',time:'11:03 AM',dateValue:'2026-08-15',invoiceId:'ORD-014221',tests:['CBC','LFT'],refDoctor:'Dr. Pradeep Iyer',amount:1500,keyFinding:'All within normal range',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'CBC',status:'Available'},{name:'LFT',status:'Available'}],results:[{parameter:'Haemoglobin',value:12.4,unit:'g/dL',reference:'13.0–17.0',date:'15 Aug 2026'}]}
  ]},
  { id:'PAT-0318', name:'Kavitha Nair', age:34, sex:'Female', mobile:'+91 99xxx318', initials:'KN', avatarClass:'av-b', visits:[
    {date:'24 Nov 2026',time:'05:12 PM',dateValue:'2026-11-24',invoiceId:'ORD-016811',tests:['Thyroid Profile'],refDoctor:'Dr. Suresh Menon',amount:750,keyFinding:'TSH within reference range',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'Thyroid Profile',status:'Available'}],results:[{parameter:'TSH',value:3.2,unit:'µIU/mL',reference:'0.4–4.5',date:'24 Nov 2026'}]},
    {date:'10 Oct 2026',time:'09:15 AM',dateValue:'2026-10-10',invoiceId:'ORD-015822',tests:['CBC','ESR'],refDoctor:'Dr. Anita Rao',amount:280,keyFinding:'All within normal range',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'CBC',status:'Available'}],results:[{parameter:'TSH',value:3.6,unit:'µIU/mL',reference:'0.4–4.5',date:'10 Oct 2026'}]}
  ]},
  { id:'PAT-0315', name:'Priya Sharma', age:29, sex:'Female', mobile:'+91 98xxx315', initials:'PS', avatarClass:'av-p', visits:[
    {date:'23 Nov 2026',time:'11:03 AM',dateValue:'2026-11-23',invoiceId:'ORD-016790',tests:['Thyroid Profile'],refDoctor:'Dr. Anita Rao',amount:700,keyFinding:'TSH 8.2 mIU/L ↑',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'Thyroid Profile',status:'Available'}],results:[{parameter:'TSH',value:8.2,unit:'µIU/mL',reference:'0.4–4.5',date:'23 Nov 2026'}]}
  ]},
  { id:'PAT-0317', name:'Suresh Menon', age:52, sex:'Male', mobile:'+91 98xxx317', initials:'SM', avatarClass:'av-g', visits:[
    {date:'22 Nov 2026',time:'08:30 AM',dateValue:'2026-11-22',invoiceId:'ORD-016744',tests:['HbA1c','Lipid Profile'],refDoctor:'Self',amount:850,keyFinding:'HbA1c 8.1% — Above target',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'HbA1c',status:'Available'}],results:[{parameter:'HbA1c',value:8.1,unit:'%',reference:'4.0–5.6',date:'22 Nov 2026'}]},
    {date:'01 Oct 2026',time:'08:15 AM',dateValue:'2026-10-01',invoiceId:'ORD-015400',tests:['Blood glucose','KFT'],refDoctor:'Self',amount:620,keyFinding:'FBS 148 mg/dL ↑',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid',reports:[{name:'Blood glucose',status:'Available'}],results:[{parameter:'HbA1c',value:7.8,unit:'%',reference:'4.0–5.6',date:'01 Oct 2026'}]}
  ]},
  { id:'PAT-0320', name:'Meena Joshi', age:45, sex:'Female', mobile:'+91 98xxx320', initials:'MJ', avatarClass:'av-b', visits:[
    {date:'21 Nov 2026',time:'02:40 PM',dateValue:'2026-11-21',invoiceId:'ORD-016701',tests:['CBC','ESR'],refDoctor:'Dr. Pradeep Iyer',amount:280,keyFinding:'Processing — result pending',hasCritical:false,resultStatus:'Pending',paymentStatus:'Unpaid',reports:[{name:'CBC',status:'Pending'}],results:[]}
  ]}
];

@Component({
  selector: 'app-patient-history', standalone: true, imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-history.component.html', styleUrl: './patient-history.component.css',
})
export class PatientHistoryComponent {
  private readonly router = inject(Router);
  private readonly patientFlow = inject(PatientFlowService);
  protected readonly allPatients = PATIENTS;
  readonly viewTabs = ['All Patients', 'By Patient', 'By Test', 'Trends & Analytics'];
  readonly detailTabs = ['History', 'Reports', 'Compare', 'Trends'];
  searchQ = signal('');
  selectedPatient = signal<PatientRecord | null>(PATIENTS[0]);
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
  notice = signal('');
  layout = signal<'list' | 'grid'>('list');
  selectedCompareOrders = signal<string[]>([]);
  trendParameter = signal('Haemoglobin');
  analyticsPatientId = signal(PATIENTS[0].id);
  analyticsPatient = computed(() => this.allPatients.find(p => p.id === this.analyticsPatientId()) ?? this.allPatients[0]);
  page = signal(1);
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
      const matchesSearch = !q || [patient.name, patient.id, patient.mobile, visit.invoiceId, ...visit.tests].some(value => value.toLowerCase().includes(q));
      const matchesTest = this.testFilter() === 'all' || visit.tests.includes(this.testFilter());
      const matchesResult = this.resultFilter() === 'all' || (this.resultFilter() === 'critical' ? visit.hasCritical : visit.resultStatus.toLowerCase() === this.resultFilter());
      const matchesPayment = this.paymentFilter() === 'all' || visit.paymentStatus.toLowerCase() === this.paymentFilter();
      const matchesGender = this.genderFilter() === 'all' || patient.sex.toLowerCase() === this.genderFilter();
      const matchesDoctor = this.doctorFilter() === 'all' || visit.refDoctor === this.doctorFilter();
      return inDate && matchesSearch && matchesTest && matchesResult && matchesPayment && matchesGender && matchesDoctor && (!this.abnormalOnly() || visit.hasCritical);
    }).map(visit => ({patient,visit})));
  });
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
  filteredPatientCount = computed(() => this.filteredPatientRows().length);
  filteredVisitCount = computed(() => this.filteredVisits().length);
  filteredTestCount = computed(() => this.filteredVisits().reduce((sum,item) => sum + item.visit.tests.length,0));
  completedCount = computed(() => this.filteredVisits().filter(item => item.visit.resultStatus === 'Completed').length);
  completionRate = computed(() => this.filteredVisitCount() ? Math.round(this.completedCount() / this.filteredVisitCount() * 100) : 0);
  totalTests = computed(() => this.selectedPatient()?.visits.reduce((sum,visit) => sum + visit.tests.length,0) ?? 0);
  criticalCount = computed(() => this.selectedPatient()?.visits.filter(visit => visit.hasCritical).length ?? 0);
  compareVisits = computed(() => (this.selectedPatient()?.visits ?? []).filter(v => this.selectedCompareOrders().includes(v.invoiceId)));
  compareRows = computed(() => {
    const visits = this.compareVisits().slice().sort((a,b) => a.dateValue.localeCompare(b.dateValue));
    const params = [...new Set(visits.flatMap(v => v.results.map(r => r.parameter)))];
    return params.map(parameter => {
      const values = visits.map(v => v.results.find(r => r.parameter === parameter) ?? null);
      const previous = values.length > 1 ? values[values.length - 2] : null;
      const latest = values[values.length - 1] ?? null;
      const reference = latest?.reference ?? previous?.reference ?? '—';
      const change = previous && latest ? `${latest.value - previous.value > 0 ? '+' : ''}${(latest.value - previous.value).toFixed(2)} ${latest.unit}` : '—';
      return {parameter,previous,latest,reference,change,values};
    });
  });
  trendPoints = computed(() => (this.analyticsPatient()?.visits ?? this.selectedPatient()?.visits ?? []).slice().reverse().map(v => v.results.find(r => r.parameter === this.trendParameter()) ?? null).filter((r): r is NonNullable<typeof r> => !!r));
  trendMin = computed(() => Math.min(...this.trendPoints().map(p => p.value),0));
  trendMax = computed(() => Math.max(...this.trendPoints().map(p => p.value),1));
  trendChartCoordinates = computed(() => {
    const points = this.trendPoints();
    const min = this.trendMin();
    const range = Math.max(1, this.trendMax() - min);
    const step = 250 / Math.max(1, points.length - 1);
    return points.map((point, index) => ({
      x: 40 + index * step,
      y: 130 - ((point.value - min) / range) * 95,
      label: point.date.slice(0, 6)
    }));
  });
  trendPolyline = computed(() => this.trendChartCoordinates().map(point => `${point.x},${point.y}`).join(' '));

  setDateRange(value: string): void { this.dateRange.set(value); this.page.set(1); }
  setActiveView(value: string): void { this.activeView.set(value); if (value === 'By Patient' && !this.selectedPatient()) this.selectedPatient.set(this.allPatients[0]); }
  setAnalyticsPatient(id: string): void { this.analyticsPatientId.set(id); this.trendParameter.set(this.availableParametersForAnalytics()[0] ?? 'Haemoglobin'); }
  availableParametersForAnalytics = computed(() => [...new Set(this.analyticsPatient().visits.flatMap(v => v.results.map(r => r.parameter)))].sort());
  selectPatient(patient: PatientRecord): void { this.selectedPatient.set(patient); this.activeDetailTab.set('History'); this.selectedCompareOrders.set([]); this.menuPatientId.set(null); }
  resetFilters(): void {
    this.searchQ.set(''); this.dateRange.set('3months'); this.testFilter.set('all'); this.resultFilter.set('all');
    this.paymentFilter.set('all'); this.genderFilter.set('all'); this.doctorFilter.set('all');
    this.abnormalOnly.set(false); this.fromDate.set(''); this.toDate.set(''); this.page.set(1);
  }
  toggleCompare(orderId: string, checked: boolean): void {
    this.selectedCompareOrders.update(ids => checked ? (ids.length < 3 ? [...ids,orderId] : ids) : ids.filter(id => id !== orderId));
  }
  openReport(visit: VisitRecord): void {
    const available = visit.reports.some(r => r.status === 'Available');
    this.activeDetailTab.set('Reports');
    if (!available) { this.notice.set('This report is not yet available because result processing is pending.'); return; }
    this.notice.set('Report ' + visit.invoiceId + ' selected. Open the Reports module to preview the finalized report.');
    this.router.navigate(['/dashboard/reports']);
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
  showInvoice(visit: VisitRecord): void { this.notice.set('Invoice ' + visit.invoiceId + ' · ₹' + visit.amount.toLocaleString('en-IN')); }
  printHistory(): void { window.print(); }
  setPage(page: number): void { this.page.set(Math.min(Math.max(1,page),this.pageCount())); }
  exportCsv(): void {
    const rows = [['Patient','Patient ID','Mobile','Visit date','Order ID','Tests','Result status','Payment status','Amount'],
      ...this.filteredVisits().map(({patient,visit}) => [patient.name,patient.id,patient.mobile,visit.date,visit.invoiceId,visit.tests.join('; '),visit.resultStatus,visit.paymentStatus,String(visit.amount)])];
    const csv = rows.map(row => row.map(value => '"' + value.replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'patient-history.csv'; anchor.click(); URL.revokeObjectURL(url);
  }
}