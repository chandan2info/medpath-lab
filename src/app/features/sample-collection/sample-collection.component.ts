// ─────────────────────────────────────────────
//  Screen 4a — Sample Collection
//  Task screen for the phlebotomist: collect
//  tubes for the CURRENT patient right after
//  billing. One patient, one job, one screen.
//  Redesigned per UX review (2026-07) to read as
//  a high-frequency operational workstation
//  rather than a dashboard card:
//   - patient identity + status dominate
//   - tubes shown as high-contrast cards
//   - collection panel ordered as a workflow
//   - collection checklist fills the empty space
//   - full process timeline, not just 4 steps
//  (For the lab-wide operations view, see
//  Screen 4b — Sample Tracking.)
// ─────────────────────────────────────────────
import { Component, signal, computed, inject, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { Priority } from '../../shared/models/lis.models';

const TUBE_COLORS: Record<string, string> = {
  'Haematology':   '#2B8B3E',
  'Biochemistry':  '#E24B4A',
  'Endocrinology': '#9F4BA8',
  'Urine':         '#C9A227',
};

const TUBE_LABELS: Record<string, string> = {
  '#2B8B3E': 'Green top (EDTA)',
  '#E24B4A': 'Red top (SST)',
  '#9F4BA8': 'Purple (EDTA)',
  '#C9A227': 'Yellow (Urine)',
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

/** Full lab pipeline — Collection is one stage of a longer journey, and
 *  showing the whole thing (not just the 4 pre-collection steps) tells the
 *  technician exactly where this sample sits in the bigger picture. */
type StepState = 'done' | 'active' | 'pending';
interface TimelineStep { label: string; icon: string; }
const TIMELINE_STEPS: TimelineStep[] = [
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
  imports: [RouterLink, DatePipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sample-collection.component.html',
  styleUrl: './sample-collection.component.css',
})
export class SampleCollectionComponent {
  protected readonly flow          = inject(PatientFlowService);
  protected readonly barcodeWidths = [2,1,3,1,2,1,1,2,3,1,2,1,2,3,1];
  protected readonly now           = new Date();
  protected readonly checklistItems = CHECKLIST_ITEMS;
  protected readonly timelineSteps  = TIMELINE_STEPS;

  collected   = signal(false);
  collectedAt = signal('');
  notes       = signal('');

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
      const color = TUBE_COLORS[t.category] ?? '#888';
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

  // 2 = Collection is the 3rd step (index 2) of TIMELINE_STEPS
  timelineActiveIndex = computed(() => (this.collected() ? 3 : 2));

  stepState(index: number): StepState {
    const active = this.timelineActiveIndex();
    if (index < active) return 'done';
    if (index === active) return 'active';
    return 'pending';
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
    const now = new Date();
    this.collectedAt.set(
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
    this.collected.set(true);
  }

  // ── Keyboard shortcuts ────────────────────────────────────────
  // Enter → Mark as Collected · Ctrl/Cmd+P → Print Labels
  printFlash = signal(false);

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
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


