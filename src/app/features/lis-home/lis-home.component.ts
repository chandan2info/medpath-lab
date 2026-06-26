import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { UserSessionService } from '../../core/services/user-session.service';
import { KpiCard, Sample } from '../../shared/models/lis.models';

const KPI_CARDS: KpiCard[] = [
  { id:'patients', label:'Patients today',    value:38,       delta:'↑ 12% vs yesterday', deltaUp:true,  icon:'users',           barPct:76,  barColor:'teal' },
  { id:'queue',    label:'Samples in queue',  value:8,        delta:'Processing / pending',               icon:'test-pipe',       barPct:35,  barColor:'amber' },
  { id:'reports',  label:'Reports ready',     value:5,        delta:'Awaiting dispatch',  deltaUp:true,  icon:'file-text',       barPct:50,  barColor:'teal' },
  { id:'dues',     label:'Pending payments',  value:'₹4,200', delta:'3 invoices unpaid',                  icon:'currency-rupee',  barPct:28,  barColor:'red' },
];

const WORKLIST: (Sample & { etaLabel: string })[] = [
  { id:'SMP-2406-087', patientId:'PAT-0316', patientName:'Arun Pillai',   tests:['KFT','Urine R/M'], priority:'stat',    status:'critical',   collectedAt:'9:20', etaLabel:'Now',   tubes:[] },
  { id:'SMP-2406-084', patientId:'PAT-0318', patientName:'Kavitha Nair',  tests:['CBC','LFT'],       priority:'routine', status:'processing', collectedAt:'9:55', etaLabel:'11:30', tubes:[] },
  { id:'SMP-2406-085', patientId:'PAT-0317', patientName:'Suresh Menon',  tests:['HbA1c','Lipids'],  priority:'routine', status:'pending',    collectedAt:'9:41', etaLabel:'12:00', tubes:[] },
  { id:'SMP-2406-086', patientId:'PAT-0315', patientName:'Priya Sharma',  tests:['Thyroid panel'],   priority:'routine', status:'ready',      collectedAt:'9:30', etaLabel:'Done',  tubes:[] },
];

