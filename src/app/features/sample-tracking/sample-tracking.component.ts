// ─────────────────────────────────────────────
//  Screen 4 — Sample Collection & Tracking
//  Shows current patient's samples at top for
//  immediate collection after billing.
// ─────────────────────────────────────────────
import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, DatePipe, TitleCasePipe } from '@angular/common';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { Sample, SampleStatus } from '../../shared/models/lis.models';
import { PatientFlowService } from '../../core/services/patient-flow.service';

const SAMPLES: Sample[] = [
  { id:'SMP-2406-087', patientId:'PAT-0316', patientName:'Arun Pillai',     tests:['KFT','Urine R/M'],  priority:'stat',    status:'critical',   collectedAt:'9:20 AM',  etaLabel:'Now',   tubes:[{id:'087-A',color:'#E24B4A',label:'Red top (SST)',   tests:['KFT']},{id:'087-B',color:'#C9A227',label:'Yellow (Urine)',tests:['Urine R/M']}] },
  { id:'SMP-2406-084', patientId:'PAT-0318', patientName:'Kavitha Nair',    tests:['CBC','LFT'],         priority:'routine', status:'processing', collectedAt:'9:55 AM',  etaLabel:'11:30', tubes:[{id:'084-A',color:'#E24B4A',label:'Red top (SST)',   tests:['LFT']},{id:'084-B',color:'#2B8B3E',label:'Green (EDTA)', tests:['CBC']}] },
  { id:'SMP-2406-085', patientId:'PAT-0317', patientName:'Suresh Menon',    tests:['HbA1c','Lipids'],    priority:'routine', status:'pending',    collectedAt:'9:41 AM',  etaLabel:'12:00', tubes:[{id:'085-A',color:'#9F4BA8',label:'Purple (EDTA)',   tests:['HbA1c','Lipids']}] },
  { id:'SMP-2406-086', patientId:'PAT-0315', patientName:'Priya Sharma',    tests:['Thyroid panel'],     priority:'routine', status:'ready',      collectedAt:'9:30 AM',  etaLabel:'Done',  tubes:[{id:'086-A',color:'#9F4BA8',label:'Purple (EDTA)',   tests:['Thyroid panel']}] },
  { id:'SMP-2406-088', patientId:'PAT-0320', patientName:'Meena Joshi',     tests:['CBC','ESR'],         priority:'routine', status:'processing', collectedAt:'10:10 AM', etaLabel:'12:15', tubes:[{id:'088-A',color:'#E24B4A',label:'Red top (SST)',   tests:['ESR','CBC']}] },
  { id:'SMP-2406-089', patientId:'PAT-0321', patientName:'Deepak Rao',      tests:['Blood glucose'],     priority:'routine', status:'ready',      collectedAt:'10:22 AM', etaLabel:'Done',  tubes:[{id:'089-A',color:'#2B8B3E',label:'Green (fluoride)',tests:['Blood glucose']}] },
];

const FILTER_OPTS: { label: string; value: SampleStatus | 'all' }[] = [
  { label: 'All',        value: 'all'        },
  { label: 'STAT',       value: 'critical'   },
  { label: 'Processing', value: 'processing' },
  { label: 'Pending',    value: 'pending'    },
  { label: 'Ready',      value: 'ready'      },
];

const TUBE_COLORS: Record<string, string> = {
  'Haematology':   '#2B8B3E',
  'Biochemistry':  '#E24B4A',
  'Endocrinology': '#9F4BA8',
  'Urine':         '#C9A227',
};

@Component({
  selector: 'app-sample-tracking',
  standalone: true,
  imports: [RouterLink, NgClass, StatusPillComponent, DatePipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample-tracking.component.html',
  styleUrl: './sample-tracking.component.css',
})
export class SampleTrackingComponent implements OnInit {
  protected readonly flow        = inject(PatientFlowService);
  protected readonly filterOpts  = FILTER_OPTS;
  protected readonly barcodeWidths = [2,1,3,1,2,1,1,2,3,1,2,1,2,3,1];
  protected readonly now          = new Date();

  searchQ        = signal('');
  activeFilter   = signal<SampleStatus | 'all'>('all');
  selectedSample = signal<Sample | null>(SAMPLES[0]);

  // Current patient's tubes (derived from test order)
  currentPatientTubes = computed(() => {
    const p = this.flow.patient();
    const tests = this.flow.selectedTests();
    if (!p || tests.length === 0) return [];

    // Group tests by tube colour category
    const groups: Record<string, string[]> = {};
    for (const t of tests) {
      const color = TUBE_COLORS[t.category] ?? '#888';
      if (!groups[color]) groups[color] = [];
      groups[color].push(t.name);
    }

    return Object.entries(groups).map(([color, testNames], i) => ({
      id: `${p.id}-T${i+1}`,
      color,
      label: this.tubeLabel(color),
      tests: testNames,
    }));
  });

  collected = signal(false);
  collectedAt = signal('');

  ngOnInit(): void {}

  filteredSamples = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQ().toLowerCase();
    return SAMPLES.filter(s =>
      (f === 'all' || s.status === f || (f === 'critical' && s.priority === 'stat')) &&
      (s.patientName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    );
  });

  selectSample(s: Sample): void { this.selectedSample.set(s); }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  markCollected(): void {
    const now = new Date();
    this.collectedAt.set(
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
    this.collected.set(true);
  }

  private tubeLabel(color: string): string {
    const map: Record<string,string> = {
      '#2B8B3E': 'Green top (EDTA)',
      '#E24B4A': 'Red top (SST)',
      '#9F4BA8': 'Purple (EDTA)',
      '#C9A227': 'Yellow (Urine)',
    };
    return map[color] ?? 'Plain tube';
  }

  get patient() { return this.flow.patient(); }
  get patientInitials(): string {
    const p = this.patient;
    if (!p) return '?';
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
  }
  get patientAge(): string {
    const p = this.patient;
    if (!p) return '';
    return this.flow.calcAge(p.dob) + ' yrs';
  }
}
