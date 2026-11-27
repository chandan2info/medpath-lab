import { Injectable, computed } from '@angular/core';
import { Sample, SampleStatus } from '../../shared/models/lis.models';
import { LabWorkflowMockService, MockLabSample } from './lab-workflow-mock.service';

const LEGACY_SAMPLES: Sample[] = [
  { id:'SMP-2406-087', patientId:'PAT-0316', patientName:'Arun Pillai', dob:'1965-03-12', gender:'male', refDoctor:'Dr. Rajesh Iyer', mobile:'9876543210', visitType:'walk-in', fastingStatus:'unknown', tests:['KFT','Urine R/M'], priority:'stat', status:'critical', collectedAt:'9:20 AM', etaLabel:'Now', tubes:[{id:'087-A',color:'#E24B4A',label:'Red top (SST)',tests:['KFT']},{id:'087-B',color:'#C9A227',label:'Yellow (Urine)',tests:['Urine R/M']}] },
  { id:'SMP-2406-084', patientId:'PAT-0318', patientName:'Kavitha Nair', dob:'1990-07-22', gender:'female', refDoctor:'Dr. Anjali Rao', mobile:'9845012345', visitType:'appointment', fastingStatus:'fasting', tests:['CBC','LFT'], priority:'routine', status:'processing', collectedAt:'9:55 AM', etaLabel:'11:30', tubes:[{id:'084-A',color:'#E24B4A',label:'Red top (SST)',tests:['LFT']},{id:'084-B',color:'#2B8B3E',label:'Green (EDTA)',tests:['CBC']}] },
  { id:'SMP-2406-085', patientId:'PAT-0317', patientName:'Suresh Menon', dob:'1958-11-05', gender:'male', refDoctor:'Dr. Meera Pillai', mobile:'9845023456', visitType:'walk-in', fastingStatus:'non-fasting', tests:['HbA1c','Lipids'], priority:'routine', status:'pending', collectedAt:'9:41 AM', etaLabel:'12:00', tubes:[{id:'085-A',color:'#9F4BA8',label:'Purple (EDTA)',tests:['HbA1c','Lipids']}] },
  { id:'SMP-2406-086', patientId:'PAT-0315', patientName:'Priya Sharma', dob:'1985-02-18', gender:'female', refDoctor:'Dr. Vikram Shah', mobile:'9845034567', visitType:'home-visit', fastingStatus:'unknown', tests:['Thyroid panel'], priority:'routine', status:'ready', collectedAt:'9:30 AM', etaLabel:'Done', tubes:[{id:'086-A',color:'#9F4BA8',label:'Purple (EDTA)',tests:['Thyroid panel']}] },
  { id:'SMP-2406-088', patientId:'PAT-0320', patientName:'Meena Joshi', dob:'1972-09-30', gender:'female', refDoctor:'Dr. Arjun Kumar', mobile:'9845045678', visitType:'appointment', fastingStatus:'fasting', tests:['CBC','ESR'], priority:'routine', status:'processing', collectedAt:'10:10 AM', etaLabel:'12:15', tubes:[{id:'088-A',color:'#E24B4A',label:'Red top (SST)',tests:['ESR','CBC']}] },
  { id:'SMP-2406-089', patientId:'PAT-0321', patientName:'Deepak Rao', dob:'1995-05-14', gender:'male', refDoctor:'Dr. Sunita Desai', mobile:'9845056789', visitType:'walk-in', fastingStatus:'non-fasting', tests:['Blood glucose'], priority:'routine', status:'ready', collectedAt:'10:22 AM', etaLabel:'Done', tubes:[{id:'089-A',color:'#2B8B3E',label:'Green (fluoride)',tests:['Blood glucose']}] },
];

@Injectable({ providedIn: 'root' })
export class SampleTrackingService {
  constructor(private readonly workflowStore: LabWorkflowMockService) { this.migrateLegacyQueue(); }
  readonly samples = computed<Sample[]>(() => this.workflowStore.samples().map(sample => this.toTrackingSample(sample)));

  getById(id: string | null | undefined): Sample | undefined { return id ? this.samples().find(sample => sample.id === id) : undefined; }
  getLatestByPatientId(patientId: string | null | undefined): Sample | undefined { return patientId ? this.samples().find(sample => sample.patientId === patientId) : undefined; }

  createFromCollection(input: Omit<Sample, 'id'>, workflow: {
    orderId: string; visitId: string; collector: string; checklist: string[]; notes: string;
    specimenGroups: Array<{tubeType:string;sampleType:string;testIds:string[]}>;
  }): Sample {
    const existing = this.workflowStore.samples().find(sample => sample.orderId === workflow.orderId);
    if (existing) return this.toTrackingSample(existing);
    const created = this.workflowStore.createSample({
      id: this.createSampleId(), orderId: workflow.orderId, visitId: workflow.visitId,
      patientId: input.patientId, patientName: input.patientName, gender: input.gender, dob: input.dob,
      testIds: [...input.tests], priority: input.priority, collectedAt: input.collectedAt,
      collector: workflow.collector, checklist: [...workflow.checklist], fastingStatus: input.fastingStatus,
      notes: workflow.notes, specimenGroups: workflow.specimenGroups,
      tracking: { mobile: input.mobile, refDoctor: input.refDoctor, visitType: input.visitType, etaLabel: input.etaLabel, tubes: input.tubes.map(tube => ({ ...tube, tests: [...tube.tests] })) },
      trackingStatus: input.status,
    });
    return this.toTrackingSample(created);
  }

