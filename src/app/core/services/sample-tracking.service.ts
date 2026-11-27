// ─────────────────────────────────────────────
//  SampleTrackingService
//  Single source of truth for the lab-wide sample
//  queue. Sample Tracking lists/filters/sorts these;
//  Result Entry looks one up by id (via the
//  `/dashboard/results/:sampleId` route) so the patient
//  bar always matches the row the user actually clicked.
// ─────────────────────────────────────────────
import { Injectable, inject, signal } from '@angular/core';
import { MockStorageService } from '../data-access/mock-storage.service';
import { Sample } from '../../shared/models/lis.models';
import { LabWorkflowMockService } from './lab-workflow-mock.service';

const SAMPLES: Sample[] = [
  { id:'SMP-2406-087', patientId:'PAT-0316', patientName:'Arun Pillai',   dob:'1965-03-12', gender:'male',   refDoctor:'Dr. Rajesh Iyer', mobile:'9876543210', visitType:'walk-in', fastingStatus:'unknown', tests:['KFT','Urine R/M'],  priority:'stat',    status:'critical',   collectedAt:'9:20 AM',  etaLabel:'Now',   tubes:[{id:'087-A',color:'#E24B4A',label:'Red top (SST)',   tests:['KFT']},{id:'087-B',color:'#C9A227',label:'Yellow (Urine)',tests:['Urine R/M']}] },
  { id:'SMP-2406-084', patientId:'PAT-0318', patientName:'Kavitha Nair',  dob:'1990-07-22', gender:'female', refDoctor:'Dr. Anjali Rao', mobile:'9845012345', visitType:'appointment', fastingStatus:'fasting', tests:['CBC','LFT'],         priority:'routine', status:'processing', collectedAt:'9:55 AM',  etaLabel:'11:30', tubes:[{id:'084-A',color:'#E24B4A',label:'Red top (SST)',   tests:['LFT']},{id:'084-B',color:'#2B8B3E',label:'Green (EDTA)', tests:['CBC']}] },
  { id:'SMP-2406-085', patientId:'PAT-0317', patientName:'Suresh Menon',  dob:'1958-11-05', gender:'male',   refDoctor:'Dr. Meera Pillai', mobile:'9845023456', visitType:'walk-in', fastingStatus:'non-fasting', tests:['HbA1c','Lipids'],    priority:'routine', status:'pending',    collectedAt:'9:41 AM',  etaLabel:'12:00', tubes:[{id:'085-A',color:'#9F4BA8',label:'Purple (EDTA)',   tests:['HbA1c','Lipids']}] },
  { id:'SMP-2406-086', patientId:'PAT-0315', patientName:'Priya Sharma',  dob:'1985-02-18', gender:'female', refDoctor:'Dr. Vikram Shah', mobile:'9845034567', visitType:'home-visit', fastingStatus:'unknown', tests:['Thyroid panel'],     priority:'routine', status:'ready',      collectedAt:'9:30 AM',  etaLabel:'Done',  tubes:[{id:'086-A',color:'#9F4BA8',label:'Purple (EDTA)',   tests:['Thyroid panel']}] },
  { id:'SMP-2406-088', patientId:'PAT-0320', patientName:'Meena Joshi',   dob:'1972-09-30', gender:'female', refDoctor:'Dr. Arjun Kumar', mobile:'9845045678', visitType:'appointment', fastingStatus:'fasting', tests:['CBC','ESR'],         priority:'routine', status:'processing', collectedAt:'10:10 AM', etaLabel:'12:15', tubes:[{id:'088-A',color:'#E24B4A',label:'Red top (SST)',   tests:['ESR','CBC']}] },
  { id:'SMP-2406-089', patientId:'PAT-0321', patientName:'Deepak Rao',    dob:'1995-05-14', gender:'male',   refDoctor:'Dr. Sunita Desai', mobile:'9845056789', visitType:'walk-in', fastingStatus:'non-fasting', tests:['Blood glucose'],     priority:'routine', status:'ready',      collectedAt:'10:22 AM', etaLabel:'Done',  tubes:[{id:'089-A',color:'#2B8B3E',label:'Green (fluoride)',tests:['Blood glucose']}] },
];

@Injectable({ providedIn: 'root' })
export class SampleTrackingService {
  constructor(private readonly workflowStore: LabWorkflowMockService) {}

  private readonly storage = inject(MockStorageService);

  private readonly storageKey = 'medpath.samples.v1';
  private readonly _samples = signal<Sample[]>(this.readSamples());

  private readSamples(): Sample[] {
    return this.storage.read<Sample[]>(
      this.storageKey,
      SAMPLES,
      (value): value is Sample[] => Array.isArray(value),
    );
  }

  private persistSamples(samples: Sample[]): void {
    this.storage.write(this.storageKey, samples);
  }

