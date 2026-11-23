import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { SampleTrackingService } from '../../core/services/sample-tracking.service';
import { ResultFlag } from '../../shared/models/lis.models';

type TestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type TestFilter = 'ALL' | TestStatus;
type WorkflowStatus = 'COMPLETED' | 'PENDING';
interface MockParameter {
  id: string;
  name: string;
  method: string;
  value: string;
  unit: string;
  range: string;
  flag: ResultFlag;
  isCalculated?: boolean;
  note?: string;
  previousValue?: string;
}
interface MockOrderedTest {
  id: string;
  code: string;
  name: string;
  shortName: string;
  status: TestStatus;
  parameters: MockParameter[];
}
interface NoteDraft { parameterId: string; text: string; }
interface NotificationDraft { parameterId: string; recipient: string; channel: string; }

const createDemoTests = (): MockOrderedTest[] => [
  { id: 'KFT', code: 'KFT', name: 'Kidney Function Test (KFT)', shortName: 'KFT – Kidney Function Test', status: 'COMPLETED', parameters: [
    { id: 'cr', name: 'Serum creatinine', method: 'Enzymatic method', value: '2.4', unit: 'mg/dL', range: '0.7 – 1.3', flag: 'high', previousValue: '1.1' },
    { id: 'bun', name: 'Blood urea nitrogen', method: 'Urease', value: '48', unit: 'mg/dL', range: '7 – 20', flag: 'high', previousValue: '19' },
    { id: 'k', name: 'Serum potassium (K⁺)', method: 'ISE', value: '6.8', unit: 'mEq/L', range: '3.5 – 5.0', flag: 'critical', previousValue: '4.2', note: 'Demo note: verify sample integrity.' },
    { id: 'na', name: 'Serum sodium (Na⁺)', method: 'ISE', value: '138', unit: 'mEq/L', range: '136 – 145', flag: 'normal', previousValue: '139' },
    { id: 'ua', name: 'Serum uric acid', method: 'Uricase', value: '5.2', unit: 'mg/dL', range: '3.5 – 7.2', flag: 'normal', previousValue: '5.0' },
    { id: 'egfr', name: 'eGFR (CKD-EPI)', method: 'Calculated', value: '32', unit: 'mL/min/1.73 m²', range: '≥ 60', flag: 'low', isCalculated: true, previousValue: '82' },
  ] },
  { id: 'LFT', code: 'LFT', name: 'Liver Function Test (LFT)', shortName: 'LFT – Liver Function Test', status: 'COMPLETED', parameters: Array.from({length:8}, (_,i) => ({ id:`lft-${i}`, name:['Bilirubin total','Bilirubin direct','SGOT (AST)','SGPT (ALT)','Alkaline phosphatase','Total protein','Albumin','Globulin'][i], method:'Configured method', value:['0.8','0.2','28','32','92','7.1','4.2','2.9'][i], unit:i<2?'mg/dL':'U/L', range:'Configured range', flag:'normal' as ResultFlag })) },
  { id: 'CBC', code: 'CBC', name: 'Complete Blood Count (CBC)', shortName: 'CBC – Complete Blood Count', status: 'IN_PROGRESS', parameters: Array.from({length:22}, (_,i) => ({ id:`cbc-${i}`, name:['Haemoglobin','Total WBC count','Platelet count','RBC count','Haematocrit','MCV','MCH','MCHC','Neutrophils','Lymphocytes','Monocytes','Eosinophils','Basophils','RDW','MPV','PCV','PCT','PDW','ESR','ANC','ALC','Reticulocyte count'][i], method:'Configured method', value:i<16?['13.5','7800','210000','4.8','42','88','29','33','62','30','5','2','1','13','9','40'][i]:'', unit:'', range:'Configured range', flag:'normal' as ResultFlag })) },
  { id: 'HBA', code: 'HBA1C', name: 'HbA1c', shortName: 'HBA – Haemoglobin A1c', status: 'IN_PROGRESS', parameters: Array.from({length:4}, (_,i) => ({ id:`hba-${i}`, name:['HbA1c','Estimated average glucose','Interpretation','Method'][i], method:'Configured method', value:i<2?['6.2','131'][i]:'', unit:i===0?'%':'mg/dL', range:'Configured range', flag:'normal' as ResultFlag })) },
  ...[
    ['URI','Urine R/M – Routine & Microscopy',12],
    ['THY','Thyroid Profile',3],
    ['LIP','Lipid Profile',8],
    ['GLU','Blood Glucose',2],
    ['VTD','Vitamin D',1],
    ['B12','Vitamin B12',1],
    ['CRP','C-Reactive Protein',1],
    ['FER','Serum Ferritin',1],
  ].map(([id,name,count]) => ({ id:String(id), code:String(id), name:String(name), shortName:String(name), status:'PENDING' as TestStatus, parameters:Array.from({length:Number(count)},(_,i)=>({id:`${id}-${i}`,name:`Parameter ${i+1}`,method:'Configured method',value:'',unit:'',range:'Configured range',flag:'normal' as ResultFlag})) })),
];

