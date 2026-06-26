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
    templateUrl: './sample-tracking.component.html',
    styleUrl: './sample-tracking.component.css',
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
