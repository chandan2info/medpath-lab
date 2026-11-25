// ─────────────────────────────────────────────
//  Screen 1 — Patient Registration
//  Single purpose: capture patient demographics
//  & clinical info, then navigate to Test Order.
// ─────────────────────────────────────────────
import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, HostListener
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { PatientFlowService, RegisteredPatient, KnownPatientRecord } from '../../core/services/patient-flow.service';
import { DobDatePickerComponent } from '../../shared/components/dob-date-picker/dob-date-picker.component';
import { WorkflowStepperComponent, WorkflowStep } from '../../shared/components/workflow-stepper/workflow-stepper.component';
import { PatientCardComponent } from '../../shared/components/patient-card/patient-card.component';


@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, DatePipe, DobDatePickerComponent, WorkflowStepperComponent, PatientCardComponent],
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

  /** Patient Workflow ends at Billing. Sample Collection is the first Lab Workflow activity. */
  protected readonly workflowSteps: WorkflowStep[] = [
    { label: 'Register',   icon: 'ti-user-plus' },
    { label: 'Test Order', icon: 'ti-test-pipe' },
    { label: 'Billing',    icon: 'ti-receipt' },
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
  patientSearchQuery = signal('');
  patientSearchResults = signal<KnownPatientRecord[]>([]);
  selectedExistingPatientId = signal<string | null>(null);
  selectedExistingPatient = signal<KnownPatientRecord | null>(null);
  showNewPatientForm = signal(false);
  isEditingExistingPatient = signal(false);
  searchAttempted = signal(false);

  // Brief reassurance flash shown right before advancing to
  // Clinical Info, so the operator sees confirmation instead
  // of an abrupt step swap.
  step1Saved = signal(false);

  // ── Registration progress summary (Priority 22) ──────────
  // Lightweight "N of M required fields complete" readout for
  // the Personal Details step, so the operator knows what's
  // left without scanning the whole form.
  private readonly step1RequiredFields = ['firstName', 'lastName', 'dob', 'gender', 'mobile'];
  readonly step1Total = this.step1RequiredFields.length;
  step1FilledCount = signal(0);
  step1ProgressPct = computed(() =>
    Math.round((this.step1FilledCount() / this.step1Total) * 100)
  );

  // ── Address character counter (Priority 10) ──────────────
  readonly addressMaxLen = 250;
  addressLength = signal(0);

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
      refDoctor:    ['Self / Walk-in'],
      visitType:    ['Walk-in'],
      fasting:      ['Unknown'],
      collection:   ['At lab counter'],
      clinicalNotes:[''],
      medications:  [''],
      collectionAddress: [''],
      collectionDate: [''],
      collectionTime: [''],
      collectionInstructions: [''],
    });

    // The custom date picker doesn't emit a native (change) event,
    // so recompute Age from the form control's value stream instead.
    this.form.get('dob')?.valueChanges.subscribe((dob) => {
      if (!dob) {
        this.ageDisplay.set('');
        this.ageParts.set(null);
        this.dobFormatted.set('');
        return;
      }

      const age = this.flow.calcAge(dob);
      this.ageDisplay.set(`${age}`);
      this.ageParts.set(this.flow.calcAgeParts(dob));
      this.dobFormatted.set(this.formatDobDisplay(dob));
      this.ageTick.update(v => v ^ 1);
    });

    // Live character count for the Address textarea (Priority 10) —
    // keeps the operator aware of the remaining budget on a field
    // that's otherwise just a plain, unbounded-looking textarea.
    this.form.get('address')?.valueChanges.subscribe((val: string) => {
      this.addressLength.set((val || '').length);
    });

    // Registration progress summary — recompute whenever any Step 1
    // field changes, so the "N of M required fields complete" chip
    // stays live as the operator fills the form (Priority 22).
    this.updateStep1Progress();
    this.form.valueChanges.subscribe(() => this.updateStep1Progress());

    // Keep visit type and collection method in sync with the lab's selection rules.
    this.syncCollectionRules();
  }

  /** Walk-in is counter-only; home visits always require home collection. */
  setVisitType(type: 'Walk-in' | 'Appointment' | 'Home visit'): void {
    if (type === 'Walk-in') {
      this.form.patchValue({ visitType: type, collection: 'At lab counter' });
    } else if (type === 'Home visit') {
      this.form.patchValue({ visitType: type, collection: 'Home collection' });
    } else {
      this.form.patchValue({ visitType: type });
    }
    this.syncCollectionRules();
  }

  setCollectionType(type: 'At lab counter' | 'Home collection'): void {
    const visitType = this.form.get('visitType')?.value;
    if ((visitType === 'Walk-in' && type === 'Home collection') ||
        (visitType === 'Home visit' && type === 'At lab counter')) return;
    this.form.patchValue({ collection: type });
    this.syncCollectionRules();
  }

  private syncCollectionRules(): void {
    const visitType = this.form.get('visitType')?.value;
    const collection = this.form.get('collection')?.value;
    if (visitType === 'Walk-in' && collection !== 'At lab counter') {
      this.form.patchValue({ collection: 'At lab counter' }, { emitEvent: false });
    } else if (visitType === 'Home visit' && collection !== 'Home collection') {
      this.form.patchValue({ collection: 'Home collection' }, { emitEvent: false });
    }

    const homeCollection = this.form.get('collection')?.value === 'Home collection';
    ['collectionAddress', 'collectionDate', 'collectionTime'].forEach(name => {
      const control = this.form.get(name);
      if (!control) return;
      control.setValidators(homeCollection ? [Validators.required] : []);
      control.updateValueAndValidity({ emitEvent: false });
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

  // Icon for the gender shown in the Clinical step's patient recap —
  // mirrors the same mapping used on Billing/Test Order/Sample Collection
  // so the icon reads identically wherever gender appears in a patient
  // metadata row.
  genderIcon(): string {
    const g = (this.form.value.gender ?? '').toLowerCase();
    if (g === 'male')   return 'ti-gender-male';
    if (g === 'female') return 'ti-gender-female';
    return 'ti-gender-genderless';
  }

  // Counts how many of the Step 1 required fields currently hold a
  // non-empty value, powering the progress chip in the card header.
  private updateStep1Progress(): void {
    const filled = this.step1RequiredFields.filter(f => {
      const v = this.form.get(f)?.value;
      return v !== null && v !== undefined && String(v).trim() !== '';
    }).length;
    this.step1FilledCount.set(filled);
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

  searchExistingPatients(query: string): void {
    this.patientSearchQuery.set(query);
    this.searchAttempted.set(query.trim().length >= 2);
    this.selectedExistingPatient.set(null);
    this.selectedExistingPatientId.set(null);
    this.patientSearchResults.set(this.flow.searchPatients(query));
  }

  selectExistingPatient(patient: KnownPatientRecord): void {
    this.selectedExistingPatient.set(patient);
    this.selectedExistingPatientId.set(patient.id);
    this.searchAttempted.set(false);
    this.showNewPatientForm.set(false);
    this.form.patchValue({
      firstName: patient.firstName, lastName: patient.lastName, mobile: patient.mobile,
      dob: patient.dob, gender: patient.gender, bloodGroup: patient.bloodGroup,
      email: patient.email, address: patient.address
    });
    this.duplicateMatch.set(null);
    this.duplicateDismissed.set(true);
    this.patientSearchResults.set([]);
  }

  /** Return from the clinical recap to edit the selected existing patient's demographics. */
  editPatientFromClinical(): void {
    if (!this.selectedExistingPatient()) return;
    this.currentStep.set(1);
    this.editSelectedPatient();
  }

  /** Open the prefilled demographics form for the selected existing patient. */
  editSelectedPatient(): void {
    const patient = this.selectedExistingPatient();
    if (!patient) return;
    this.isEditingExistingPatient.set(true);
    this.showNewPatientForm.set(true);
    this.form.patchValue({
      firstName: patient.firstName, lastName: patient.lastName, mobile: patient.mobile,
      dob: patient.dob, gender: patient.gender, bloodGroup: patient.bloodGroup,
      email: patient.email, address: patient.address
    });
    this.form.markAsPristine();
  }

  /** Apply edited demographic values to the selected patient summary. */
  updateExistingPatient(): void {
    const fields = ['firstName', 'lastName', 'dob', 'gender', 'mobile'];
    fields.forEach(field => this.form.get(field)?.markAsTouched());
    if (fields.some(field => this.form.get(field)?.invalid)) return;

    const current = this.selectedExistingPatient();
    if (!current) return;
    const v = this.form.getRawValue();
    const updated: KnownPatientRecord = {
      ...current,
      firstName: v.firstName,
      lastName: v.lastName,
      name: `${v.firstName} ${v.lastName}`.trim(),
      mobile: v.mobile,
      dob: v.dob,
      gender: v.gender,
      bloodGroup: v.bloodGroup,
      email: v.email,
      address: v.address
    };
    this.selectedExistingPatient.set(updated);
    this.selectedExistingPatientId.set(updated.id);
    this.isEditingExistingPatient.set(false);
    this.showNewPatientForm.set(false);
    this.patientSearchQuery.set(updated.id);
    this.searchAttempted.set(false);
  }

  cancelExistingPatientEdit(): void {
    const patient = this.selectedExistingPatient();
    if (!patient) {
      this.clearExistingPatientSelection();
      return;
    }
    this.form.patchValue({
      firstName: patient.firstName, lastName: patient.lastName, mobile: patient.mobile,
      dob: patient.dob, gender: patient.gender, bloodGroup: patient.bloodGroup,
      email: patient.email, address: patient.address
    });
    this.isEditingExistingPatient.set(false);
    this.showNewPatientForm.set(false);
  }

  startNewPatientRegistration(): void {
    this.selectedExistingPatient.set(null);
    this.selectedExistingPatientId.set(null);
    this.patientSearchResults.set([]);
    this.showNewPatientForm.set(true);
    this.isEditingExistingPatient.set(false);
    this.searchAttempted.set(false);
    this.form.reset({
      firstName: '', lastName: '', dob: '', gender: '', bloodGroup: 'Unknown',
      mobile: '', email: '', address: '', refDoctor: 'Self / Walk-in',
      visitType: 'Walk-in', fasting: 'Unknown', collection: 'At lab counter',
      clinicalNotes: '', medications: '', collectionAddress: '',
      collectionDate: '', collectionTime: '', collectionInstructions: ''
    });
  }

  clearExistingPatientSelection(): void {
    this.selectedExistingPatient.set(null);
    this.selectedExistingPatientId.set(null);
    this.patientSearchQuery.set('');
    this.patientSearchResults.set([]);
    this.searchAttempted.set(false);
    this.showNewPatientForm.set(false);
    this.isEditingExistingPatient.set(false);
    this.form.reset({
      firstName: '', lastName: '', dob: '', gender: '', bloodGroup: 'Unknown',
      mobile: '', email: '', address: '', refDoctor: 'Self / Walk-in',
      visitType: 'Walk-in', fasting: 'Unknown', collection: 'At lab counter',
      clinicalNotes: '', medications: '', collectionAddress: '',
      collectionDate: '', collectionTime: '', collectionInstructions: ''
    });
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
    // Referring doctor is optional. Home collection requires address and slot.
    this.syncCollectionRules();
    if (this.form.value.collection === 'Home collection') {
      const requiredFields = ['collectionAddress', 'collectionDate', 'collectionTime'];
      requiredFields.forEach(name => this.form.get(name)?.markAsTouched());
      if (requiredFields.some(name => this.form.get(name)?.invalid)) return;
    }

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
        refDoctor:    v.refDoctor || 'Self / Walk-in',
        visitType:    v.visitType,
        fasting:      v.fasting,
        collection:   v.collection,
        clinicalNotes:v.clinicalNotes,
        medications:  v.medications,
        collectionAddress: v.collectionAddress,
        collectionDate: v.collectionDate,
        collectionTime: v.collectionTime,
        collectionInstructions: v.collectionInstructions,
      }, this.selectedExistingPatientId() ?? undefined);

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
