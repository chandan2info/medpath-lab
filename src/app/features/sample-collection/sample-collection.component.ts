// ─────────────────────────────────────────────
//  Lab Workflow — Sample Collection
//  Phlebotomy workstation for collecting
//  specimens against a registered and billed
//  patient order. This is separate from the
//  Patient Workflow.
//  Redesigned per UX review (2026-07) to read as
//  a high-frequency operational workstation
//  rather than a dashboard card:
//   - patient identity + status dominate
//   - tubes shown as high-contrast cards
//   - collection panel ordered as a workflow
//   - collection checklist fills the empty space
//   - full process timeline, not just 4 steps
//  (For the lab-wide queue view, see Sample Tracking.)
// ─────────────────────────────────────────────
import { Component, signal, computed, inject, ChangeDetectionStrategy, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { Priority } from '../../shared/models/lis.models';
import { SampleTrackingService } from '../../core/services/sample-tracking.service';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';
import { WorkflowStepperComponent, WorkflowStep } from '../../shared/components/workflow-stepper/workflow-stepper.component';
import { PatientCardComponent } from '../../shared/components/patient-card/patient-card.component';

const TUBE_COLORS: Record<string, string> = {
  'EDTA (Purple top)': '#9F4BA8',
  'Fluoride (Grey top)': '#7B8794',
  'SST (Red/Gold top)': '#E24B4A',
  'Universal container': '#C9A227',
};

const TUBE_LABELS: Record<string, string> = {
  '#9F4BA8': 'Purple top (EDTA)',
  '#7B8794': 'Grey top (Fluoride)',
  '#E24B4A': 'Red/Gold top (SST)',
  '#C9A227': 'Universal urine container',
};

/** Priority → colour language, matched to the existing status-pill palette
 *  (routine = process blue, urgent = pending amber, stat = critical red)
 *  so a technician recognises urgency at a glance, consistent with the
 *  rest of the app. */
const PRIORITY_STYLE: Record<Priority, { icon: string; color: string; bg: string }> = {
  routine: { icon: 'ti-circle-check', color: '#0C447C', bg: '#E6F1FB' },
  urgent:  { icon: 'ti-clock-bolt',   color: '#633806', bg: '#FAEEDA' },
  stat:    { icon: 'ti-bolt',         color: '#791F1F', bg: '#FCEBEB' },
};

export interface ChecklistItem {
  id: string;
  label: string;
  icon: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'identity', label: 'Patient identity verified', icon: 'ti-id-badge-2' },
  { id: 'barcode',  label: 'Barcode attached',           icon: 'ti-barcode'    },
  { id: 'mixed',    label: 'Tube mixed (gentle inversions)', icon: 'ti-arrows-shuffle' },
  { id: 'sealed',   label: 'Sample sealed',               icon: 'ti-shield-lock' },
  { id: 'consent',  label: 'Consent verified',            icon: 'ti-file-check' },
];

/** Full lab pipeline — Collection is the first Lab Workflow stage, and
 *  showing the whole thing (not just the 4 pre-collection steps) tells the
 *  technician exactly where this sample sits in the bigger picture.
 *  Rendered via the shared <lis-workflow-stepper /> (same component used
 *  on Registration, Test Order and Billing) instead of a bespoke timeline. */
const TIMELINE_STEPS: WorkflowStep[] = [
  { label: 'Registered',   icon: 'ti-user-check'        },
  { label: 'Billing',      icon: 'ti-receipt'           },
  { label: 'Collection',   icon: 'ti-droplet'           },
  { label: 'Lab Received', icon: 'ti-building-warehouse' },
  { label: 'Testing',      icon: 'ti-flask'             },
  { label: 'Verified',     icon: 'ti-shield-check'      },
  { label: 'Report Ready', icon: 'ti-file-check'        },
];

@Component({
  selector: 'app-sample-collection',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, FormsModule, WorkflowStepperComponent, PatientCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample-collection.component.html',
  styleUrl: './sample-collection.component.css',
})
export class SampleCollectionComponent {
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  protected readonly flow          = inject(PatientFlowService);
  protected readonly barcodeWidths = [2,1,3,1,2,1,1,2,3,1,2,1,2,3,1];
  protected readonly checklistItems = CHECKLIST_ITEMS;
  protected readonly timelineSteps  = TIMELINE_STEPS;

