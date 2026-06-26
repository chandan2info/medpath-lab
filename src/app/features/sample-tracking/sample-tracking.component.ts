import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { Sample, SampleStatus } from '../../shared/models/lis.models';

const SAMPLES: Sample[] = [
  { id:'SMP-2406-087', patientId:'PAT-0316', patientName:'Arun Pillai',          tests:['KFT','Urine R/M'],  priority:'stat',    status:'critical',   collectedAt:'9:20 AM', etaLabel:'Now',   tubes:[{id:'087-A',color:'#E24B4A',label:'Red top (SST)',    tests:['KFT']},{id:'087-B',color:'#C9A227',label:'Yellow (Urine)',tests:['Urine R/M']}] },
  { id:'SMP-2406-084', patientId:'PAT-0318', patientName:'Kavitha Nair',         tests:['CBC','LFT'],         priority:'routine', status:'processing', collectedAt:'9:55 AM', etaLabel:'11:30', tubes:[{id:'084-A',color:'#E24B4A',label:'Red top (SST)',    tests:['LFT']},{id:'084-B',color:'#2B8B3E',label:'Green (EDTA)',  tests:['CBC']}] },
  { id:'SMP-2406-085', patientId:'PAT-0317', patientName:'Suresh Menon',         tests:['HbA1c','Lipids'],    priority:'routine', status:'pending',    collectedAt:'9:41 AM', etaLabel:'12:00', tubes:[{id:'085-A',color:'#9F4BA8',label:'Purple (EDTA)',    tests:['HbA1c','Lipids']}] },
  { id:'SMP-2406-086', patientId:'PAT-0315', patientName:'Priya Sharma',         tests:['Thyroid panel'],     priority:'routine', status:'ready',      collectedAt:'9:30 AM', etaLabel:'Done',  tubes:[{id:'086-A',color:'#9F4BA8',label:'Purple (EDTA)',    tests:['Thyroid panel']}] },
  { id:'SMP-2406-088', patientId:'PAT-0320', patientName:'Meena Joshi',          tests:['CBC','ESR'],         priority:'routine', status:'processing', collectedAt:'10:10 AM',etaLabel:'12:15', tubes:[{id:'088-A',color:'#E24B4A',label:'Red top (SST)',    tests:['ESR','CBC']}] },
  { id:'SMP-2406-089', patientId:'PAT-0321', patientName:'Deepak Rao',           tests:['Blood glucose'],     priority:'routine', status:'ready',      collectedAt:'10:22 AM',etaLabel:'Done',  tubes:[{id:'089-A',color:'#2B8B3E',label:'Green (fluoride)', tests:['Blood glucose']}] },
];

const FILTER_OPTS: { label: string; value: SampleStatus | 'all' }[] = [
  { label:'All (61)',        value:'all' },
  { label:'STAT (1)',        value:'critical' },
  { label:'Processing (12)',value:'processing' },
  { label:'Pending (8)',     value:'pending' },
  { label:'Ready (40)',      value:'ready' },
];

