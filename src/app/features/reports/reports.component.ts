import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

interface ReportRow {
  id: string; patientName: string; patientId: string;
  test: string; date: string; status: 'pending' | 'dispatched';
}

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
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Reports</h1>
        <nav aria-label="Breadcrumb"><ol class="breadcrumb">
          <li><a routerLink="/dashboard/home">Home</a></li>
          <li aria-current="page">Reports</li>
        </ol></nav>
      </div>
    </div>

    <div class="reports-layout">
      <!-- Report list -->
      <div class="lis-card report-list">
        <div class="lis-card__header">
          <i class="ti ti-file-text" style="color:var(--lis-primary,#1D9E75);font-size:15px" aria-hidden="true"></i>
          <h2 class="lis-card__title">All reports</h2>
          <span class="lis-badge lis-badge--danger">5 pending</span>
        </div>
        <div role="list" aria-label="Report list">
          @for (r of reports; track r.id) {
            <div class="report-row" role="listitem"
              [class.report-row--selected]="selected()?.id === r.id"
              (click)="selected.set(r)"
              [attr.aria-selected]="selected()?.id === r.id"
            >
              <div class="rr-av" aria-hidden="true">{{ initials(r.patientName) }}</div>
              <div class="rr-info">
                <div class="rr-name">{{ r.patientName }}</div>
                <div class="rr-meta">{{ r.test }} · {{ r.date }}</div>
                <div class="lis-mono" style="font-size:9px">{{ r.id }}</div>
              </div>
              <div>
                @if (r.status === 'pending') {
                  <span class="lis-pill lis-pill--pending">Pending</span>
                } @else {
                  <span class="lis-pill lis-pill--ready">Dispatched</span>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Report preview -->
      @if (selected()) {
        <div class="report-preview-area">
          <!-- Action bar -->
          <div class="preview-toolbar">
            <div class="preview-actions">
              <button type="button" class="lis-btn lis-btn--secondary lis-btn--sm">
                <i class="ti ti-download" aria-hidden="true"></i> Download PDF
              </button>
              <button type="button" class="lis-btn lis-btn--secondary lis-btn--sm">
                <i class="ti ti-send" aria-hidden="true"></i> Send to patient
              </button>
              <button type="button" class="lis-btn lis-btn--secondary lis-btn--sm">
                <i class="ti ti-whatsapp" aria-hidden="true"></i> WhatsApp
              </button>
              <button type="button" class="lis-btn lis-btn--primary lis-btn--sm">
                <i class="ti ti-printer" aria-hidden="true"></i> Print
              </button>
            </div>
          </div>

          <!-- Print-ready report sheet -->
          <div class="report-sheet" id="report-sheet" aria-label="Report preview">
            <!-- Header -->
            <div class="rpt-header">
              <div class="rpt-logo" aria-hidden="true">
                <i class="ti ti-flask"></i>
              </div>
              <div class="rpt-lab">
                <div class="rpt-lab-name">MedPath Diagnostics</div>
                <div class="rpt-lab-tag">Accurate Results. Better Health.</div>
                <div class="rpt-lab-addr">123, Health Street, Medical Area, Bengaluru — 560001 · +91 98765 43210</div>
              </div>
              <div class="rpt-meta">
                <div class="rpt-date">Report date: 23 Jun 2026</div>
                <div class="rpt-nabl">
                  <i class="ti ti-certificate" aria-hidden="true"></i> NABL Accredited
                </div>
              </div>
            </div>

            <!-- Patient band -->
            <div class="rpt-pat-band">
              <div class="rpt-pf"><div class="rpt-pl">Patient name</div><div class="rpt-pv">Arun Pillai</div></div>
              <div class="rpt-pf"><div class="rpt-pl">Age / Sex</div><div class="rpt-pv">61 years / Male</div></div>
              <div class="rpt-pf"><div class="rpt-pl">Patient ID</div><div class="rpt-pv" style="font-family:monospace;font-size:10px">PAT-2406-0316</div></div>
              <div class="rpt-pf"><div class="rpt-pl">Referred by</div><div class="rpt-pv">Dr. Suresh Menon</div></div>
              <div class="rpt-pf"><div class="rpt-pl">Collected on</div><div class="rpt-pv">23 Jun 2026 · 9:20 AM</div></div>
              <div class="rpt-pf"><div class="rpt-pl">Reported on</div><div class="rpt-pv">23 Jun 2026 · 11:05 AM</div></div>
            </div>

            <!-- Title band -->
            <div class="rpt-title-band">
              <div class="rpt-title-text">
                <i class="ti ti-flask" aria-hidden="true"></i>
                Kidney Function Test (KFT)
              </div>
              <div class="lis-mono" style="font-size:10px;color:#9FE1CB">SMP-2406-087</div>
            </div>

            <!-- Body -->
            <div class="rpt-body">
              <div class="rpt-note">
                <strong>Note:</strong> Critical value — Serum Potassium (K⁺) is significantly elevated.
                Referring physician has been notified. Fasting: Non-fasting. Specimen: Serum (Red top SST).
              </div>

              <div class="rpt-grp-title">Biochemistry — Renal profile</div>
              <table class="rpt-tbl" role="table">
                <thead>
                  <tr>
                    <th scope="col">Parameter</th>
                    <th scope="col">Result</th>
                    <th scope="col">Unit</th>
                    <th scope="col">Reference range</th>
                    <th scope="col">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of kftRows; track row.name) {
                    <tr [class.rpt-row-crit]="row.flag === 'critical'">
                      <td [class.rpt-bold]="row.flag === 'critical'">{{ row.name }}</td>
                      <td [class]="'rpt-flag-' + row.flag">
                        <strong>{{ row.result }}</strong>
                        @if (row.flag === 'critical') { <span> ↑↑</span> }
                        @else if (row.flag === 'high') { <span> ↑</span> }
                        @else if (row.flag === 'low')  { <span> ↓</span> }
                      </td>
                      <td>{{ row.unit }}</td>
                      <td class="rpt-ref">{{ row.ref }}</td>
                      <td [class]="'rpt-flag-' + row.flag">
                        @if (row.flag === 'critical') { <strong>CRITICAL</strong> }
                        @else if (row.flag === 'high') { High }
                        @else if (row.flag === 'low')  { Low }
                        @else { Normal }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Footer -->
              <div class="rpt-footer">
                <div class="rpt-qr-area">
                  <div class="rpt-qr" aria-hidden="true"><i class="ti ti-qrcode"></i></div>
                  <div class="rpt-qr-text">
                    Scan to verify<br>
                    <span style="font-family:monospace;font-size:9px">rpt.medpath.in/SMP-2406-087</span>
                  </div>
                </div>
                <div class="rpt-sign">
                  <div class="rpt-sign-pre">Authorised by</div>
                  <div class="rpt-sign-name">Dr. Priya Hegde</div>
                  <div class="rpt-sign-role">MD Pathology · MedPath Diagnostics</div>
                  <div class="rpt-sign-reg">Reg. No. MCI-2019-048721</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles:[`
    :host { display:block; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:14px; }
    .page-title  { font-size:20px; font-weight:500; color:var(--text-primary); margin:0 0 3px; }
    .breadcrumb  { display:flex; list-style:none; padding:0; margin:0; gap:6px; font-size:12px; color:var(--text-secondary); }
    .breadcrumb a { color:var(--text-secondary); text-decoration:none; }
    .breadcrumb li+li::before { content:'/'; margin-right:6px; }

    .reports-layout { display:grid; grid-template-columns:268px 1fr; gap:14px; align-items:start; }
    @media (max-width:900px) { .reports-layout { grid-template-columns:1fr; } }

    .report-list { }
    .report-row {
      display:flex; align-items:center; gap:9px; padding:9px 14px;
      border-bottom:0.5px solid var(--border-color); cursor:pointer;
      transition:background 0.1s;
      &:last-child { border-bottom:none; }
      &:hover { background:var(--body-bg); }
    .report-row:hover { background:var(--body-bg); }
    .report-row--selected { background:var(--lis-primary-xlight,#E1F5EE); }
    }
    .rr-av { width:30px; height:30px; border-radius:50%; background:var(--lis-primary-xlight,#E1F5EE); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; color:var(--lis-primary-deep,#085041); flex-shrink:0; }
    .rr-info { flex:1; min-width:0; }
    .rr-name { font-size:12px; font-weight:500; color:var(--text-primary); }
    .rr-meta { font-size:10px; color:var(--text-secondary); }
    .lis-pill { display:inline-flex; align-items:center; padding:2px 7px; border-radius:20px; font-size:10px; font-weight:500; }
    .lis-pill--pending { background:#FAEEDA; color:#633806; }
    .lis-pill--ready   { background:#E1F5EE; color:#085041; }

    .report-preview-area { display:flex; flex-direction:column; gap:10px; }
    .preview-toolbar { display:flex; justify-content:flex-end; }
    .preview-actions { display:flex; gap:7px; flex-wrap:wrap; }

    /* ── Report sheet (print-ready) ── */
    .report-sheet {
      background:#fff; border:0.5px solid #ccc; border-radius:8px;
      overflow:hidden;
      @media print {
        border:none; border-radius:0;
        box-shadow:none;
        .preview-toolbar { display:none; }
      }
    }
    .rpt-header { background:#085041; padding:14px 18px; display:flex; align-items:center; gap:12px; }
    .rpt-logo { width:38px; height:38px; background:var(--lis-primary,#1D9E75); border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; i { color:#fff; font-size:19px; } }
    .rpt-lab { flex:1; }
    .rpt-lab-name { font-size:14px; font-weight:500; color:#fff; }
    .rpt-lab-tag  { font-size:10px; color:#9FE1CB; margin-top:1px; }
    .rpt-lab-addr { font-size:10px; color:#9FE1CB; margin-top:1px; }
    .rpt-meta { text-align:right; }
    .rpt-date { font-size:10px; color:#9FE1CB; }
    .rpt-nabl { background:rgba(255,255,255,0.15); padding:3px 9px; border-radius:20px; font-size:10px; color:#E1F5EE; margin-top:5px; display:inline-flex; align-items:center; gap:4px; i { font-size:10px; } }
    .rpt-pat-band { background:#F0FAF6; padding:10px 18px; display:grid; grid-template-columns:repeat(3,1fr); gap:8px; border-bottom:2px solid var(--lis-primary,#1D9E75); }
    .rpt-pf { display:flex; flex-direction:column; gap:1px; }
    .rpt-pl { font-size:9px; color:#0F6E56; font-weight:500; text-transform:uppercase; letter-spacing:.04em; }
    .rpt-pv { font-size:11px; color:#04342C; font-weight:500; }
    .rpt-title-band { background:#085041; padding:7px 18px; display:flex; align-items:center; justify-content:space-between; }
    .rpt-title-text { font-size:12px; font-weight:500; color:#fff; display:flex; align-items:center; gap:5px; i { font-size:11px; } }
    .rpt-body { padding:14px 18px; }
    .rpt-note { background:#FFF8E7; border-left:3px solid #EF9F27; padding:8px 11px; border-radius:0 6px 6px 0; margin-bottom:12px; font-size:10px; color:#412402; line-height:1.5; }
    .rpt-grp-title { font-size:12px; font-weight:500; color:#085041; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid #E1F5EE; }
    .rpt-tbl { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:12px; }
    .rpt-tbl th { padding:5px 8px; text-align:left; font-size:9px; color:#0F6E56; font-weight:500; border-bottom:1px solid #E1F5EE; text-transform:uppercase; letter-spacing:.04em; }
    .rpt-tbl td { padding:6px 8px; border-bottom:0.5px solid #F0FAF6; color:#04342C; }
    .rpt-tbl tbody tr:last-child td { border-bottom:none; }
    .rpt-row-crit { background:#FFF0F0; }
    .rpt-bold { font-weight:600; }
    .rpt-flag-normal   { color:#0F6E56; }
    .rpt-flag-high,
    .rpt-flag-low,
    .rpt-flag-critical { color:#E24B4A; font-weight:500; }
    .rpt-ref { font-size:10px; color:#6B7280; }
    .rpt-footer { border-top:2px solid var(--lis-primary,#1D9E75); padding:10px 0 0; display:flex; align-items:center; justify-content:space-between; background:#F0FAF6; margin:0 -0px; padding:10px 18px; }
    .rpt-qr-area { display:flex; align-items:center; gap:9px; }
    .rpt-qr { width:42px; height:42px; background:#E1F5EE; border-radius:6px; display:flex; align-items:center; justify-content:center; i { font-size:22px; color:var(--lis-primary,#1D9E75); } }
    .rpt-qr-text { font-size:10px; color:#0F6E56; line-height:1.5; }
    .rpt-sign { text-align:right; }
    .rpt-sign-pre  { font-size:10px; color:#0F6E56; margin-bottom:3px; }
    .rpt-sign-name { font-size:12px; font-weight:500; color:#04342C; }
    .rpt-sign-role { font-size:10px; color:#0F6E56; }
    .rpt-sign-reg  { font-size:9px; color:#0F6E56; margin-top:2px; }
  `]
})
export class ReportsComponent {
  protected readonly reports  = REPORTS;
  protected readonly kftRows  = KFT_ROWS;
  selected = signal<ReportRow | null>(REPORTS[0]);
  initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0,2); }
}