  updateStatus(sampleId: string, status: SampleStatus): Sample | undefined {
    const current = this.workflowStore.samples().find(sample => sample.id === sampleId);
    if (!current) return undefined;
    const currentStatus = this.toTrackingSample(current).status;
    const allowed: Record<SampleStatus, SampleStatus[]> = {
      pending: ['received','rejected'], received: ['processing','rejected'], processing: ['ready','rejected'],
      ready: [], critical: ['processing','rejected'], rejected: ['pending'], dispatched: [],
    };
    if (currentStatus !== status && !allowed[currentStatus].includes(status)) throw new Error(`Invalid sample transition: ${currentStatus} → ${status}.`);
    const workflowStatus = status === 'received' ? 'received' : status === 'processing' ? 'processing' : status === 'rejected' ? 'rejected' : status === 'pending' ? 'collected' : current.status;
    if (workflowStatus !== current.status) this.workflowStore.updateSampleStatus(sampleId, workflowStatus);
    if (status === 'ready' || status === 'critical' || status === 'dispatched') this.workflowStore.updateSampleTrackingDetails(sampleId, { trackingStatus: status });
    return this.getById(sampleId);
  }

  receiveSample(id: string): Sample | undefined { return this.updateStatus(id, 'received'); }
  startProcessing(id: string): Sample | undefined { return this.updateStatus(id, 'processing'); }
  rejectSample(id: string, reason: string): Sample | undefined {
    const updated = this.updateStatus(id, 'rejected');
    if (!updated) return undefined;
    this.workflowStore.updateSampleTrackingDetails(id, { rejectionReason: reason.trim(), trackingStatus: 'rejected' });
    return this.getById(id);
  }
  requestRecollection(id: string): Sample | undefined {
    const updated = this.updateStatus(id, 'pending');
    if (!updated) return undefined;
    this.workflowStore.updateSampleTrackingDetails(id, { rejectionReason: undefined, trackingStatus: 'pending' });
    return this.getById(id);
  }

  private migrateLegacyQueue(): void {
    if (this.workflowStore.samples().length || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('medpath.samples.v1');
      const legacy = raw ? JSON.parse(raw) as unknown : LEGACY_SAMPLES;
      if (!Array.isArray(legacy)) return;
      for (const sample of legacy as Sample[]) {
        const status = sample.status === 'received' ? 'received' : sample.status === 'processing' ? 'processing' : sample.status === 'ready' ? 'results-entered' : sample.status === 'rejected' ? 'rejected' : sample.status === 'critical' ? 'processing' : 'collected';
        this.workflowStore.importTrackingSample({
          id: sample.id, orderId: `LEGACY-${sample.id}`, visitId: `LEGACY-VIS-${sample.id}`,
          patientId: sample.patientId, patientName: sample.patientName, gender: sample.gender, dob: sample.dob,
          testIds: [...sample.tests], priority: sample.priority, status, collectedAt: sample.collectedAt,
          collector: 'Legacy demo data', checklist: [], fastingStatus: sample.fastingStatus, notes: '',
          specimenGroups: sample.tubes.map(tube => ({ tubeType: tube.label, sampleType: tube.label, testIds: [...tube.tests] })),
          tracking: { mobile: sample.mobile, refDoctor: sample.refDoctor, visitType: sample.visitType, etaLabel: sample.etaLabel, tubes: sample.tubes.map(tube => ({ ...tube, tests: [...tube.tests] })), rejectionReason: sample.rejectionReason },
          trackingStatus: sample.status,
        });
      }
      localStorage.removeItem('medpath.samples.v1');
    } catch { /* Preserve the legacy key if migration fails. */ }
  }

  private toTrackingSample(sample: MockLabSample): Sample {
    return {
      id: sample.id, patientId: sample.patientId, patientName: sample.patientName, dob: sample.dob,
      gender: sample.gender, refDoctor: sample.tracking?.refDoctor, mobile: sample.tracking?.mobile,
      visitType: sample.tracking?.visitType, fastingStatus: sample.fastingStatus, tests: [...sample.testIds],
      priority: sample.priority, status: sample.trackingStatus ?? this.toLegacyStatus(sample.status),
      collectedAt: sample.collectedAt, etaLabel: sample.tracking?.etaLabel ?? 'Pending',
      rejectionReason: sample.tracking?.rejectionReason,
      tubes: (sample.tracking?.tubes ?? sample.specimenGroups.map((group, index) => ({ id: `${sample.id}-T${index + 1}`, color: '#888888', label: group.tubeType, tests: [...group.testIds] }))).map(tube => ({ ...tube, tests: [...tube.tests] })),
    };
  }
  private toLegacyStatus(status: MockLabSample['status']): SampleStatus {
    if (status === 'received') return 'received';
    if (status === 'processing' || status === 'results-entered' || status === 'awaiting-validation') return 'processing';
    if (status === 'validated') return 'ready';
    if (status === 'rejected') return 'rejected';
    return 'pending';
  }
  private createSampleId(): string {
    const date = new Date();
    const datePart = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `SMP-${datePart}-${String(this.workflowStore.samples().length + 1).padStart(3, '0')}`;
  }
}
