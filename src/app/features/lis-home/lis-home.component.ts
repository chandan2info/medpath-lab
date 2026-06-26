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
    templateUrl: './lis-home.component.html',
    styleUrl: './lis-home.component.css',
})
export class LisHomeComponent {
  protected readonly session = inject(UserSessionService);
  protected readonly kpis    = KPI_CARDS;
  protected readonly worklist = WORKLIST;

  protected today = signal(
    new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  );
}
