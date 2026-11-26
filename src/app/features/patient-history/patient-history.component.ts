import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

type DatePreset = 'all' | 'week' | 'month' | 'custom';

interface PatientRecord {
  id: string; name: string; age: number; sex: string;
  mobile: string; initials: string; avatarClass: string;
  visitCount: number; visits: VisitRecord[];
}

interface VisitRecord {
  date: string; dateISO: string; invoiceId: string; tests: string[];
  refDoctor: string; amount: number;
  keyFinding: string; hasCritical: boolean;
}

const PATIENTS: PatientRecord[] = [
  { id:'PAT-0316', name:'Arun Pillai', age:61, sex:'M', mobile:'98xxx316', initials:'AP', avatarClass:'av-t', visitCount:4, visits:[
    { date:'23 Jun 2026', dateISO:'2026-06-23', invoiceId:'INV-2406-0091', tests:['KFT','Urine R/M'], refDoctor:'Dr. Suresh Menon', amount:600, keyFinding:'K⁺ 6.8 mEq/L — Critical ↑↑', hasCritical:true },
    { date:'12 Feb 2026', dateISO:'2026-02-12', invoiceId:'INV-2402-0047', tests:['KFT','CBC'], refDoctor:'Dr. Suresh Menon', amount:700, keyFinding:'Creatinine 1.9 mg/dL ↑', hasCritical:false },
    { date:'04 Sep 2025', dateISO:'2025-09-04', invoiceId:'INV-2509-0012', tests:['KFT','LFT','Lipids'], refDoctor:'Dr. Pradeep Iyer', amount:1500, keyFinding:'All within normal range', hasCritical:false },
  ]},
  { id:'PAT-0318', name:'Kavitha Nair', age:34, sex:'F', mobile:'98xxx318', initials:'KN', avatarClass:'av-b', visitCount:2, visits:[
    { date:'23 Jun 2026', dateISO:'2026-06-23', invoiceId:'INV-2406-0090', tests:['CBC','LFT'], refDoctor:'Dr. Suresh Menon', amount:750, keyFinding:'LFT mildly elevated — SGPT 58 U/L ↑', hasCritical:false },
    { date:'10 Jan 2026', dateISO:'2026-01-10', invoiceId:'INV-2601-0011', tests:['CBC','ESR'], refDoctor:'Dr. Suresh Menon', amount:280, keyFinding:'All within normal range', hasCritical:false },
  ]},
  { id:'PAT-0315', name:'Priya Sharma', age:29, sex:'F', mobile:'98xxx315', initials:'PS', avatarClass:'av-p', visitCount:1, visits:[
    { date:'23 Jun 2026', dateISO:'2026-06-23', invoiceId:'INV-2406-0089', tests:['Thyroid panel'], refDoctor:'Dr. Anita Rao', amount:700, keyFinding:'TSH 8.2 mIU/L ↑ — Hypothyroid', hasCritical:false },
  ]},
  { id:'PAT-0317', name:'Suresh Menon', age:52, sex:'M', mobile:'98xxx317', initials:'SM', avatarClass:'av-g', visitCount:6, visits:[
    { date:'23 Jun 2026', dateISO:'2026-06-23', invoiceId:'INV-2406-0088', tests:['HbA1c','Lipids'], refDoctor:'Self', amount:850, keyFinding:'HbA1c 8.1% — Uncontrolled diabetes', hasCritical:false },
    { date:'01 Apr 2026', dateISO:'2026-04-01', invoiceId:'INV-2604-0022', tests:['Blood glucose','KFT'], refDoctor:'Self', amount:620, keyFinding:'FBS 148 mg/dL ↑', hasCritical:false },
  ]},
  { id:'PAT-0320', name:'Meena Joshi', age:45, sex:'F', mobile:'98xxx320', initials:'MJ', avatarClass:'av-b', visitCount:3, visits:[
    { date:'23 Jun 2026', dateISO:'2026-06-23', invoiceId:'INV-2406-0092', tests:['CBC','ESR'], refDoctor:'Dr. Pradeep Iyer', amount:280, keyFinding:'Processing — result pending', hasCritical:false },
  ]},
];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
  patientSearchQ = signal('');
  selectedPatient = signal<PatientRecord | null>(PATIENTS[0]);
  activeTab = signal('Visit history');
  datePreset = signal<DatePreset>('all');
  customFrom = signal('');
  customTo = signal('');

  filtered = computed(() => {
    const q = this.patientSearchQ().trim().toLowerCase();
    return this.allPatients.filter(p => {
      const matchesLocal = !q || [p.name, p.id, p.mobile].some(v => v.toLowerCase().includes(q));
      return matchesLocal;
    });
  });

  filteredVisits = computed(() => {
    const patient = this.selectedPatient();
    if (!patient) return [];
    const preset = this.datePreset();
    const now = new Date();
    let from = '';
    let to = toISODate(now);
    if (preset === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      from = toISODate(start);
    } else if (preset === 'month') {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      from = toISODate(start);
    } else if (preset === 'custom') {
      from = this.customFrom();
      to = this.customTo() || to;
    }
    if (preset === 'custom' && from && this.customTo() && from > this.customTo()) return [];
    return patient.visits.filter(v => {
      if (preset === 'all') return true;
      if (from && v.dateISO < from) return false;
      if (to && v.dateISO > to) return false;
      return true;
    });
  });

  totalTests = computed(() => this.filteredVisits().reduce((sum, visit) => sum + visit.tests.length, 0));
  criticalCount = computed(() => this.filteredVisits().filter(visit => visit.hasCritical).length);
  hasCriticalHistory = computed(() => this.criticalCount() > 0);

  setDatePreset(value: string): void {
    this.datePreset.set(value as DatePreset);
  }

  clearFilters(): void {
    this.patientSearchQ.set('');
    this.datePreset.set('all');
    this.customFrom.set('');
    this.customTo.set('');
  }

  visitDotClass(visit: VisitRecord, index: number): string {
    if (visit.hasCritical) return 'dot-today';
    if (index === 0) return 'dot-warn';
    return 'dot-ok';
  }
}