@Component({
  selector: 'app-sample-tracking',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Toolbar -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Sample collection & tracking</h1>
        <nav aria-label="Breadcrumb"><ol class="breadcrumb">
          <li><a routerLink="/dashboard/home">Home</a></li>
          <li aria-current="page">Sample tracking</li>
        </ol></nav>
      </div>
      <div class="header-actions">
        <button class="lis-btn lis-btn--secondary lis-btn--sm">
          <i class="ti ti-printer" aria-hidden="true"></i> Print all labels
        </button>
        <button class="lis-btn lis-btn--primary lis-btn--sm">
          <i class="ti ti-plus" aria-hidden="true"></i> Add sample
        </button>
      </div>
    </div>

    <div class="tracking-toolbar">
      <div class="ts-search" role="search">
        <i class="ti ti-search" aria-hidden="true"></i>
        <input type="search" placeholder="Search by patient name or sample ID…" [(ngModel)]="searchQ"
          aria-label="Search samples" />
      </div>
      <div class="filter-pills" role="group" aria-label="Filter samples by status">
        @for (f of filterOpts; track f.value) {
          <button type="button" class="filter-pill"
            [class.filter-pill--active]="activeFilter() === f.value"
            (click)="activeFilter.set(f.value)"
            [attr.aria-pressed]="activeFilter() === f.value"
          >{{ f.label }}</button>
        }
      </div>
    </div>

    <div class="tracking-body">
      <!-- Sample table -->
      <div class="sample-table-wrap">
        <table class="sample-tbl" role="table" aria-label="Sample list">
          <thead>
            <tr>
              <th scope="col">Sample ID</th>
              <th scope="col">Patient</th>
              <th scope="col">Tube(s)</th>
              <th scope="col">Tests ordered</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">ETA</th>
            </tr>
          </thead>
          <tbody>
            @for (s of filteredSamples(); track s.id) {
              <tr (click)="selectSample(s)" [class.row--selected]="selectedSample()?.id === s.id"
                [attr.aria-selected]="selectedSample()?.id === s.id">
                <td><span class="lis-mono">{{ s.id }}</span></td>
                <td>
                  {{ s.patientName }}
                  <div style="font-size:10px;color:var(--text-secondary)">{{ s.patientId }}</div>
                </td>
                <td>
                  <div style="display:flex;gap:3px;align-items:center">
                    @for (tube of s.tubes; track tube.id) {
                      <span class="tube-dot" [style.background]="tube.color" [attr.title]="tube.label"></span>
                    }
                  </div>
                </td>
                <td style="font-size:12px">{{ s.tests.join(' · ') }}</td>
                <td>
                  @if (s.priority === 'stat') {
                    <lis-status-pill status="stat" />
                  } @else {
                    <span class="prio-label">Routine</span>
                  }
                </td>
                <td><lis-status-pill [status]="s.status" /></td>
                <td [class.eta-urgent]="s.etaLabel === 'Now'">{{ s.etaLabel }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Detail panel -->
      @if (selectedSample()) {
        <aside class="detail-panel lis-card" aria-label="Sample detail">
          <div class="lis-card__header">
            <div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">{{ selectedSample()!.patientName }}</div>
              <div class="lis-mono" style="margin-top:2px">{{ selectedSample()!.id }}</div>
            </div>
            @if (selectedSample()!.priority === 'stat') { <lis-status-pill status="stat" /> }
          </div>

          <div class="det-pat">
            <div class="det-av" aria-hidden="true">{{ initials(selectedSample()!.patientName) }}</div>
            <div>
              <div style="font-size:12px;font-weight:500;color:var(--text-primary)">{{ selectedSample()!.patientName }}</div>
              <div style="font-size:10px;color:var(--text-secondary)">{{ selectedSample()!.patientId }} · {{ selectedSample()!.tests.join(', ') }}</div>
            </div>
          </div>

          <div class="det-section">Sample info</div>
          <div class="det-row"><span class="det-lbl">Collected at</span><span class="det-val">{{ selectedSample()!.collectedAt }}</span></div>
          <div class="det-row"><span class="det-lbl">Priority</span>
            <span class="det-val" [class.det-val--urgent]="selectedSample()!.priority === 'stat'">
              {{ selectedSample()!.priority.toUpperCase() }}
            </span>
          </div>
          <div class="det-row"><span class="det-lbl">Status</span>
            <lis-status-pill [status]="selectedSample()!.status" />
          </div>

          <div class="det-section">Tubes assigned</div>
          <div class="tube-list">
            @for (tube of selectedSample()!.tubes; track tube.id) {
              <div class="tube-card">
                <div class="tube-body" [style.background]="tube.color"></div>
                <div class="tube-info">
                  <div class="tube-label">{{ tube.label }}</div>
                  <div class="tube-tests">{{ tube.tests.join(' · ') }}</div>
                </div>
                <div class="barcode" [attr.aria-label]="'Barcode for tube ' + tube.id">
                  <div class="bc-bars" aria-hidden="true">
                    @for (w of barcodeWidths; track $index) {
                      <div class="bc-bar" [style.width.px]="w"></div>
                    }
                  </div>
                  <div class="bc-num">{{ tube.id }}</div>
                </div>
              </div>
            }
          </div>

          <div class="det-actions">
            <a routerLink="/dashboard/results" class="lis-btn lis-btn--primary lis-btn--full">
              <i class="ti ti-writing" aria-hidden="true"></i> Enter results
            </a>
            <button type="button" class="lis-btn lis-btn--secondary lis-btn--full">
              <i class="ti ti-printer" aria-hidden="true"></i> Reprint labels
            </button>
          </div>
        </aside>
      }
    </div>
  `,
  styles:[`
    :host { display:block; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:12px; }
    .page-title  { font-size:20px; font-weight:500; color:var(--text-primary); margin:0 0 3px; }
    .breadcrumb  { display:flex; list-style:none; padding:0; margin:0; gap:6px; font-size:12px; color:var(--text-secondary); }
    .breadcrumb a { color:var(--text-secondary); text-decoration:none; &:hover{color:var(--lis-primary,#1D9E75);} }
    .breadcrumb li+li::before { content:'/'; margin-right:6px; }
    .header-actions { display:flex; gap:8px; }

    .tracking-toolbar {
      display:flex; align-items:center; gap:10px; flex-wrap:wrap;
      background:var(--card-bg); border:0.5px solid var(--border-color);
      border-radius:10px; padding:10px 14px; margin-bottom:12px;
    }
    .ts-search {
      display:flex; align-items:center; gap:7px; flex:1; max-width:300px;
      background:var(--body-bg); border:0.5px solid var(--border-color);
      border-radius:8px; padding:6px 10px;
      i { color:var(--text-secondary); font-size:14px; }
      input { background:transparent; border:none; outline:none; font-size:12px; color:var(--text-primary); flex:1; }
    }
    .filter-pills { display:flex; gap:6px; flex-wrap:wrap; }
    .filter-pill {
      font-size:11px; padding:5px 10px; border-radius:20px;
      border:0.5px solid var(--border-color); cursor:pointer;
      color:var(--text-secondary); background:var(--card-bg);
    }
    .filter-pill--active { background:var(--lis-primary-xlight,#E1F5EE); color:var(--lis-primary-deep,#085041); border-color:var(--lis-primary-mid,#5DCAA5); }

    .tracking-body { display:grid; grid-template-columns:1fr 290px; gap:12px; align-items:start; }
    @media (max-width:1000px) { .tracking-body { grid-template-columns:1fr; } }

    .sample-table-wrap { background:var(--card-bg); border:0.5px solid var(--border-color); border-radius:10px; overflow-x:auto; }
    .sample-tbl { width:100%; border-collapse:collapse; font-size:12px; min-width:600px; }
    .sample-tbl th {
      padding:8px 14px; text-align:left; font-size:10px; color:var(--text-secondary);
      font-weight:500; border-bottom:0.5px solid var(--border-color);
      text-transform:uppercase; letter-spacing:.04em; white-space:nowrap;
    }
    .sample-tbl td { padding:9px 14px; border-bottom:0.5px solid var(--border-color); color:var(--text-primary); vertical-align:middle; }
    .sample-tbl tbody tr { cursor:pointer; transition:background 0.1s; }
    .sample-tbl tbody tr:hover td { background:var(--body-bg); }
    .sample-tbl tbody tr.row--selected td { background:var(--lis-primary-xlight,#E1F5EE); }
    .sample-tbl tbody tr:last-child td { border-bottom:none; }

    .tube-dot { display:inline-block; width:12px; height:28px; border-radius:6px; }
    .prio-label { font-size:10px; color:var(--text-secondary); }
    .eta-urgent { color:#E24B4A; font-weight:500; }

    /* Detail panel */
    .detail-panel { position:sticky; top:80px; }
    .det-pat { padding:10px 14px; border-bottom:0.5px solid var(--border-color); display:flex; align-items:center; gap:9px; }
    .det-av { width:30px; height:30px; border-radius:50%; background:var(--lis-primary-xlight,#E1F5EE); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; color:var(--lis-primary-deep,#085041); }
    .det-section { padding:9px 14px 3px; font-size:10px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.05em; font-weight:500; }
    .det-row { display:flex; align-items:center; justify-content:space-between; padding:6px 14px; border-bottom:0.5px solid var(--border-color); &:last-of-type { border-bottom:none; } }
    .det-lbl { font-size:11px; color:var(--text-secondary); }
    .det-val { font-size:11px; color:var(--text-primary); font-weight:500; }
    .det-val--urgent { color:#E24B4A; }

    .tube-list { padding:8px 14px; display:flex; flex-direction:column; gap:7px; }
    .tube-card { display:flex; align-items:center; gap:9px; padding:8px 10px; border:0.5px solid var(--border-color); border-radius:8px; }
    .tube-body  { width:13px; height:36px; border-radius:7px; flex-shrink:0; }
    .tube-info  { flex:1; min-width:0; }
    .tube-label { font-size:11px; font-weight:500; color:var(--text-primary); }
    .tube-tests { font-size:10px; color:var(--text-secondary); }
    .barcode { display:flex; flex-direction:column; align-items:center; gap:3px; }
    .bc-bars { display:flex; gap:1px; height:20px; align-items:stretch; }
    .bc-bar  { border-radius:1px; background:var(--text-primary); }
    .bc-num  { font-size:9px; font-family:monospace; color:var(--text-secondary); }
    .det-actions { padding:12px 14px; display:flex; flex-direction:column; gap:7px; border-top:0.5px solid var(--border-color); }
  `]
})
export class SampleTrackingComponent {
  protected readonly filterOpts = FILTER_OPTS;
  protected readonly barcodeWidths = [2,1,3,1,2,1,1,2,3,1,2,1,2,3,1];

  searchQ      = '';
  activeFilter = signal<SampleStatus | 'all'>('all');
  selectedSample = signal<Sample | null>(SAMPLES[0]);

  filteredSamples = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQ.toLowerCase();
    return SAMPLES.filter(s =>
      (f === 'all' || s.status === f || (f === 'critical' && s.priority === 'stat')) &&
      (s.patientName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    );
  });

  selectSample(s: Sample): void { this.selectedSample.set(s); }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
