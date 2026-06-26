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
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Patient history</h1>
        <nav aria-label="Breadcrumb"><ol class="breadcrumb">
          <li><a routerLink="/dashboard/home">Home</a></li>
          <li aria-current="page">Patient history</li>
        </ol></nav>
      </div>
      <a routerLink="/dashboard/registration" class="lis-btn lis-btn--primary lis-btn--sm">
        <i class="ti ti-user-plus" aria-hidden="true"></i> New patient
      </a>
    </div>

    <!-- Search bar -->
    <div class="ph-search" role="search">
      <i class="ti ti-search" aria-hidden="true"></i>
      <input type="search" placeholder="Search by name, phone, or patient ID…"
        [(ngModel)]="searchQ" aria-label="Search patients" />
    </div>

    <div class="ph-layout">
      <!-- Patient list -->
      <div class="lis-card patient-list">
        <div class="lis-card__header">
          <h2 class="lis-card__title">All patients</h2>
          <span class="list-count">{{ filtered().length }} records</span>
        </div>
        <div role="list" aria-label="Patient list">
          @for (p of filtered(); track p.id) {
            <div class="pat-item" role="listitem"
              [class.pat-item--selected]="selectedPatient()?.id === p.id"
              (click)="selectedPatient.set(p)"
              [attr.aria-selected]="selectedPatient()?.id === p.id"
            >
              <div class="pi-av" [class]="p.avatarClass" aria-hidden="true">{{ p.initials }}</div>
              <div class="pi-info">
                <div class="pi-name">{{ p.name }}</div>
                <div class="pi-meta">{{ p.age }}{{ p.sex }} · {{ p.mobile }}</div>
              </div>
              <div class="pi-visits">{{ p.visitCount }} visit{{ p.visitCount !== 1 ? 's' : '' }}</div>
            </div>
          }
        </div>
      </div>

      <!-- Patient detail -->
      @if (selectedPatient()) {
        <div class="patient-detail lis-card">
          <!-- Patient header -->
          <div class="pd-header">
            <div class="pd-av" [class]="selectedPatient()!.avatarClass" aria-hidden="true">
              {{ selectedPatient()!.initials }}
            </div>
            <div class="pd-info">
              <div class="pd-name">{{ selectedPatient()!.name }}</div>
              <div class="pd-meta">
                {{ selectedPatient()!.age }} yrs · {{ selectedPatient()!.sex }} ·
                <span class="lis-mono" style="font-size:10px">{{ selectedPatient()!.id }}</span>
              </div>
            </div>
            <div class="pd-stats">
              <div class="pd-stat"><div class="pd-sv">{{ selectedPatient()!.visitCount }}</div><div class="pd-sl">Visits</div></div>
              <div class="pd-stat"><div class="pd-sv">{{ totalTests() }}</div><div class="pd-sl">Tests</div></div>
              <div class="pd-stat">
                <div class="pd-sv" [class.pd-sv--red]="hasCriticalHistory()">{{ criticalCount() }}</div>
                <div class="pd-sl">Critical</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tab-bar" role="tablist">
            @for (tab of ['Visit history','Test trends','Documents']; track tab) {
              <button type="button" class="tab" role="tab"
                [class.tab--active]="activeTab() === tab"
                [attr.aria-selected]="activeTab() === tab"
                (click)="activeTab.set(tab)"
              >{{ tab }}</button>
            }
          </div>

          <!-- Visit timeline -->
          <div class="timeline" role="list" aria-label="Visit history">
            @for (v of selectedPatient()!.visits; track v.invoiceId; let i = $index) {
              <div class="visit-item" role="listitem">
                <div class="visit-line">
                  <div class="visit-dot" [class]="visitDotClass(v, i)" aria-hidden="true"></div>
                  @if (i < selectedPatient()!.visits.length - 1) {
                    <div class="visit-track" aria-hidden="true"></div>
                  }
                </div>
                <div class="visit-card">
                  <div class="vc-header">
                    <i class="ti ti-calendar" style="font-size:13px;color:var(--text-secondary)" aria-hidden="true"></i>
                    <span class="vc-date">{{ v.date }}{{ i === 0 ? ' — Today' : '' }}</span>
                    @if (v.hasCritical) {
                      <span class="crit-badge" role="status">
                        <i class="ti ti-alert-triangle" style="font-size:9px" aria-hidden="true"></i> Critical
                      </span>
                    }
                    <span class="lis-mono" style="font-size:9px;margin-left:auto">{{ v.invoiceId }}</span>
                  </div>
                  <div class="vc-body">
                    <div class="vc-tests">
                      @for (t of v.tests; track t) {
                        <span class="test-tag">{{ t }}</span>
                      }
                    </div>
                    <div class="vc-row"><span>Ref. doctor</span><span>{{ v.refDoctor }}</span></div>
                    <div class="vc-row"><span>Amount billed</span><span>₹{{ v.amount.toLocaleString('en-IN') }}</span></div>
                    <div class="vc-row vc-row--finding" [class.vc-row--critical]="v.hasCritical">
                      <span>Key finding</span>
                      <span>{{ v.keyFinding }}</span>
                    </div>
                    <div class="vc-actions">
                      <button type="button" class="vc-btn">
                        <i class="ti ti-file-text" aria-hidden="true"></i> View report
                      </button>
                      <button type="button" class="vc-btn">
                        <i class="ti ti-printer" aria-hidden="true"></i> Reprint
                      </button>
                      <button type="button" class="vc-btn">
                        <i class="ti ti-receipt" aria-hidden="true"></i> Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles:[`
    :host { display:block; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:12px; }
    .page-title  { font-size:20px; font-weight:500; color:var(--text-primary); margin:0 0 3px; }
    .breadcrumb  { display:flex; list-style:none; padding:0; margin:0; gap:6px; font-size:12px; color:var(--text-secondary); }
    .breadcrumb a { color:var(--text-secondary); text-decoration:none; }
    .breadcrumb li+li::before { content:'/'; margin-right:6px; }

    .ph-search {
      display:flex; align-items:center; gap:8px; flex:1;
      background:var(--card-bg); border:0.5px solid var(--border-color); border-radius:8px;
      padding:8px 13px; margin-bottom:12px; max-width:420px;
      i { color:var(--text-secondary); font-size:14px; }
      input { background:transparent; border:none; outline:none; font-size:12px; color:var(--text-primary); flex:1; }
    }

    .ph-layout { display:grid; grid-template-columns:280px 1fr; gap:12px; align-items:start; }
    @media (max-width:900px) { .ph-layout { grid-template-columns:1fr; } }

    /* Patient list */
    .list-count { font-size:11px; color:var(--text-secondary); margin-left:auto; }
    .pat-item {
      display:flex; align-items:center; gap:9px; padding:9px 13px;
      border-bottom:0.5px solid var(--border-color); cursor:pointer;
      transition:background 0.1s;
    }
    .pat-item:last-child { border-bottom:none; }
    .pat-item:hover { background:var(--body-bg); }
    .pat-item--selected { background:var(--lis-primary-xlight,#E1F5EE); }
    .pi-av { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:500; flex-shrink:0; }
    .av-t  { background:#E1F5EE; color:#085041; }
    .av-b  { background:#E6F1FB; color:#0C447C; }
    .av-p  { background:#FBEAF0; color:#72243E; }
    .av-g  { background:#EAF3DE; color:#27500A; }
    .pi-name  { font-size:12px; font-weight:500; color:var(--text-primary); }
    .pi-meta  { font-size:10px; color:var(--text-secondary); }
    .pi-visits{ font-size:10px; color:var(--text-secondary); margin-left:auto; white-space:nowrap; }

    /* Patient detail */
    .pd-header { padding:14px; border-bottom:0.5px solid var(--border-color); display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .pd-av { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:500; flex-shrink:0; }
    .pd-name  { font-size:15px; font-weight:500; color:var(--text-primary); }
    .pd-meta  { font-size:11px; color:var(--text-secondary); margin-top:2px; }
    .pd-stats { display:flex; gap:8px; margin-left:auto; }
    .pd-stat  { background:var(--body-bg); border-radius:7px; padding:7px 12px; text-align:center; }
    .pd-sv    { font-size:16px; font-weight:500; color:var(--text-primary); }
    .pd-sv--red { color:#E24B4A; }
    .pd-sl    { font-size:10px; color:var(--text-secondary); }

    .tab-bar { display:flex; border-bottom:0.5px solid var(--border-color); padding:0 14px; }
    .tab { padding:9px 13px; font-size:12px; color:var(--text-secondary); cursor:pointer; border-bottom:2px solid transparent; background:none; border-top:none; border-left:none; border-right:none; font-family:var(--font-family); }
    .tab--active { color:var(--lis-primary,#1D9E75); border-bottom-color:var(--lis-primary,#1D9E75); font-weight:500; }

    /* Timeline */
    .timeline { padding:14px; display:flex; flex-direction:column; gap:0; }
    .visit-item { display:flex; gap:12px; }
    .visit-line { display:flex; flex-direction:column; align-items:center; }
    .visit-dot  { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:3px; }
    .dot-today  { background:#E24B4A; }
    .dot-warn   { background:#EF9F27; }
    .dot-ok     { background:var(--lis-primary,#1D9E75); }
    .visit-track{ flex:1; width:2px; background:var(--border-color); margin:4px auto 0; min-height:20px; }
    .visit-card { flex:1; background:var(--card-bg); border:0.5px solid var(--border-color); border-radius:10px; overflow:hidden; margin-bottom:12px; }
    .vc-header  { padding:9px 12px; border-bottom:0.5px solid var(--border-color); display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
    .vc-date    { font-size:12px; font-weight:500; color:var(--text-primary); }
    .crit-badge { font-size:10px; background:#FCEBEB; color:#791F1F; padding:2px 7px; border-radius:10px; font-weight:500; display:inline-flex; align-items:center; gap:3px; }
    .vc-body    { padding:9px 12px; }
    .vc-tests   { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:7px; }
    .test-tag   { font-size:10px; padding:2px 7px; border-radius:10px; background:var(--body-bg); color:var(--text-secondary); }
    .vc-row     { display:flex; justify-content:space-between; font-size:11px; padding:3px 0; color:var(--text-secondary); span:last-child { font-weight:500; color:var(--text-primary); } }
    .vc-row--finding span:last-child { color:var(--text-secondary); }
    .vc-row--critical span:last-child { color:#E24B4A; font-weight:500; }
    .vc-actions { display:flex; gap:6px; margin-top:8px; }
    .vc-btn { display:flex; align-items:center; gap:4px; padding:5px 9px; border:0.5px solid var(--border-color); border-radius:6px; font-size:11px; cursor:pointer; color:var(--text-secondary); background:var(--card-bg); font-family:var(--font-family); &:hover { background:var(--body-bg); } i { font-size:13px; color:var(--lis-primary,#1D9E75); } }
  `]
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