@Component({
  selector: 'app-result-entry',
  standalone: true,
  imports: [RouterLink, NgClass, TitleCasePipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './result-entry.component.html',
  styleUrl: './result-entry.component.css',
})
export class ResultEntryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly flow = inject(PatientFlowService);
  private readonly sampleSvc = inject(SampleTrackingService);

  private readonly sampleId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('sampleId'))),
    { initialValue: this.route.snapshot.paramMap.get('sampleId') },
  );
  readonly sample = computed(() => {
    const routeSampleId = this.sampleId();
    return routeSampleId ? this.sampleSvc.getById(routeSampleId) : undefined;
  });
  readonly patient = computed(() => {
    const sample = this.sample();
    const flowPatient = this.flow.patient();
    if (!sample) return null;
    const samePatient = flowPatient?.id === sample.patientId;
    const [firstName, ...lastName] = sample.patientName.split(' ');
    return {
      firstName,
      lastName: lastName.join(' '),
      dob: sample.dob || (samePatient ? flowPatient.dob : ''),
      gender: sample.gender || (samePatient ? flowPatient.gender : ''),
      id: sample.patientId,
      mobile: sample.mobile || (samePatient ? flowPatient.mobile : ''),
      visitType: sample.visitType || (samePatient ? flowPatient.visitType : ''),
      fasting: sample.fastingStatus || (samePatient ? flowPatient.fasting : ''),
      refDoctor: sample.refDoctor || (samePatient ? flowPatient.refDoctor : ''),
    };
  });
  readonly sampleLabel = computed(() => this.sample()?.id ?? 'Active sample');
  readonly collectedLabel = computed(() => {
    const collectedAt = this.sample()?.collectedAt?.trim();
    if (!collectedAt) return '—';

    // Mock data currently stores a local time only (for example, "9:20 AM").
    if (/^\\d{1,2}:\\d{2}\\s?(AM|PM)$/i.test(collectedAt)) {
      return `Today, ${collectedAt.replace(/\\s+/g, ' ').toUpperCase()}`;
    }

    const collectedDate = new Date(collectedAt);
    if (Number.isNaN(collectedDate.getTime())) return collectedAt;

    const time = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(collectedDate);
    const isToday = collectedDate.toDateString() === new Date().toDateString();
    if (isToday) return `Today, ${time}`;

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(collectedDate);
  });
  readonly priorityLabel = computed(() => {
    const priority = this.sample()?.priority;
    if (priority === 'stat') return 'STAT';
    if (priority === 'urgent') return 'URGENT';
    if (priority === 'routine') return 'ROUTINE';
    return '—';
  });
  readonly visitTypeLabel = computed(() => this.patient()?.visitType || '—');
  readonly fastingLabel = computed(() => this.patient()?.fasting || 'Not specified');
  readonly orderedTestsLabel = computed(() => {
    // Use the same 12-test collection that drives the card count, not the
    // sample's raw test-code list (which may contain extra/legacy entries).
    const testCodes = this.tests().map(test => test.code);
    if (!testCodes.length) return '—';
    const visibleCodes = testCodes.slice(0, 5);
    const remainingCount = testCodes.length - visibleCodes.length;
    return remainingCount > 0
      ? `${visibleCodes.join(' · ')} · +${remainingCount}`
      : visibleCodes.join(' · ');
  });
  readonly patientInitials = computed(() => {
    const p = this.patient();
    return p ? (p.firstName[0] + (p.lastName[0] ?? '')).toUpperCase() : '?';
  });
  readonly patientAge = computed(() => {
    const dob = this.patient()?.dob;
    if (!dob) return '—';
    const birthDate = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) return '—';
    const today = new Date();
    if (birthDate > today) return '—';
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) { months -= 1; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years -= 1; months += 12; }
    return `${years}y ${months}m ${days}d`;
  });
  readonly tests = signal<MockOrderedTest[]>(createDemoTests());
  readonly selectedTestId = signal('KFT');
  readonly testSearch = signal('');
  readonly filter = signal<TestFilter>('ALL');
  readonly referenceProfiles = ['Adult Male', 'Adult Female', 'Child', 'Senior Adult'] as const;
  readonly selectedReferenceProfile = signal<string>('Adult Male');
  readonly showReferenceProfiles = signal(false);
  readonly showFilterMenu = signal(false);
  readonly leftCollapsed = signal(false);
  readonly workflowCollapsed = signal(false);
  readonly noteDraft = signal<NoteDraft | null>(null);
  readonly moreMenuId = signal<string | null>(null);
  readonly showNotificationDialog = signal(false);
  readonly notificationDraft = signal<NotificationDraft | null>(null);
  readonly showCriticalDetails = signal(false);
  readonly showDemoNotice = signal(false);
  readonly demoSavedState = signal<'idle' | 'unsaved'>('idle');
  readonly expandedRight = signal(true);

  readonly selectedTestIndex = computed(() => this.tests().findIndex(test => test.id === this.selectedTestId()));
  readonly selectedTestPosition = computed(() => Math.max(0, this.selectedTestIndex()) + 1);
  readonly isFirstTest = computed(() => this.selectedTestIndex() <= 0);
  readonly isLastTest = computed(() => this.selectedTestIndex() < 0 || this.selectedTestIndex() >= this.tests().length - 1);
  readonly selectedTest = computed(() => this.tests().find(test => test.id === this.selectedTestId()) ?? this.tests()[0]);
  /**
   * Derive workflow status from entered parameter values instead of relying
   * on the initial demo status. This keeps the chips and list accurate after
   * a result is entered or cleared.
   */
  effectiveTestStatus(test: MockOrderedTest): TestStatus {
    const entered = test.parameters.filter(parameter => parameter.value.trim() !== '').length;
    if (entered === 0) return 'PENDING';
    if (entered === test.parameters.length) return 'COMPLETED';
    return 'IN_PROGRESS';
  }

  readonly visibleTests = computed(() => {
    const q = this.testSearch().trim().toLowerCase();
    const selectedFilter = this.filter();
    return this.tests().filter(test => {
      const matchesStatus = selectedFilter === 'ALL' || this.effectiveTestStatus(test) === selectedFilter;
      const searchable = [test.name, test.shortName, test.code].join(' ').toLowerCase();
      return matchesStatus && (!q || searchable.includes(q));
    });
  });
  readonly enteredCount = computed(() => this.selectedTest().parameters.filter(p => p.value.trim() !== '').length);
  readonly totalCount = computed(() => this.selectedTest().parameters.length);
  readonly normalCount = computed(() => this.selectedTest().parameters.filter(p => p.value && p.flag === 'normal').length);
  readonly abnormalCount = computed(() => this.selectedTest().parameters.filter(p => p.value && (p.flag === 'high' || p.flag === 'low')).length);
  readonly criticalCount = computed(() => this.selectedTest().parameters.filter(p => p.value && p.flag === 'critical').length);
  readonly criticalParameters = computed(() => this.selectedTest().parameters.filter(p => p.flag === 'critical' && p.value));
  readonly hasCritical = computed(() => this.criticalParameters().length > 0);
  readonly activeParameter = computed(() => this.selectedTest().parameters.find(p => p.id === this.noteDraft()?.parameterId) ?? null);
  readonly testCount = computed(() => this.tests().length);
  readonly completedTests = computed(() => this.tests().filter(test => this.effectiveTestStatus(test) === 'COMPLETED').length);
  readonly pendingTests = computed(() => this.tests().filter(test => this.effectiveTestStatus(test) === 'PENDING').length);
  readonly inProgressTests = computed(() => this.tests().filter(test => this.effectiveTestStatus(test) === 'IN_PROGRESS').length);

  ngOnInit(): void {
    const routeSampleId = this.sampleId();
    if (routeSampleId) {
      if (!this.sample()) this.router.navigate(['/dashboard/tracking']);
      return;
    }

    // Resolve the selected patient to their own sample; never show a
    // different patient's first sample as a silent fallback.
    const selectedPatient = this.flow.patient();
    if (!selectedPatient) {
      this.router.navigate(['/dashboard/tracking']);
      return;
    }
    const patientSample = this.sampleSvc.getLatestByPatientId(selectedPatient.id);
    if (patientSample) {
      this.router.navigate(['/dashboard/results', patientSample.id], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard/collection'], { replaceUrl: true });
    }
  }

  previousTest(): void {
    const index = this.selectedTestIndex();
    if (index > 0) this.selectTest(this.tests()[index - 1].id);
  }
  nextTest(): void {
    const index = this.selectedTestIndex();
    if (index >= 0 && index < this.tests().length - 1) this.selectTest(this.tests()[index + 1].id);
  }
  selectTest(id: string): void {
    this.selectedTestId.set(id);
    this.moreMenuId.set(null);
    this.noteDraft.set(null);
  }
  setFilter(value: TestFilter): void { this.filter.set(value); this.showFilterMenu.set(false); }
  toggleFilterMenu(): void { this.showFilterMenu.update(open => !open); }
  toggleReferenceProfiles(): void { this.showReferenceProfiles.update(open => !open); }
  selectReferenceProfile(profile: string): void {
    this.selectedReferenceProfile.set(profile);
    this.showReferenceProfiles.set(false);
  }
  toggleLeftPanel(): void { this.leftCollapsed.update(value => !value); }
  toggleWorkflow(): void { this.workflowCollapsed.update(value => !value); }
  updateSearch(value: string): void { this.testSearch.set(value); }
  clearOrderedFilters(): void { this.testSearch.set(''); this.filter.set('ALL'); this.showFilterMenu.set(false); }

  updateResult(parameterId: string, value: string): void {
    this.updateParameter(parameterId, { value });
    this.demoSavedState.set('unsaved');
  }
  private updateParameter(parameterId: string, patch: Partial<MockParameter>): void {
    this.tests.update(tests => tests.map(test => test.id !== this.selectedTestId() ? test : {
      ...test,
      parameters: test.parameters.map(parameter => parameter.id === parameterId ? { ...parameter, ...patch } : parameter),
    }));
  }
  resultClass(flag: ResultFlag): string { return flag; }
  statusIcon(flag: ResultFlag): string {
    return ({ normal:'ti-check', high:'ti-alert-triangle', low:'ti-alert-triangle', critical:'ti-x' } as const)[flag];
  }
  flagLabel(flag: ResultFlag): string { return ({normal:'Normal',high:'High',low:'Low',critical:'Critical'})[flag]; }
  testEntered(test: MockOrderedTest): number { return test.parameters.filter(p => p.value.trim() !== '').length; }
  testStatusLabel(status: TestStatus): string { return ({PENDING:'Pending',IN_PROGRESS:'In Progress',COMPLETED:'Completed'})[status]; }
  ageBreakdown(): string { return this.patientAge(); }
  rangePct(parameter: MockParameter): number {
    const [low, high] = parameter.range.match(/[\d.]+/g)?.map(Number) ?? [];
    const value = Number(parameter.value);
    if (!Number.isFinite(value) || !Number.isFinite(low) || !Number.isFinite(high) || high <= low) return 50;
    return Math.max(4, Math.min(96, ((value - low) / (high - low)) * 100));
  }
  openNotes(parameter: MockParameter): void {
    this.noteDraft.set({ parameterId: parameter.id, text: parameter.note ?? '' });
    this.moreMenuId.set(null);
  }
  updateNote(value: string): void { this.noteDraft.update(draft => draft ? { ...draft, text: value } : null); }
  saveNote(): void {
    const draft = this.noteDraft();
    if (!draft) return;
    this.updateParameter(draft.parameterId, { note: draft.text.trim() || undefined });
    this.noteDraft.set(null);
  }
  closeNotes(): void { this.noteDraft.set(null); }
  toggleMore(id: string): void { this.moreMenuId.update(current => current === id ? null : id); }
  restorePrevious(parameter: MockParameter): void {
    if (parameter.previousValue === undefined) return;
    this.updateParameter(parameter.id, { value: parameter.previousValue });
    this.moreMenuId.set(null);
  }
  clearResult(parameter: MockParameter): void {
    const confirmed = window.confirm(`Clear the result for "${parameter.name}"? This demo action only changes local mock data.`);
    if (!confirmed) return;
    this.updateParameter(parameter.id, { value: '' });
    this.moreMenuId.set(null);
  }
  viewHistory(parameter: MockParameter): void {
    window.alert(`Demo result history for ${parameter.name}: current value ${parameter.value || '—'}.`);
    this.moreMenuId.set(null);
  }
  openNotification(parameter: MockParameter): void {
    this.notificationDraft.set({ parameterId: parameter.id, recipient: this.patient()?.refDoctor ?? '', channel: 'Phone' });
    this.showNotificationDialog.set(true);
  }
  closeNotification(): void { this.showNotificationDialog.set(false); }
  updateRecipient(value: string): void { this.notificationDraft.update(d => d ? {...d, recipient:value}:null); }
  confirmNotificationDemo(): void {
    this.showNotificationDialog.set(false);
    this.showDemoNotice.set(true);
  }
  saveDraft(): void {
    this.showDemoNotice.set(true);
    this.demoSavedState.set('idle');
  }
  validateDemo(): void { this.showDemoNotice.set(true); }
  submitReviewDemo(): void { this.showDemoNotice.set(true); }
  finalizeDemo(): void { this.showDemoNotice.set(true); }
  toggleCriticalDetails(): void { this.showCriticalDetails.update(v => !v); }
}