@Component({
  selector: 'app-lis-home',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Home</h1>
        <p class="page-sub">{{ today() }} · Lab open 8:00 AM – 8:00 PM</p>
      </div>
    </div>

    <!-- Welcome band -->
    <div class="welcome-band" role="region" aria-label="Day summary">
      <div class="wb-left">
        <div class="wb-greet">Good morning, {{ session.operator().name.split(' ')[0] }}.</div>
        <div class="wb-sub">8 samples in progress · 5 reports ready to dispatch · 1 STAT pending.</div>
        <div class="wb-pills" aria-hidden="true">
          <span class="wb-pill"><i class="ti ti-users"></i> 38 patients today</span>
          <span class="wb-pill"><i class="ti ti-bolt"></i> 1 STAT pending</span>
          <span class="wb-pill"><i class="ti ti-certificate"></i> NABL Accredited</span>
        </div>
      </div>
      <div class="wb-stats" aria-label="Today's totals">
        <div class="wb-stat"><div class="wb-stat-val">₹18,450</div><div class="wb-stat-lbl">Revenue today</div></div>
        <div class="wb-divider" aria-hidden="true"></div>
        <div class="wb-stat"><div class="wb-stat-val">61</div><div class="wb-stat-lbl">Samples</div></div>
        <div class="wb-divider" aria-hidden="true"></div>
        <div class="wb-stat"><div class="wb-stat-val">44</div><div class="wb-stat-lbl">Reports done</div></div>
      </div>
    </div>

    <!-- KPI grid -->
    <section class="kpi-grid" aria-label="Key metrics">
      @for (kpi of kpis; track kpi.id) {
        <lis-kpi-card [card]="kpi" />
      }
    </section>

    <!-- Worklist + Alerts -->
    <div class="home-row2">
      <!-- Worklist -->
      <div class="lis-card" role="region" aria-label="Urgent worklist">
        <div class="lis-card__header">
          <i class="ti ti-list-check" style="color:#E24B4A;font-size:15px" aria-hidden="true"></i>
          <h2 class="lis-card__title">Urgent worklist</h2>
          <span class="lis-badge lis-badge--danger">1 STAT · 1 critical</span>
          <a routerLink="/dashboard/tracking" class="lis-link" aria-label="View all samples">View all →</a>
        </div>
        <div class="worklist">
          @for (s of worklist; track s.id) {
            <div class="wl-item" [class.wl-item--stat]="s.priority === 'stat'">
              <span class="wl-dot" [class]="'wl-dot--' + s.status" aria-hidden="true"></span>
              <div class="wl-info">
                <div class="wl-name-row">
                  <span class="wl-name">{{ s.patientName }}</span>
                  <lis-status-pill [status]="s.priority === 'stat' ? 'stat' : s.status" />
                </div>
                <div class="wl-tests">{{ s.tests.join(' · ') }}</div>
                <div class="wl-sid lis-mono">{{ s.id }}</div>
              </div>
              <div class="wl-eta" [class.wl-eta--urgent]="s.etaLabel === 'Now'">{{ s.etaLabel }}</div>
            </div>
          }
        </div>
      </div>

      <!-- Alerts -->
      <div class="lis-card" role="region" aria-label="Lab alerts">
        <div class="lis-card__header">
          <i class="ti ti-bell" style="color:#E24B4A;font-size:15px" aria-hidden="true"></i>
          <h2 class="lis-card__title">Alerts</h2>
        </div>
        <div class="alert-list">
          <div class="alert-item" role="alert" aria-live="assertive">
            <span class="alert-dot alert-dot--red" aria-hidden="true"></span>
            <div>
              <div class="alert-text"><strong>Critical value</strong> — Arun Pillai: K⁺ 6.8 mEq/L. Notify physician immediately.</div>
              <div class="alert-time">9:47 AM · SMP-2406-087</div>
            </div>
          </div>
          <div class="alert-item">
            <span class="alert-dot alert-dot--red" aria-hidden="true"></span>
            <div>
              <div class="alert-text">5 reports pending dispatch — patients not yet notified.</div>
              <div class="alert-time">9:15 AM</div>
            </div>
          </div>
          <div class="alert-item">
            <span class="alert-dot alert-dot--amber" aria-hidden="true"></span>
            <div>
              <div class="alert-text">3 unpaid invoices totalling ₹4,200. Collect before report release.</div>
              <div class="alert-time">8:30 AM</div>
            </div>
          </div>
          <div class="alert-item">
            <span class="alert-dot alert-dot--teal" aria-hidden="true"></span>
            <div>
              <div class="alert-text">Home collection scheduled — Meena Joshi at 11:00 AM, Jayanagar.</div>
              <div class="alert-time">8:00 AM</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="lis-card" role="region" aria-label="Quick actions">
      <div class="lis-card__header">
        <i class="ti ti-apps" style="color:var(--lis-primary,#1D9E75);font-size:15px" aria-hidden="true"></i>
        <h2 class="lis-card__title">Quick actions</h2>
      </div>
      <div class="qa-grid">
        <a routerLink="/dashboard/registration" class="qa-btn">
          <i class="ti ti-user-plus" aria-hidden="true"></i> Register patient
        </a>
        <a routerLink="/dashboard/billing" class="qa-btn">
          <i class="ti ti-receipt" aria-hidden="true"></i> New invoice
        </a>
        <a routerLink="/dashboard/results" class="qa-btn">
          <i class="ti ti-writing" aria-hidden="true"></i> Enter results
        </a>
        <a routerLink="/dashboard/reports" class="qa-btn">
          <i class="ti ti-printer" aria-hidden="true"></i> Print report
        </a>
        <a routerLink="/dashboard/tracking" class="qa-btn">
          <i class="ti ti-test-pipe" aria-hidden="true"></i> Track sample
        </a>
        <a routerLink="/dashboard/history" class="qa-btn">
          <i class="ti ti-history" aria-hidden="true"></i> Patient history
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-header { margin-bottom: 14px; }
    .page-title  { font-size: 20px; font-weight: 500; color: var(--text-primary); margin: 0 0 2px; }
    .page-sub    { font-size: 12px; color: var(--text-secondary); margin: 0; }

    /* Welcome band */
    .welcome-band {
      background: var(--lis-primary, #1D9E75);
      border-radius: 10px; padding: 16px 20px;
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 16px; flex-wrap: wrap;
    }
    .wb-left { flex: 1; min-width: 220px; }
    .wb-greet { font-size: 16px; font-weight: 500; color: #fff; margin-bottom: 3px; }
    .wb-sub   { font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 10px; }
    .wb-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .wb-pill  {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.15); border-radius: 20px;
      padding: 3px 10px; font-size: 11px; color: rgba(255,255,255,0.9);
      i { font-size: 13px; }
    }
    .wb-stats   { display: flex; align-items: center; gap: 0; }
    .wb-stat    { text-align: right; padding: 0 16px; }
    .wb-stat-val{ font-size: 22px; font-weight: 500; color: #fff; line-height: 1; }
    .wb-stat-lbl{ font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px; }
    .wb-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.2); }

    /* KPI grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px; margin-bottom: 14px;
    }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 540px) { .kpi-grid { grid-template-columns: 1fr; } }

    /* Row 2 */
    .home-row2 {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 12px; margin-bottom: 12px;
    }
    @media (max-width: 800px) { .home-row2 { grid-template-columns: 1fr; } }

    /* Worklist */
    .worklist { display: flex; flex-direction: column; }
    .wl-item {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 9px 14px; border-bottom: 0.5px solid var(--border-color);
      cursor: pointer; transition: background 0.1s;
    }
    .wl-item:last-child { border-bottom: none; }
    .wl-item:hover { background: var(--body-bg); }
    .wl-item--stat { border-left: 3px solid #E24B4A; }
    .wl-dot {
      width: 7px; height: 7px; border-radius: 50%;
      flex-shrink: 0; margin-top: 5px;
    }
    .wl-dot--critical, .wl-dot--stat { background: #E24B4A; }
    .wl-dot--processing          { background: #EF9F27; }
    .wl-dot--pending             { background: #EF9F27; }
    .wl-dot--ready               { background: #1D9E75; }
    .wl-info { flex: 1; min-width: 0; }
    .wl-name-row { display: flex; align-items: center; gap: 6px; }
    .wl-name  { font-size: 12px; font-weight: 500; color: var(--text-primary); }
    .wl-tests { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
    .wl-sid   { font-size: 10px; }
    .wl-eta   { font-size: 10px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 0; margin-left: auto; }
    .wl-eta--urgent { color: #E24B4A; font-weight: 500; }

    /* Alerts */
    .alert-list { display: flex; flex-direction: column; }
    .alert-item {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 9px 14px; border-bottom: 0.5px solid var(--border-color);
      &:last-child { border-bottom: none; }
    }
    .alert-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .alert-dot--red   { background: #E24B4A; }
    .alert-dot--amber { background: #EF9F27; }
    .alert-dot--teal  { background: #1D9E75; }
    .alert-text { font-size: 12px; color: var(--text-primary); line-height: 1.4; }
    .alert-time { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }

    /* Quick actions */
    .qa-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 8px; padding: 12px 14px;
    }
    @media (max-width: 640px) { .qa-grid { grid-template-columns: repeat(2,1fr); } }
    .qa-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 11px; border: 0.5px solid var(--border-color);
      border-radius: 8px; cursor: pointer; font-size: 12px;
      color: var(--text-primary); background: var(--body-bg);
      text-decoration: none; transition: background 0.12s;
      i { font-size: 15px; color: var(--lis-primary, #1D9E75); }
      &:hover { background: var(--border-color); }
    }

    .lis-link {
      font-size: 12px; color: var(--lis-primary, #1D9E75);
      text-decoration: none; margin-left: auto;
      &:hover { text-decoration: underline; }
    }
  `],
})
export class LisHomeComponent {
  protected readonly session = inject(UserSessionService);
  protected readonly kpis    = KPI_CARDS;
  protected readonly worklist = WORKLIST;

  protected today = signal(
    new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  );
}
