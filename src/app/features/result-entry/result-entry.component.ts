import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultParameter, ResultFlag } from '../../shared/models/lis.models';

interface ParamRow extends ResultParameter {
  editing: boolean;
}

const KFT_PARAMS: ParamRow[] = [
  { id:'cr',  name:'Serum creatinine',      value:'2.4',  unit:'mg/dL',  refLow:0.7, refHigh:1.3,  refLabel:'0.7 – 1.3',  flag:'high',     editing:false },
  { id:'bun', name:'Blood urea nitrogen',   value:'48',   unit:'mg/dL',  refLow:7,   refHigh:20,   refLabel:'7 – 20',     flag:'high',     editing:false },
  { id:'k',   name:'Serum potassium (K⁺)',  value:'6.8',  unit:'mEq/L',  refLow:3.5, refHigh:5.0,  refLabel:'3.5 – 5.0',  flag:'critical', editing:false },
  { id:'na',  name:'Serum sodium (Na⁺)',    value:'138',  unit:'mEq/L',  refLow:136, refHigh:145,  refLabel:'136 – 145',  flag:'normal',   editing:false },
  { id:'ua',  name:'Serum uric acid',       value:'5.2',  unit:'mg/dL',  refLow:3.5, refHigh:7.2,  refLabel:'3.5 – 7.2',  flag:'normal',   editing:false },
  { id:'egfr',name:'eGFR (CKD-EPI)',        value:'32',   unit:'mL/min', refLow:60,  refHigh:null, refLabel:'≥ 60',       flag:'low',      editing:false },
];

