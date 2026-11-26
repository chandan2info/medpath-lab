import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PatientRecord {
  id: string; name: string; age: number; sex: string; mobile: string;
  initials: string; avatarClass: string; visitCount: number; visits: VisitRecord[];
}
interface VisitRecord {
  date: string; time: string; dateValue: string; invoiceId: string; tests: string[];
  refDoctor: string; amount: number; keyFinding: string; hasCritical: boolean;
  resultStatus: 'Completed' | 'Pending'; paymentStatus: 'Paid' | 'Unpaid';
}
interface PatientRow { patient: PatientRecord; latest: VisitRecord | null; }

const PATIENTS: PatientRecord[] = [
  { id:'PAT-0316', name:'Arun Pillai', age:61, sex:'Male', mobile:'+91 98xxx316', initials:'AP', avatarClass:'av-t', visitCount:4, visits:[
    {date:'25 Nov 2026',time:'10:24 AM',dateValue:'2026-11-25',invoiceId:'ORD-016832',tests:['CBC','KFT'],refDoctor:'Dr. Suresh Menon',amount:600,keyFinding:'K⁺ 6.8 mEq/L — Critical ↑↑',hasCritical:true,resultStatus:'Completed',paymentStatus:'Paid'},
    {date:'10 Oct 2026',time:'05:12 PM',dateValue:'2026-10-10',invoiceId:'ORD-015901',tests:['Lipid Profile'],refDoctor:'Dr. Suresh Menon',amount:700,keyFinding:'Creatinine 1.9 mg/dL ↑',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid'},
    {date:'15 Aug 2026',time:'11:03 AM',dateValue:'2026-08-15',invoiceId:'ORD-014221',tests:['CBC','LFT'],refDoctor:'Dr. Pradeep Iyer',amount:1500,keyFinding:'All within normal range',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid'}
  ]},
  { id:'PAT-0318', name:'Kavitha Nair', age:34, sex:'Female', mobile:'+91 99xxx318', initials:'KN', avatarClass:'av-b', visitCount:2, visits:[
    {date:'24 Nov 2026',time:'05:12 PM',dateValue:'2026-11-24',invoiceId:'ORD-016811',tests:['Thyroid Profile'],refDoctor:'Dr. Suresh Menon',amount:750,keyFinding:'TSH within reference range',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid'},
    {date:'10 Oct 2026',time:'09:15 AM',dateValue:'2026-10-10',invoiceId:'ORD-015822',tests:['CBC','ESR'],refDoctor:'Dr. Anita Rao',amount:280,keyFinding:'All within normal range',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid'}
  ]},
  { id:'PAT-0315', name:'Priya Sharma', age:29, sex:'Female', mobile:'+91 98xxx315', initials:'PS', avatarClass:'av-p', visitCount:1, visits:[
    {date:'23 Nov 2026',time:'11:03 AM',dateValue:'2026-11-23',invoiceId:'ORD-016790',tests:['Thyroid Profile'],refDoctor:'Dr. Anita Rao',amount:700,keyFinding:'TSH 8.2 mIU/L ↑',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid'}
  ]},
  { id:'PAT-0317', name:'Suresh Menon', age:52, sex:'Male', mobile:'+91 98xxx317', initials:'SM', avatarClass:'av-g', visitCount:6, visits:[
    {date:'22 Nov 2026',time:'08:30 AM',dateValue:'2026-11-22',invoiceId:'ORD-016744',tests:['HbA1c','Lipid Profile'],refDoctor:'Self',amount:850,keyFinding:'HbA1c 8.1% — Above target',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid'},
    {date:'01 Oct 2026',time:'08:15 AM',dateValue:'2026-10-01',invoiceId:'ORD-015400',tests:['Blood glucose','KFT'],refDoctor:'Self',amount:620,keyFinding:'FBS 148 mg/dL ↑',hasCritical:false,resultStatus:'Completed',paymentStatus:'Paid'}
  ]},
  { id:'PAT-0320', name:'Meena Joshi', age:45, sex:'Female', mobile:'+91 98xxx320', initials:'MJ', avatarClass:'av-b', visitCount:3, visits:[
    {date:'21 Nov 2026',time:'02:40 PM',dateValue:'2026-11-21',invoiceId:'ORD-016701',tests:['CBC','ESR'],refDoctor:'Dr. Pradeep Iyer',amount:280,keyFinding:'Processing — result pending',hasCritical:false,resultStatus:'Pending',paymentStatus:'Unpaid'}
  ]}
];

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-history.component.html',
  styleUrl: './patient-history.component.css',
})
export class PatientHistoryComponent {
  protected readonly allPatients = PATIENTS;
  readonly viewTabs = ['All Patients', 'By Patient', 'By Test', 'Trends'];
  readonly detailTabs = ['History', 'Reports', 'Trends'];
  searchQ = signal('');
  selectedPatient = signal<PatientRecord | null>(PATIENTS[0]);
  activeView = signal('All Patients');
  activeDetailTab = signal('History');
  dateRange = signal('3months');
  testFilter = signal('all');
  resultFilter = signal('all');
  paymentFilter = signal('all');
  fromDate = signal('');
  toDate = signal('');
  filtersApplied = signal(false);
  invoiceNotice = signal('');

  availableTests = computed(() => [...new Set(this.allPatients.flatMap(p => p.visits.flatMap(v => v.tests)))].sort());
  filteredVisits = computed(() => {
    const now = new Date('2026-11-26T12:00:00');
    const q = this.searchQ().trim().toLowerCase();
    const start = new Date(now);
    if (this.dateRange() === 'week') start.setDate(start.getDate() - 7);
    else if (this.dateRange() === 'month') start.setMonth(start.getMonth() - 1);
    else if (this.dateRange() === '3months') start.setMonth(start.getMonth() - 3);
    return this.allPatients.flatMap(patient => patient.visits
      .filter(visit => {
        const date = new Date(visit.dateValue + 'T00:00:00');
        const inDate = this.dateRange() === 'all' || (this.dateRange() === 'custom'
          ? (!this.fromDate() || visit.dateValue >= this.fromDate()) && (!this.toDate() || visit.dateValue <= this.toDate())
          : date >= start && date <= now);
        const matchesSearch = !q || [patient.name, patient.id, patient.mobile, visit.invoiceId].some(value => value.toLowerCase().includes(q));
        const matchesTest = this.testFilter() === 'all' || visit.tests.includes(this.testFilter());
        const matchesResult = this.resultFilter() === 'all' || (this.resultFilter() === 'critical' ? visit.hasCritical : visit.resultStatus.toLowerCase() === this.resultFilter());
        const matchesPayment = this.paymentFilter() === 'all' || visit.paymentStatus.toLowerCase() === this.paymentFilter();
        return inDate && matchesSearch && matchesTest && matchesResult && matchesPayment;
      }).map(visit => ({ patient, visit })));
  });
  filteredPatientRows = computed(() => {
    const map = new Map<string, PatientRow>();
    for (const item of this.filteredVisits()) {
      const current = map.get(item.patient.id);
      if (!current || item.visit.dateValue > (current.latest?.dateValue ?? '')) map.set(item.patient.id, {patient:item.patient,latest:item.visit});
    }
    return [...map.values()].sort((a,b) => (b.latest?.dateValue ?? '').localeCompare(a.latest?.dateValue ?? ''));
  });
  filteredPatientCount = computed(() => this.filteredPatientRows().length);
  filteredVisitCount = computed(() => this.filteredVisits().length);
  filteredTestCount = computed(() => this.filteredVisits().reduce((sum,item) => sum + item.visit.tests.length, 0));
  completedCount = computed(() => this.filteredVisits().filter(item => item.visit.resultStatus === 'Completed').length);
  completionRate = computed(() => this.filteredVisitCount() ? Math.round(this.completedCount() / this.filteredVisitCount() * 100) : 0);
  totalTests = computed(() => this.selectedPatient()?.visits.reduce((sum,visit) => sum + visit.tests.length, 0) ?? 0);
  criticalCount = computed(() => this.selectedPatient()?.visits.filter(visit => visit.hasCritical).length ?? 0);

  setDateRange(value: string): void { this.dateRange.set(value); }
  selectPatient(patient: PatientRecord): void { this.selectedPatient.set(patient); this.activeDetailTab.set('History'); }
  resetFilters(): void {
    this.searchQ.set(''); this.dateRange.set('3months'); this.testFilter.set('all');
    this.resultFilter.set('all'); this.paymentFilter.set('all'); this.fromDate.set(''); this.toDate.set('');
  }
  openReport(visit: VisitRecord): void {
    this.activeDetailTab.set('Reports');
    this.invoiceNotice.set('Report ' + visit.invoiceId + ' selected. Connect the report viewer API to open the signed report.');
  }
  showInvoice(visit: VisitRecord): void {
    this.invoiceNotice.set('Invoice ' + visit.invoiceId + ' · ₹' + visit.amount.toLocaleString('en-IN'));
  }
  printHistory(): void { window.print(); }
  exportCsv(): void {
    const rows = [['Patient','Patient ID','Mobile','Visit date','Order ID','Tests','Result status','Payment status','Amount'],
      ...this.filteredVisits().map(({patient,visit}) => [patient.name,patient.id,patient.mobile,visit.date,visit.invoiceId,visit.tests.join('; '),visit.resultStatus,visit.paymentStatus,String(visit.amount)])];
    const csv = rows.map(row => row.map(value => '"' + value.replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'patient-history.csv'; anchor.click();
    URL.revokeObjectURL(url);
  }
}