// ─────────────────────────────────────────────
//  SampleTrackingService
//  Single source of truth for the lab-wide sample
//  queue. Sample Tracking lists/filters/sorts these;
//  Result Entry looks one up by id (via the
//  `/dashboard/results/:sampleId` route) so the patient
//  bar always matches the row the user actually clicked.
// ─────────────────────────────────────────────
import { Injectable, signal } from '@angular/core';
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

  private readonly storageKey = 'medpath.samples.v1';
  private readonly _samples = signal<Sample[]>(this.readSamples());

  private readSamples(): Sample[] {
    try {
      if (typeof localStorage === 'undefined') return SAMPLES;
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return SAMPLES;
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed as Sample[] : SAMPLES;
    } catch {
      return SAMPLES;
    }
  }

  private persistSamples(samples: Sample[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(samples));
      }
    } catch {
      // Keep the in-memory queue usable if browser storage is unavailable.
    }
  }

  /** All samples currently in the lab queue. */
  readonly samples = this._samples.asReadonly();

  /** Looks up a single sample by id — used by Result Entry to resolve the
   *  `:sampleId` route param into the record the user clicked in Sample
   *  Tracking. Returns undefined if the id doesn't exist (e.g. stale link). */
  getById(id: string | null | undefined): Sample | undefined {
    if (!id) return undefined;
    return this._samples().find(s => s.id === id);
  }

  /** Resolve the latest sample belonging to a patient. */
  getLatestByPatientId(patientId: string | null | undefined): Sample | undefined {
    if (!patientId) return undefined;
    return this._samples().find(sample => sample.patientId === patientId);
  }

  /** Create or update the sample at the end of the collection workflow. */
  createFromCollection(input: Omit<Sample, 'id'>): Sample {
    // Every collection is a new visit/sample, even when the patient has
    // previous samples in the queue. Never overwrite historical records.
    const sample: Sample = { ...input, id: this.createSampleId() };
    this._samples.update(samples => {
      const next = [sample, ...samples];
      this.persistSamples(next);
      return next;
    });
    return sample;
  }

  updateStatus(sampleId: string, status: Sample['status']): Sample | undefined {
    const current = this.getById(sampleId);
    if (!current) return undefined;
    const allowed: Record<Sample['status'], Sample['status'][]> = {
      pending: ['received', 'rejected'],
      received: ['processing', 'rejected'],
      processing: ['ready', 'rejected'],
      ready: [],
      critical: ['processing', 'rejected'],
      rejected: ['pending'],
      dispatched: [],
    };
    if (current.status !== status && !allowed[current.status].includes(status)) {
      throw new Error(`Invalid sample transition: ${current.status} → ${status}.`);
    }

    const workflowSample = this.workflowStore.samples().find(sample => sample.id === sampleId);
    const workflowStatus = ({
      received: 'received', processing: 'processing', rejected: 'rejected', pending: 'collected',
    } as const)[status as 'received' | 'processing' | 'rejected' | 'pending'];
    if (workflowSample && workflowStatus) {
      this.workflowStore.updateSampleStatus(sampleId, workflowStatus);
    }
    const updated = { ...current, status };
    this._samples.update(samples => {
      const next = samples.map(sample => sample.id === sampleId ? updated : sample);
      this.persistSamples(next);
      return next;
    });
    return updated;
  }

  receiveSample(sampleId: string): Sample | undefined { return this.updateStatus(sampleId, 'received'); }
  startProcessing(sampleId: string): Sample | undefined { return this.updateStatus(sampleId, 'processing'); }
  rejectSample(sampleId: string, reason: string): Sample | undefined {
    const current = this.getById(sampleId);
    if (!current) return undefined;
    const updated = this.updateStatus(sampleId, 'rejected');
    if (!updated) return undefined;
    const withReason = { ...updated, rejectionReason: reason.trim() };
    this._samples.update(samples => {
      const next = samples.map(sample => sample.id === sampleId ? withReason : sample);
      this.persistSamples(next);
      return next;
    });
    return withReason;
  }
  requestRecollection(sampleId: string): Sample | undefined {
    const updated = this.updateStatus(sampleId, 'pending');
    if (!updated) return undefined;
    const { rejectionReason: _reason, ...recollected } = updated;
    this._samples.update(samples => {
      const next = samples.map(sample => sample.id === sampleId ? recollected : sample);
      this.persistSamples(next);
      return next;
    });
    return recollected;
  }

  private createSampleId(): string {
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sequence = String(this._samples().length + 1).padStart(3, '0');
    return `SMP-${datePart}-${sequence}`;
  }
}