@Component({
  selector: 'app-result-entry',
  standalone: true,
  imports: [RouterLink, NgClass, NgStyle, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Result entry</h1>
        <nav aria-label="Breadcrumb"><ol class="breadcrumb">
          <li><a routerLink="/dashboard/home">Home</a></li>
          <li><a routerLink="/dashboard/tracking">Tracking</a></li>
          <li aria-current="page">Arun Pillai — SMP-2406-087</li>
        </ol></nav>
      </div>
      <div class="autosave-chip" aria-live="polite">
        <i class="ti ti-clock" aria-hidden="true"></i> Autosaved 10:44
      </div>
    </div>

    <div class="re-layout">
      <!-- Left: entry area -->
      <div class="re-main">
        <!-- Patient bar -->
        <div class="pat-bar">
          <div class="pat-av" aria-hidden="true">AP</div>
          <div class="pat-info">
            <div class="pat-name">Arun Pillai</div>
            <div class="pat-meta">61 yrs · Male · PAT-2406-0316 · SMP-2406-087 · Ref: Dr. Suresh Menon</div>
          </div>
          <span class="stat-chip" aria-label="STAT priority">STAT</span>
        </div>

        <!-- Tab bar -->
        <div class="tab-bar" role="tablist" aria-label="Test tabs">
          @for (tab of tabs; track tab) {
            <button type="button" class="tab" role="tab"
              [class.tab--active]="activeTab() === tab"
              [attr.aria-selected]="activeTab() === tab"
              (click)="activeTab.set(tab)"
            >{{ tab }}</button>
          }
        </div>

        <!-- Critical banner -->
        @if (hasCritical()) {
          <div class="critical-banner" role="alert" aria-live="assertive">
            <i class="ti ti-alert-octagon" aria-hidden="true"></i>
            <div class="critical-text">
              <strong>Critical value detected</strong> — Serum Potassium (K⁺) is 6.8 mEq/L,
              significantly above the critical threshold of 6.0.
              Please notify the referring physician immediately before report dispatch.
            </div>
          </div>
        }

        <!-- Result table -->
        <div class="result-card lis-card">
          <div class="lis-card__header">
            <i class="ti ti-test-pipe" style="color:var(--lis-primary,#1D9E75);font-size:14px" aria-hidden="true"></i>
            <h2 class="lis-card__title">Kidney function test (KFT)</h2>
            <span class="lis-badge lis-badge--danger">
              <i class="ti ti-alert-triangle" style="font-size:10px"></i> 2 critical
            </span>
          </div>
          <div style="overflow-x:auto">
            <table class="result-tbl" role="table" aria-label="KFT result entry">
              <thead>
                <tr>
                  <th scope="col">Parameter</th>
                  <th scope="col">Result</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Reference range</th>
                  <th scope="col">Flag</th>
                  <th scope="col" class="sr-only">Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (p of params; track p.id; let i = $index) {
                  <tr>
                    <td class="param-name" [class.param-critical]="p.flag === 'critical'">{{ p.name }}</td>
                    <td>
                      <div class="result-input-wrap">
                        <input
                          class="result-input"
                          [class]="'result-input--' + p.flag"
                          type="number"
                          [(ngModel)]="params[i].value"
                          (ngModelChange)="evalFlag(i)"
                          [attr.aria-label]="p.name + ' result'"
                        />
                        @if (p.flag === 'high' || p.flag === 'critical') {
                          <span class="arrow-up" aria-hidden="true">
                            {{ p.flag === 'critical' ? '↑↑' : '↑' }}
                          </span>
                        }
                        @if (p.flag === 'low') {
                          <span class="arrow-dn" aria-hidden="true">↓</span>
                        }
                      </div>
                    </td>
                    <td class="unit-cell">{{ p.unit }}</td>
                    <td class="ref-cell">{{ p.refLabel }}</td>
                    <td>
                      <span class="lis-flag" [class]="'lis-flag--' + p.flag">
                        {{ flagLabel(p.flag) }}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="note-btn" [attr.aria-label]="'Add note for ' + p.name">
                        <i class="ti ti-message-circle" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: summary -->
      <aside class="re-side" aria-label="Entry summary">
        <div class="lis-card side-card">
          <div class="lis-card__header">
            <h2 class="lis-card__title">Test summary</h2>
          </div>
          <div class="side-rows">
            <div class="side-row"><span>Sample ID</span><span class="lis-mono" style="font-size:10px">SMP-2406-087</span></div>
            <div class="side-row"><span>Tests ordered</span><span>KFT · Urine R/M</span></div>
            <div class="side-row"><span>Collected</span><span>9:20 AM</span></div>
            <div class="side-row"><span>Priority</span><span class="stat-chip stat-chip--sm">STAT</span></div>
          </div>

          <!-- Progress ring -->
          <div class="progress-wrap">
            <svg viewBox="0 0 80 80" width="80" height="80" aria-label="6 of 8 parameters entered" role="img">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--body-bg)" stroke-width="8"/>
              <circle cx="40" cy="40" r="34" fill="none"
                stroke="var(--lis-primary,#1D9E75)" stroke-width="8"
                stroke-dasharray="213.6" stroke-dashoffset="53"
                stroke-linecap="round" transform="rotate(-90 40 40)"/>
            </svg>
            <div class="ring-label" aria-hidden="true">
              <span class="ring-val">{{ pct() }}%</span>
              <span class="ring-sub">entered</span>
            </div>
          </div>
          <div class="progress-caption">{{ enteredCount() }} of {{ params.length }} parameters entered</div>

          <!-- Flag summary -->
          <div class="side-section">Flags</div>
          <div class="side-rows">
            <div class="side-row"><span>Normal</span><span style="color:#0F6E56;font-weight:500">{{ normalCount() }}</span></div>
            <div class="side-row"><span>Abnormal</span><span style="color:#E24B4A;font-weight:500">{{ abnCount() }}</span></div>
            <div class="side-row"><span>Critical</span><span style="color:#E24B4A;font-weight:500">{{ critCount() }}</span></div>
          </div>

          <!-- Notify box -->
          @if (hasCritical()) {
            <div class="notify-box" role="status">
              <i class="ti ti-phone" aria-hidden="true"></i>
              Notify Dr. Suresh Menon before report dispatch — critical K⁺ value.
            </div>
          }

          <div class="side-actions">
            <a routerLink="/dashboard/reports" class="lis-btn lis-btn--primary lis-btn--full">
              <i class="ti ti-file-text" aria-hidden="true"></i> Finalise & generate report
            </a>
            <button type="button" class="lis-btn lis-btn--secondary lis-btn--full">
              <i class="ti ti-device-floppy" aria-hidden="true"></i> Save draft
            </button>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles:[`
    :host { display:block; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:14px; }
    .page-title  { font-size:20px; font-weight:500; color:var(--text-primary); margin:0 0 3px; }
    .breadcrumb  { display:flex; list-style:none; padding:0; margin:0; gap:6px; font-size:12px; color:var(--text-secondary); }
    .breadcrumb a { color:var(--text-secondary); text-decoration:none; }
    .breadcrumb li+li::before { content:'/'; margin-right:6px; }
    .autosave-chip { display:flex; align-items:center; gap:5px; padding:5px 10px; border:0.5px solid var(--border-color); border-radius:7px; font-size:11px; color:var(--text-secondary); background:var(--card-bg); i { font-size:13px; } }

    .re-layout { display:grid; grid-template-columns:1fr 252px; gap:14px; align-items:start; }
    @media (max-width:900px) { .re-layout { grid-template-columns:1fr; } }
    .re-main { display:flex; flex-direction:column; gap:0; background:var(--card-bg); border:0.5px solid var(--border-color); border-radius:10px; overflow:hidden; }

    .pat-bar { display:flex; align-items:center; gap:10px; padding:11px 14px; border-bottom:0.5px solid var(--border-color); }
    .pat-av  { width:34px; height:34px; border-radius:50%; background:var(--lis-primary-xlight,#E1F5EE); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:500; color:var(--lis-primary-deep,#085041); flex-shrink:0; }
    .pat-name { font-size:13px; font-weight:500; color:var(--text-primary); }
    .pat-meta { font-size:11px; color:var(--text-secondary); margin-top:1px; }
    .pat-info { flex:1; }
    .stat-chip { background:#E24B4A; color:#fff; font-size:10px; font-weight:500; padding:2px 8px; border-radius:10px; }
    .stat-chip--sm { padding:1px 6px; font-size:10px; }

    .tab-bar { display:flex; border-bottom:0.5px solid var(--border-color); padding:0 14px; }
    .tab { padding:10px 13px; font-size:12px; color:var(--text-secondary); cursor:pointer; border-bottom:2px solid transparent; background:none; border-top:none; border-left:none; border-right:none; font-family:var(--font-family); }
    .tab--active { color:var(--lis-primary,#1D9E75); border-bottom-color:var(--lis-primary,#1D9E75); font-weight:500; }

    .critical-banner { background:#FCEBEB; border:0.5px solid #F09595; margin:12px 14px 0; border-radius:8px; padding:9px 12px; display:flex; align-items:flex-start; gap:8px; i { color:#E24B4A; font-size:16px; flex-shrink:0; margin-top:1px; } }
    .critical-text { font-size:11px; color:#791F1F; line-height:1.5; }

    .result-card { border:none !important; border-radius:0 !important; }
    .result-tbl { width:100%; border-collapse:collapse; font-size:12px; min-width:480px; }
    .result-tbl th { padding:7px 14px; text-align:left; font-size:10px; color:var(--text-secondary); font-weight:500; border-bottom:0.5px solid var(--border-color); text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; }
    .result-tbl td { padding:7px 14px; border-bottom:0.5px solid var(--border-color); color:var(--text-primary); vertical-align:middle; }
    .result-tbl tbody tr:last-child td { border-bottom:none; }
    .param-name { font-size:12px; }
    .param-critical { font-weight:500; color:#E24B4A; }
    .result-input-wrap { display:flex; align-items:center; gap:5px; }
    .result-input { width:82px; height:30px; border:0.5px solid var(--border-color); border-radius:6px; padding:0 8px; font-size:12px; text-align:right; color:var(--text-primary); background:var(--card-bg); outline:none; font-family:var(--font-family); }
    .result-input--normal   { border-color:var(--lis-primary,#1D9E75); color:#0F6E56; }
    .result-input--high,
    .result-input--low,
    .result-input--critical { border-color:#E24B4A; color:#E24B4A; background:#FCEBEB; }
    .arrow-up { font-size:11px; color:#E24B4A; font-weight:500; }
    .arrow-dn { font-size:11px; color:#0C447C; font-weight:500; }
    .unit-cell { font-size:11px; color:var(--text-secondary); }
    .ref-cell  { font-size:10px; color:var(--text-secondary); }
    .note-btn  { background:none; border:none; cursor:pointer; color:var(--text-secondary); font-size:14px; &:hover { color:var(--lis-primary,#1D9E75); } }

    /* Side panel */
    .side-card  { position:sticky; top:80px; }
    .side-rows  { display:flex; flex-direction:column; }
    .side-row   { display:flex; justify-content:space-between; padding:6px 14px; border-bottom:0.5px solid var(--border-color); font-size:11px; color:var(--text-secondary); &:last-child{border-bottom:none;} span:last-child { font-weight:500; color:var(--text-primary); } }
    .progress-wrap { display:flex; justify-content:center; padding:14px 14px 4px; position:relative; }
    .ring-label { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; pointer-events:none; }
    .ring-val   { display:block; font-size:18px; font-weight:500; color:var(--text-primary); }
    .ring-sub   { display:block; font-size:10px; color:var(--text-secondary); }
    .progress-caption { text-align:center; font-size:11px; color:var(--text-secondary); padding:0 14px 10px; }
    .side-section { padding:8px 14px 3px; font-size:10px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.05em; font-weight:500; border-top:0.5px solid var(--border-color); }
    .notify-box { background:#FAEEDA; border-radius:7px; padding:9px 11px; margin:10px 14px; font-size:11px; color:#633806; display:flex; gap:6px; align-items:flex-start; i { font-size:13px; flex-shrink:0; margin-top:1px; } }
    .side-actions { padding:12px 14px; display:flex; flex-direction:column; gap:7px; border-top:0.5px solid var(--border-color); }
  `]
})
export class ResultEntryComponent {
  protected readonly tabs = ['KFT (Kidney function)', 'Urine R/M', 'Haematology'];
  activeTab = signal('KFT (Kidney function)');
  params: ParamRow[] = [...KFT_PARAMS];

  hasCritical = computed(() => this.params.some(p => p.flag === 'critical'));
  enteredCount = computed(() => this.params.filter(p => p.value !== '').length);
  pct = computed(() => Math.round(this.enteredCount() / this.params.length * 100));
  normalCount  = computed(() => this.params.filter(p => p.flag === 'normal').length);
  abnCount     = computed(() => this.params.filter(p => p.flag === 'high' || p.flag === 'low').length);
  critCount    = computed(() => this.params.filter(p => p.flag === 'critical').length);

  evalFlag(i: number): void {
    const p = this.params[i];
    const v = parseFloat(p.value);
    if (isNaN(v)) { p.flag = 'normal'; return; }
    if (p.id === 'k' && v > 6.0) { p.flag = 'critical'; return; }
    if (p.refHigh !== null && v > p.refHigh) { p.flag = 'high'; return; }
    if (p.refLow !== null && v < p.refLow)   { p.flag = 'low';  return; }
    p.flag = 'normal';
  }

  flagLabel(f: ResultFlag): string {
    return { normal:'Normal', high:'High', low:'Low', critical:'Critical' }[f] ?? f;
  }
}
