import { Injectable, signal, computed } from '@angular/core';
import { KpiCard, Sample } from '../../shared/models/lis.models';

export interface DashboardAlert {
  level: 'red' | 'amber' | 'teal';
  text: string;
  time: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  /** In production these would be loaded via HTTP on init */
  private readonly _kpis = signal<KpiCard[]>([
    { id:'patients', label:'Patients today',    value:38,       delta:'↑ 12% vs yesterday', deltaUp:true,  icon:'users',           barPct:76,  barColor:'teal' },
    { id:'queue',    label:'Samples in queue',  value:8,        delta:'Processing / pending',               icon:'test-pipe',       barPct:35,  barColor:'amber' },
    { id:'reports',  label:'Reports ready',     value:5,        delta:'Awaiting dispatch',  deltaUp:true,  icon:'file-text',       barPct:50,  barColor:'teal' },
    { id:'dues',     label:'Pending payments',  value:'₹4,200', delta:'3 invoices unpaid',                  icon:'currency-rupee',  barPct:28,  barColor:'red' },
  ]);

  private readonly _worklist = signal<(Sample & { etaLabel: string })[]>([
    { id:'SMP-2406-087', patientId:'PAT-0316', patientName:'Arun Pillai',   tests:['KFT','Urine R/M'], priority:'stat',    status:'critical',   collectedAt:'9:20', etaLabel:'Now',   tubes:[] },
    { id:'SMP-2406-084', patientId:'PAT-0318', patientName:'Kavitha Nair',  tests:['CBC','LFT'],       priority:'routine', status:'processing', collectedAt:'9:55', etaLabel:'11:30', tubes:[] },
    { id:'SMP-2406-085', patientId:'PAT-0317', patientName:'Suresh Menon',  tests:['HbA1c','Lipids'],  priority:'routine', status:'pending',    collectedAt:'9:41', etaLabel:'12:00', tubes:[] },
    { id:'SMP-2406-086', patientId:'PAT-0315', patientName:'Priya Sharma',  tests:['Thyroid panel'],   priority:'routine', status:'ready',      collectedAt:'9:30', etaLabel:'Done',  tubes:[] },
  ]);

  private readonly _alerts = signal<DashboardAlert[]>([
    { level:'red',   text:'Critical value — Arun Pillai: K⁺ 6.8 mEq/L. Notify physician immediately.', time:'9:47 AM · SMP-2406-087' },
    { level:'red',   text:'5 reports pending dispatch — patients not yet notified.',                     time:'9:15 AM' },
    { level:'amber', text:'3 unpaid invoices totalling ₹4,200. Collect before report release.',          time:'8:30 AM' },
    { level:'teal',  text:'Home collection scheduled — Meena Joshi at 11:00 AM, Jayanagar.',             time:'8:00 AM' },
  ]);

  private readonly _stats = signal({ revenue:'₹18,450', samples:61, reportsDone:44 });

  readonly kpis      = this._kpis.asReadonly();
  readonly worklist  = this._worklist.asReadonly();
  readonly alerts    = this._alerts.asReadonly();
  readonly stats     = this._stats.asReadonly();

  /** Simulate a live refresh (wire to WebSocket / polling in production) */
  refresh(): void {
    // TODO: replace with HTTP call
  }
}

// NOTE: call dashboardData.syncBadges(navService) from AppComponent or MainLayout on init
// to populate live badge counts from the data snapshot.
