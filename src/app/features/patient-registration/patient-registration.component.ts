// ─────────────────────────────────────────────
//  Screen 1 — Patient Registration
//  Single purpose: capture patient demographics
//  & clinical info, then navigate to Test Order.
// ─────────────────────────────────────────────
import {
  Component, ChangeDetectionStrategy, signal, inject, OnInit, HostListener
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { PatientFlowService, RegisteredPatient, KnownPatientRecord } from '../../core/services/patient-flow.service';
import { DobDatePickerComponent } from '../../shared/components/dob-date-picker/dob-date-picker.component';
import { WorkflowStepperComponent, WorkflowStep } from '../../shared/components/workflow-stepper/workflow-stepper.component';


@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, DobDatePickerComponent, WorkflowStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.css',
})
export class PatientRegistrationComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly flow = inject(PatientFlowService);

  protected readonly bloodGroups = [
    'A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−', 'Unknown'
  ];

  /** Shared 4-step workflow stepper (Register → Test Order → Billing → Sample). */
  protected readonly workflowSteps: WorkflowStep[] = [
    { label: 'Register',   icon: 'ti-user-plus' },
    { label: 'Test Order', icon: 'ti-test-pipe' },
    { label: 'Billing',    icon: 'ti-receipt' },
    { label: 'Sample',     icon: 'ti-droplet' },
  ];
  protected readonly workflowActiveIndex = 0;

  readonly todayISO = new Date().toISOString().split('T')[0];

  currentStep   = signal(1);
  ageDisplay    = signal('');
  ageParts      = signal<{ years: number; months: number; days: number } | null>(null);
  dobFormatted  = signal('');
  // Flips 0/1 on every DOB change so the Age card's CSS animation
  // (bound via [class]) restarts each time — Angular doesn't replay
  // a keyframe just because interpolated text changed, only when a
  // class is actually added/removed.
  ageTick       = signal(0);
  saving        = signal(false);
  showSuccess   = signal(false);
  savedPatient  = signal<RegisteredPatient | null>(null);
  countdown     = signal(3);

  // Duplicate-patient detection (Personal Details step)
  duplicateMatch  = signal<KnownPatientRecord | null>(null);
  duplicateDismissed = signal(false);

  // Brief reassurance flash shown right before advancing to
  // Clinical Info, so the operator sees confirmation instead
  // of an abrupt step swap.
  step1Saved = signal(false);

  form!: FormGroup;

  private _timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.form = this.fb.group({
      // Step 1 — Demographics
      firstName:    ['', Validators.required],
      lastName:     ['', Validators.required],
      dob:          ['', Validators.required],
      gender:       ['', Validators.required],
      bloodGroup:   ['Unknown'],
      mobile:       ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email:        [''],
      address:      [''],
      // Step 2 — Clinical
      refDoctor:    ['', Validators.required],
      visitType:    ['Walk-in'],
      fasting:      ['Fasting'],
      collection:   ['At lab counter'],
      clinicalNotes:[''],
      medications:  [''],
    });

    // The custom date picker doesn't emit a native (change) event,
    // so recompute Age from the form control's value stream instead.
    this.form.get('dob')?.valueChanges.subscribe((dob) => {
  console.log('DOB changed:', dob);

  if (!dob) {
    this.ageDisplay.set('');
    this.ageParts.set(null);
    this.dobFormatted.set('');
    return;
  }

 const age = this.flow.calcAge(dob);

  console.log('Age:', age);

  this.ageDisplay.set(`${age}`);
  this.ageParts.set(this.flow.calcAgeParts(dob));
  this.dobFormatted.set(this.formatDobDisplay(dob));
  this.ageTick.update(v => v ^ 1);
});
  }

  // "2008-07-04" → "04 Jul 2008", used in the Age card's helper
  // text so the operator can see exactly which DOB the value was
  // derived from, without reformatting logic living in the template.
  private formatDobDisplay(dob: string): string {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

 calcAge(dob: string): string {
  if (!dob) return '';

  const birth = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    const previousMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );

    days += previousMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  }

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  }

  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
  }

  return parts.join(' ');
}

  // Grows a textarea to fit its content instead of showing a
  // tall, mostly-empty box (Address / Clinical notes / Medication).
  autoResize(evt: Event): void {
    const el = evt.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  isValidTouched(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.valid && (c.dirty || c.touched));
  }

  // Checks the mobile number against known patients and
  // surfaces a "possible duplicate" warning before the
  // operator proceeds to Test Order.
  onMobileChange(): void {
    this.duplicateDismissed.set(false);
    const mobile = this.form.value.mobile;
    if (this.form.get('mobile')?.valid) {
      this.duplicateMatch.set(this.flow.findByMobile(mobile));
    } else {
      this.duplicateMatch.set(null);
    }
  }

  dismissDuplicateWarning(): void {
    this.duplicateDismissed.set(true);
  }

  // Validate step 1 fields before advancing
  nextStep(): void {
    const step1 = ['firstName', 'lastName', 'dob', 'gender', 'mobile'];
    step1.forEach(f => this.form.get(f)?.markAsTouched());
    const valid = step1.every(f => this.form.get(f)?.valid ?? true);
    if (!valid) return;

    this.step1Saved.set(true);
    setTimeout(() => {
      this.step1Saved.set(false);
      this.currentStep.set(2);
    }, 550);
  }

  goBack(): void {
    if (this.currentStep() === 2) { this.currentStep.set(1); }
    else { this.router.navigate(['/dashboard/home']); }
  }

  // Keyboard-first navigation for high-volume receptionists:
  // Ctrl/Cmd+Enter advances or saves, Esc goes back/cancels.
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(evt: KeyboardEvent): void {
    if (this.showSuccess()) return;
    if ((evt.ctrlKey || evt.metaKey) && evt.key === 'Enter') {
      evt.preventDefault();
      this.currentStep() === 1 ? this.nextStep() : this.saveAndContinue();
    } else if (evt.key === 'Escape') {
      evt.preventDefault();
      this.goBack();
    }
  }

  saveAndContinue(): void {
    // Validate step 2 fields
    const step2 = ['refDoctor'];
    step2.forEach(f => this.form.get(f)?.markAsTouched());
    if (!this.form.get('refDoctor')?.valid) return;

    this.saving.set(true);

    // Simulate brief save delay (replace with real API call)
    setTimeout(() => {
      const v = this.form.value;
      const pat = this.flow.registerPatient({
        firstName:    v.firstName,
        lastName:     v.lastName,
        dob:          v.dob,
        ageYears:     this.flow.calcAge(v.dob),
        gender:       v.gender,
        bloodGroup:   v.bloodGroup,
        mobile:       v.mobile,
        email:        v.email,
        address:      v.address,
        refDoctor:    v.refDoctor,
        visitType:    v.visitType,
        fasting:      v.fasting,
        collection:   v.collection,
        clinicalNotes:v.clinicalNotes,
        medications:  v.medications,
      });

      this.saving.set(false);
      this.savedPatient.set(pat);
      this.showSuccess.set(true);

      // Countdown → auto-navigate to test order
      this._timer = setInterval(() => {
        this.countdown.update(c => {
          if (c <= 1) {
            clearInterval(this._timer);
            this.router.navigate(['/dashboard/test-order']);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, 600);
  }

  goToTestOrder(): void {
    clearInterval(this._timer);
    this.router.navigate(['/dashboard/test-order']);
  }

  ngOnDestroy(): void { clearInterval(this._timer); }
}
