import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PatientRecord {
  id: string; name: string; age: number; sex: string;
  mobile: string; initials: string; avatarClass: string;
  visitCount: number; visits: VisitRecord[];
}

interface VisitRecord {
  date: string; invoiceId: string; tests: string[];
  refDoctor: string; amount: number;
  keyFinding: string; hasCritical: boolean;
}

const PATIENTS: PatientRecord[] = [
  { id:'PAT-0316', name:'Arun Pillai',          age:61, sex:'M', mobile:'98xxx316', initials:'AP', avatarClass:'av-t', visitCount:4, visits:[
    { date:'23 Jun 2026', invoiceId:'INV-2406-0091', tests:['KFT','Urine R/M'],   refDoctor:'Dr. Suresh Menon',  amount:600,  keyFinding:'K⁺ 6.8 mEq/L — Critical ↑↑',          hasCritical:true  },
    { date:'12 Feb 2026', invoiceId:'INV-2402-0047', tests:['KFT','CBC'],          refDoctor:'Dr. Suresh Menon',  amount:700,  keyFinding:'Creatinine 1.9 mg/dL ↑',               hasCritical:false },
    { date:'04 Sep 2025', invoiceId:'INV-2509-0012', tests:['KFT','LFT','Lipids'], refDoctor:'Dr. Pradeep Iyer', amount:1500, keyFinding:'All within normal range',                hasCritical:false },
  ]},
  { id:'PAT-0318', name:'Kavitha Nair',          age:34, sex:'F', mobile:'98xxx318', initials:'KN', avatarClass:'av-b', visitCount:2, visits:[
    { date:'23 Jun 2026', invoiceId:'INV-2406-0090', tests:['CBC','LFT'],           refDoctor:'Dr. Suresh Menon',  amount:750,  keyFinding:'LFT mildly elevated — SGPT 58 U/L ↑',  hasCritical:false },
    { date:'10 Jan 2026', invoiceId:'INV-2601-0011', tests:['CBC','ESR'],            refDoctor:'Dr. Suresh Menon',  amount:280,  keyFinding:'All within normal range',                hasCritical:false },
  ]},
  { id:'PAT-0315', name:'Priya Sharma',          age:29, sex:'F', mobile:'98xxx315', initials:'PS', avatarClass:'av-p', visitCount:1, visits:[
    { date:'23 Jun 2026', invoiceId:'INV-2406-0089', tests:['Thyroid panel'],        refDoctor:'Dr. Anita Rao',     amount:700,  keyFinding:'TSH 8.2 mIU/L ↑ — Hypothyroid',        hasCritical:false },
  ]},
  { id:'PAT-0317', name:'Suresh Menon',          age:52, sex:'M', mobile:'98xxx317', initials:'SM', avatarClass:'av-g', visitCount:6, visits:[
    { date:'23 Jun 2026', invoiceId:'INV-2406-0088', tests:['HbA1c','Lipids'],       refDoctor:'Self',              amount:850,  keyFinding:'HbA1c 8.1% — Uncontrolled diabetes',    hasCritical:false },
    { date:'01 Apr 2026', invoiceId:'INV-2604-0022', tests:['Blood glucose','KFT'],  refDoctor:'Self',              amount:620,  keyFinding:'FBS 148 mg/dL ↑',                       hasCritical:false },
  ]},
  { id:'PAT-0320', name:'Meena Joshi',           age:45, sex:'F', mobile:'98xxx320', initials:'MJ', avatarClass:'av-b', visitCount:3, visits:[
    { date:'23 Jun 2026', invoiceId:'INV-2406-0092', tests:['CBC','ESR'],            refDoctor:'Dr. Pradeep Iyer', amount:280,  keyFinding:'Processing — result pending',            hasCritical:false },
  ]},
];

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './patient-history.component.html',
    styleUrl: './patient-history.component.css',
})
export class PatientHistoryComponent {
  protected readonly allPatients = PATIENTS;
  searchQ         = '';
  selectedPatient = signal<PatientRecord | null>(PATIENTS[0]);
  activeTab       = signal('Visit history');

  filtered = computed(() => {
    const q = this.searchQ.toLowerCase();
    if (!q) return this.allPatients;
    return this.allPatients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.mobile.includes(q)
    );
  });

  totalTests     = computed(() => this.selectedPatient()?.visits.reduce((a,v) => a + v.tests.length, 0) ?? 0);
  criticalCount  = computed(() => this.selectedPatient()?.visits.filter(v => v.hasCritical).length ?? 0);
  hasCriticalHistory = computed(() => this.criticalCount() > 0);

  visitDotClass(v: VisitRecord, i: number): string {
    if (v.hasCritical) return 'dot-today';
    if (i === 0) return 'dot-warn';
    return 'dot-ok';
  }
}
