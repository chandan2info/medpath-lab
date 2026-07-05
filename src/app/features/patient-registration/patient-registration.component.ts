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

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, DobDatePickerComponent],
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

  readonly todayISO = new Date().toISOString().split('T')[0];

  currentStep   = signal(1);
  ageDisplay    = signal('');
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
    this.form.get('dob')?.valueChanges.subscribe(() => this.calcAge());
  }

  calcAge(): void {
    const dob = this.form.value.dob;
    if (!dob) { this.ageDisplay.set(''); return; }
    const years = this.flow.calcAge(dob);
    this.ageDisplay.set(years > 0 ? `${years} years` : '');
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
