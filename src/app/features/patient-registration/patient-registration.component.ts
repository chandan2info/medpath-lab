// ─────────────────────────────────────────────
//  Screen 1 — Patient Registration
//  Single purpose: capture patient demographics
//  & clinical info, then navigate to Test Order.
// ─────────────────────────────────────────────
import {
  Component, ChangeDetectionStrategy, signal, inject, OnInit
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { PatientFlowService, RegisteredPatient } from '../../core/services/patient-flow.service';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.css',
})
export class PatientRegistrationComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly flow = inject(PatientFlowService);

  // Two-step stepper (demographics → clinical)
  protected readonly steps = [
    { n: 1, label: 'Demographics' },
    { n: 2, label: 'Clinical info' },
  ];
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
  }

  calcAge(): void {
    const dob = this.form.value.dob;
    if (!dob) { this.ageDisplay.set(''); return; }
    const years = this.flow.calcAge(dob);
    this.ageDisplay.set(years > 0 ? `${years} years` : '');
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  // Validate step 1 fields before advancing
  nextStep(): void {
    const step1 = ['firstName', 'lastName', 'dob', 'gender', 'mobile'];
    step1.forEach(f => this.form.get(f)?.markAsTouched());
    const valid = step1.every(f => this.form.get(f)?.valid ?? true);
    if (valid) this.currentStep.set(2);
  }

  goBack(): void {
    if (this.currentStep() === 2) { this.currentStep.set(1); }
    else { this.router.navigate(['/dashboard/home']); }
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