  collected   = signal(false);
  collectedAt = signal('');
  notes       = signal('');
  collectionDateTime = signal(this.toDateTimeLocal(new Date()));
  datePickerOpen = signal(false);
  timePickerExpanded = signal(false);
  readonly datePickerPosition = signal({ top: 0, left: 0, width: 320, maxHeight: 360 });
  private readonly router = inject(Router);
  private readonly sampleTracking = inject(SampleTrackingService);
  private readonly workflowStore = inject(LabWorkflowMockService);
  readonly createdSampleId = signal<string | null>(null);
  readonly previewTube = signal<{ id: string; color: string; label: string; tests: string[] } | null>(null);
  private readonly initialCollectionDateTime = this.toDateTimeLocal(new Date());
  collectionDatePart = signal(this.initialCollectionDateTime.slice(0, 10));
  collectionTimePart = signal(this.initialCollectionDateTime.slice(11, 16));
  readonly draftCollectionDateTime = computed(() => `${this.collectionDatePart()}T${this.collectionTimePart()}`);
  readonly timeHours = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  readonly timeMinutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
  timeHour = computed(() => {
    const [hours] = this.collectionTimePart().split(':').map(Number);
    return String((hours % 12) || 12).padStart(2, '0');
  });
  timeMinute = computed(() => this.collectionTimePart().split(':')[1] ?? '00');
  timePeriod = computed(() => Number(this.collectionTimePart().slice(0, 2)) >= 12 ? 'PM' : 'AM');
  calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly calendarWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  calendarMonthLabel = computed(() => this.calendarMonth().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
  calendarDays = computed(() => {
    const month = this.calendarMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const today = this.toDateTimeLocal(new Date()).slice(0, 10);
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: count }, (_, index) => {
        const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
        return { day: index + 1, date, isToday: date === today, isFuture: date > today };
      })
    ];
  });
  collectionSite = signal('');
  patientCondition = signal('Not recorded');
  protected readonly patientConditionOptions = [
    { value: 'Fasting', label: 'Fasting' },
    { value: 'Non-fasting', label: 'Non-fasting' },
    { value: 'Post-meal', label: 'Post meal' },
    { value: 'Not recorded', label: 'Not recorded' },
  ];
  collectorName = signal('Ravi Anand');
  collectionFormValid = computed(() =>
    !!this.collectionDateTime() &&
    !Number.isNaN(new Date(this.collectionDateTime()).getTime()) &&
    !!this.collectorName().trim()
  );

  private _checked = signal<Set<string>>(new Set());
  checkedCount = computed(() => this._checked().size);
  allChecked   = computed(() => this._checked().size === CHECKLIST_ITEMS.length);

  // Tubes required for the current patient, derived from their test order
  currentPatientTubes = computed(() => {
    const p = this.flow.patient();
    const tests = this.flow.selectedTests();
    if (!p || tests.length === 0) return [];

    const groups: Record<string, string[]> = {};
    for (const t of tests) {
      const color = TUBE_COLORS[t.tubeType] ?? '#888';
      if (!groups[color]) groups[color] = [];
      groups[color].push(t.name);
    }

    return Object.entries(groups).map(([color, testNames], i) => ({
      id: `${p.id}-T${i + 1}`,
      color,
      label: TUBE_LABELS[color] ?? 'Plain tube',
      tests: testNames,
    }));
  });

  // Derive specimen type from the tubes generated for the ordered tests.
  // This is a display-only summary; each tube remains separately identified.
  sampleType = computed(() => {
    const tubes = this.currentPatientTubes();
    if (tubes.length === 0) return 'Not determined';
    const hasUrine = tubes.some(t => t.label.toLowerCase().includes('urine'));
    const hasBlood = tubes.some(t => !t.label.toLowerCase().includes('urine'));
    if (hasUrine && hasBlood) return 'Blood + urine specimens';
    if (hasUrine) return 'Urine specimen';
    return 'Blood specimen';
  });

  // 2 = Collection is the 3rd step (index 2) of TIMELINE_STEPS
  timelineActiveIndex = computed(() => (this.collected() ? 3 : 2));

  private toFastingStatus(condition: string): 'fasting' | 'non-fasting' | 'post-meal' | 'unknown' {
    if (condition === 'Fasting') return 'fasting';
    if (condition === 'Non-fasting') return 'non-fasting';
    if (condition === 'Post-meal') return 'post-meal';
    return 'unknown';
  }

  private toDateTimeLocal(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  toggleDatePicker(): void {
    if (this.collected()) return;
    if (this.datePickerOpen()) {
      this.cancelDatePicker();
      return;
    }
    this.beginDatePickerEdit();
  }

  private beginDatePickerEdit(): void {
    this.positionDatePicker();
    const current = this.collectionDateTime();
    this.collectionDatePart.set(current.slice(0, 10));
    this.collectionTimePart.set(current.slice(11, 16));
    const selected = new Date(`${current.slice(0, 10)}T00:00:00`);
    if (!Number.isNaN(selected.getTime())) {
      this.calendarMonth.set(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
    this.timePickerExpanded.set(true);
    this.datePickerOpen.set(true);
  }

  private positionDatePicker(): void {
    const hostElement = this.hostRef.nativeElement as HTMLElement;
    const trigger = hostElement.querySelector('.collection-datetime-trigger') as HTMLElement | null;
    const control = hostElement.querySelector('.collection-datetime-control') as HTMLElement | null;
    if (!trigger || !control) return;

    const triggerRect = trigger.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edge = 12;
    const gap = 8;
    const width = Math.max(0, Math.min(340, viewportWidth - edge * 2));
    const desiredLeft = Math.max(edge, Math.min(triggerRect.left, viewportWidth - width - edge));

    const belowSpace = Math.max(0, viewportHeight - triggerRect.bottom - edge - gap);
    const aboveSpace = Math.max(0, triggerRect.top - edge - gap);
    const preferredHeight = Math.min(440, viewportHeight - edge * 2);
    const placeAbove = belowSpace < Math.min(360, preferredHeight) && aboveSpace > belowSpace;
    const availableSpace = placeAbove ? aboveSpace : belowSpace;
    const maxHeight = Math.max(120, Math.min(preferredHeight, availableSpace));

    // Compact layouts use an absolutely positioned popup anchored to this
    // control, so convert viewport coordinates into the control's coordinate
    // space. This avoids fixed-position containing-block issues caused by
    // transformed/contained ancestors in the responsive application shell.
    const compactLayout = viewportWidth <= 1100;
    const left = compactLayout
      ? desiredLeft - controlRect.left
      : desiredLeft;
    const top = compactLayout
      ? (placeAbove
          ? triggerRect.top - controlRect.top - maxHeight - gap
          : triggerRect.bottom - controlRect.top + gap)
      : (placeAbove
          ? triggerRect.top - maxHeight - gap
          : triggerRect.bottom + gap);

    this.datePickerPosition.set({ top, left, width, maxHeight });
  }

  openTubePreview(tube: { id: string; color: string; label: string; tests: string[] }): void {
    this.previewTube.set(tube);
  }

  closeTubePreview(): void { this.previewTube.set(null); }

  cancelDatePicker(): void {
    const current = this.collectionDateTime();
    this.collectionDatePart.set(current.slice(0, 10));
    this.collectionTimePart.set(current.slice(11, 16));
    this.datePickerOpen.set(false);
  }

  changeCalendarMonth(offset: number): void {
    const current = this.calendarMonth();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    const today = new Date();
    if (next.getTime() > new Date(today.getFullYear(), today.getMonth(), 1).getTime()) return;
    this.calendarMonth.set(next);
  }

  updateCollectionDate(value: string): void {
    this.collectionDatePart.set(value);
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) this.calendarMonth.set(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }

  toggleTimePicker(): void {
    this.timePickerExpanded.update(expanded => !expanded);
  }

  updateCollectionTime(value: string): void {
    this.collectionTimePart.set(value.replace(/[^0-9:]/g, '').slice(0, 5));
  }
  updateTimeSelection(hourValue: string, minuteValue: string, period: 'AM' | 'PM'): void {
    let hours = Number(hourValue) % 12;
    if (period === 'PM') hours += 12;
    const time = `${String(hours).padStart(2, '0')}:${String(Number(minuteValue)).padStart(2, '0')}`;
    this.collectionTimePart.set(time);
  }

  applyDatePicker(): void {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(this.collectionTimePart())) return;
    const date = this.collectionDatePart();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    this.collectionDateTime.set(`${date}T${this.collectionTimePart()}`);
    this.datePickerOpen.set(false);
  }

  isChecked(id: string): boolean { return this._checked().has(id); }
  toggleChecklist(id: string): void {
    this._checked.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  priorityStyle() {
    return PRIORITY_STYLE[this.flow.priority()];
  }

  markCollected(): void {
    if (!this.collectionFormValid() || !this.allChecked() || this.collected()) return;
    const patient = this.flow.patient();
    const orderedTests = this.flow.selectedTests();
    if (!patient || orderedTests.length === 0) return;

    const orderId = this.flow.ensureWorkflowOrder();
    const visitId = this.flow.activeVisitId();
    if (!visitId) throw new Error('Active visit is missing. Please return to Patient Workflow.');
    const collectedDate = new Date(this.collectionDateTime());
    const sample = this.sampleTracking.createFromCollection({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      dob: patient.dob,
      gender: patient.gender.toLowerCase() as 'male' | 'female' | 'other',
      refDoctor: patient.refDoctor,
      mobile: patient.mobile,
      visitType: patient.visitType.toLowerCase().replace(/\s+/g, '-') as 'walk-in' | 'appointment' | 'home-visit',
      fastingStatus: this.toFastingStatus(this.patientCondition()),
      tests: orderedTests.map(test => test.id),
      priority: this.flow.priority(),
      status: 'pending',
      collectedAt: collectedDate.toISOString(),
      etaLabel: 'Pending',
      tubes: this.currentPatientTubes().map(tube => ({
        id: tube.id,
        color: tube.color,
        label: tube.label,
        tests: [...tube.tests],
      })),
    });
    this.workflowStore.createSample({
      id: sample.id,
      orderId,
      visitId,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      gender: patient.gender.toLowerCase() as 'male' | 'female' | 'other',
      dob: patient.dob,
      testIds: orderedTests.map(test => test.id),
      priority: this.flow.priority(),
      collectedAt: collectedDate.toISOString(),
      collector: this.collectorName().trim(),
      checklist: CHECKLIST_ITEMS.map(item => item.id),
      fastingStatus: this.toFastingStatus(this.patientCondition()),
      notes: this.notes().trim(),
      specimenGroups: orderedTests.reduce((groups, test) => {
        const key = test.tubeType;
        const group = groups.find(item => item.tubeType === key);
        if (group) group.testIds.push(test.id);
        else groups.push({ tubeType: key, sampleType: test.sampleType, testIds: [test.id] });
        return groups;
      }, [] as Array<{tubeType:string;sampleType:string;testIds:string[]}>)
    });
    this.createdSampleId.set(sample.id);
    this.collectedAt.set(
      collectedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
    this.collected.set(true);
  }

  openSampleTracking(): void {
    if (this.createdSampleId()) this.router.navigate(['/dashboard/tracking']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.datePickerOpen()) return;
    const target = event.target as Node | null;
    const control = this.hostRef.nativeElement.querySelector('.collection-datetime-control');
    if (target && control && !control.contains(target)) this.cancelDatePicker();
  }

  // ── Keyboard shortcuts ────────────────────────────────────────
  // Enter → Mark as Collected · Ctrl/Cmd+P → Print Labels
  printFlash = signal(false);

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.previewTube()) {
      e.preventDefault();
      this.closeTubePreview();
      return;
    }
    if (e.key === 'Escape' && this.datePickerOpen()) {
      e.preventDefault();
      this.cancelDatePicker();
      return;
    }
    const target = e.target as HTMLElement;
    const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

    if (e.key === 'Enter' && !typing && !this.collected() && this.currentPatientTubes().length > 0) {
      e.preventDefault();
      this.markCollected();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && this.currentPatientTubes().length > 0) {
      e.preventDefault();
      this.printLabels();
    }
  }

  printLabels(): void {
    // No print backend is wired up yet in this prototype — flash the
    // action for feedback (item 19: button press feedback) rather than
    // opening the browser's print dialog on the whole app shell.
    this.printFlash.set(true);
    setTimeout(() => this.printFlash.set(false), 900);
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
   /** Detailed breakdown used in the patient info row, e.g. "9Y-11M-02Days". */
  patientAgeBreakdown(): string {
    const p = this.patient;
    if (!p) return '';
    return this.flow.formatAgeBreakdown(p.dob);
  }

  /** Raw Y/M/D parts for the colorized inline age breakdown (see .age-inline* in styles.css). */
  ageParts(): { years: number; months: number; days: number } {
    const p = this.patient;
    if (!p) return { years: 0, months: 0, days: 0 };
    return this.flow.calcAgeParts(p.dob);
  }

  genderIcon(): string {
    const g = (this.patient?.gender ?? '').toLowerCase();
    if (g === 'male')   return 'ti-gender-male';
    if (g === 'female') return 'ti-gender-female';
    return 'ti-gender-genderless';
  }
}


