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

  filteredReports = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.reports;
    return this.reports.filter(r =>
      r.patientName.toLowerCase().includes(q) ||
      r.test.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  pendingCount = computed(() => this.reports.filter(r => r.status === 'pending').length);

  initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0,2); }
}
