import {
  Component, ChangeDetectionStrategy, signal, computed
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { LabTest } from '../../shared/models/lis.models';

const LAB_TESTS: LabTest[] = [
  { id:'CBC',  name:'CBC — Complete blood count',  category:'Haematology',   price:200, tatHours:4 },
  { id:'ESR',  name:'ESR',                          category:'Haematology',   price:80,  tatHours:2 },
  { id:'GLU',  name:'Blood glucose (fasting)',       category:'Biochemistry',  price:120, tatHours:2 },
  { id:'HBA',  name:'HbA1c',                        category:'Biochemistry',  price:400, tatHours:4 },
  { id:'LFT',  name:'Liver function test',           category:'Biochemistry',  price:550, tatHours:6 },
  { id:'KFT',  name:'Kidney function test',          category:'Biochemistry',  price:500, tatHours:6 },
  { id:'LIP',  name:'Lipid profile',                 category:'Biochemistry',  price:450, tatHours:6 },
  { id:'TSH',  name:'TSH',                           category:'Endocrinology', price:350, tatHours:6 },
  { id:'FT3',  name:'Free T3 / T4 / TSH panel',     category:'Endocrinology', price:700, tatHours:8 },
  { id:'URI',  name:'Urine routine & microscopy',    category:'Urine',         price:100, tatHours:2 },
];

const DOCTORS = [
  'Dr. Pradeep Iyer (Cardiology)',
  'Dr. Suresh Menon (Internal Medicine)',
  'Dr. Anita Rao (Endocrinology)',
  'Self / Walk-in',
];

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Patient registration</h1>
        <nav aria-label="Breadcrumb">
          <ol class="breadcrumb">
            <li><a routerLink="/dashboard/home">Home</a></li>
            <li aria-current="page">New registration</li>
          </ol>
        </nav>
      </div>
      <div class="pid-badge" aria-label="Assigned patient ID">
        <i class="ti ti-id-badge" aria-hidden="true"></i>
        <div>
          <div class="pid-label">Patient ID assigned</div>
          <div class="pid-value lis-mono">PAT-2406-0319</div>
        </div>
        <span class="lis-badge">New patient</span>
      </div>
    </div>

    <!-- Stepper -->
    <div class="stepper" role="list" aria-label="Registration steps">
      @for (step of steps; track step.n) {
        <div class="step" [class.step--done]="currentStep() > step.n" [class.step--active]="currentStep() === step.n" role="listitem">
          <div class="step-num" [attr.aria-label]="currentStep() > step.n ? step.label + ' complete' : step.label">
            @if (currentStep() > step.n) { <i class="ti ti-check" aria-hidden="true"></i> }
            @else { {{ step.n }} }
          </div>
          <span class="step-label">{{ step.label }}</span>
        </div>
        @if (step.n < steps.length) {
          <i class="ti ti-chevron-right step-arrow" aria-hidden="true"></i>
        }
      }
    </div>

    <div class="reg-layout">
      <!-- Left: form -->
      <div class="reg-main">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- Step 1 — Demographics -->
          <div class="lis-card reg-card">
            <div class="lis-card__header">
              <i class="ti ti-user" style="color:var(--lis-primary,#1D9E75);font-size:15px" aria-hidden="true"></i>
              <h2 class="lis-card__title">Personal details</h2>
              @if (currentStep() > 1) { <span class="lis-badge"><i class="ti ti-check" style="font-size:10px"></i> Done</span> }
              @else { <span class="lis-badge lis-badge--warn">Step 1</span> }
            </div>
            <div class="form-grid">
              <div class="lis-field">
                <label for="firstName">First name <span class="req">*</span></label>
                <input id="firstName" formControlName="firstName" [class.input-error]="isInvalid('firstName')" />
                @if (isInvalid('firstName')) { <span class="err-msg" role="alert">Required</span> }
              </div>
              <div class="lis-field">
                <label for="lastName">Last name <span class="req">*</span></label>
                <input id="lastName" formControlName="lastName" />
              </div>
              <div class="lis-field">
                <label for="dob">Date of birth <span class="req">*</span></label>
                <input id="dob" type="date" formControlName="dob" (change)="calcAge()" />
              </div>
              <div class="lis-field">
                <label for="age">Age (auto)</label>
                <input id="age" [value]="ageDisplay()" readonly />
              </div>
              <div class="lis-field">
                <label>Gender <span class="req">*</span></label>
                <div class="lis-seg" role="group" aria-label="Select gender">
                  @for (g of ['Male','Female','Other']; track g) {
                    <button type="button" class="lis-seg__opt"
                      [class.lis-seg__opt--active]="form.value.gender === g"
                      (click)="form.patchValue({gender: g})"
                      [attr.aria-pressed]="form.value.gender === g"
                    >{{ g }}</button>
                  }
                </div>
              </div>
              <div class="lis-field">
                <label for="bloodGroup">Blood group</label>
                <select id="bloodGroup" formControlName="bloodGroup">
                  @for (bg of bloodGroups; track bg) { <option [value]="bg">{{ bg }}</option> }
                </select>
              </div>
              <div class="lis-field">
                <label for="mobile">Mobile <span class="req">*</span></label>
                <input id="mobile" formControlName="mobile" type="tel" />
              </div>
              <div class="lis-field">
                <label for="email">Email</label>
                <input id="email" formControlName="email" type="email" />
              </div>
              <div class="lis-field form-full">
                <label for="address">Address</label>
                <textarea id="address" formControlName="address"></textarea>
              </div>
            </div>
          </div>

          <!-- Step 2 — Clinical info -->
          <div class="lis-card reg-card">
            <div class="lis-card__header">
              <i class="ti ti-stethoscope" style="color:var(--lis-primary,#1D9E75);font-size:15px" aria-hidden="true"></i>
              <h2 class="lis-card__title">Clinical information</h2>
              <span class="lis-badge lis-badge--warn">Step 2</span>
            </div>
            <div class="form-grid">
              <div class="lis-field">
                <label for="refDoctor">Referring doctor <span class="req">*</span></label>
                <select id="refDoctor" formControlName="refDoctor">
                  @for (d of doctors; track d) { <option [value]="d">{{ d }}</option> }
                  <option value="new">+ Add new doctor</option>
                </select>
              </div>
              <div class="lis-field">
                <label>Visit type</label>
                <div class="lis-seg" role="group" aria-label="Select visit type">
                  @for (v of ['Walk-in','Appointment','Home visit']; track v) {
                    <button type="button" class="lis-seg__opt"
                      [class.lis-seg__opt--active]="form.value.visitType === v"
                      (click)="form.patchValue({visitType: v})"
                      [attr.aria-pressed]="form.value.visitType === v"
                    >{{ v }}</button>
                  }
                </div>
              </div>
              <div class="lis-field">
                <label>Fasting status</label>
                <div class="lis-seg" role="group" aria-label="Select fasting status">
                  @for (f of ['Fasting','Non-fasting','Unknown']; track f) {
                    <button type="button" class="lis-seg__opt"
                      [class.lis-seg__opt--active]="form.value.fasting === f"
                      (click)="form.patchValue({fasting: f})"
                      [attr.aria-pressed]="form.value.fasting === f"
                    >{{ f }}</button>
                  }
                </div>
              </div>
              <div class="lis-field">
                <label for="collection">Sample collection</label>
                <select id="collection" formControlName="collection">
                  <option>At lab counter</option>
                  <option>Home collection</option>
                </select>
              </div>
              <div class="lis-field form-full">
                <label for="clinicalNotes">Clinical notes / symptoms</label>
                <textarea id="clinicalNotes" formControlName="clinicalNotes" placeholder="e.g. fatigue, weight gain, palpitations — 3 months…"></textarea>
              </div>
              <div class="lis-field form-full">
                <label for="medications">Known conditions / medications</label>
                <textarea id="medications" formControlName="medications" placeholder="e.g. Type 2 diabetes, on Metformin 500mg…"></textarea>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="lis-btn lis-btn--secondary">Back</button>
            <button type="button" class="lis-btn lis-btn--primary" (click)="nextStep()">
              Next: Select tests <i class="ti ti-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </form>
      </div>

      <!-- Right: test order panel -->
      <aside class="order-panel lis-card" aria-label="Test order">
        <div class="lis-card__header">
          <i class="ti ti-test-pipe" style="color:var(--lis-primary,#1D9E75);font-size:15px" aria-hidden="true"></i>
          <h2 class="lis-card__title">Test order</h2>
          <span class="lis-badge">{{ selectedTests().length }} added</span>
        </div>

        <!-- Search -->
        <div class="order-search">
          <i class="ti ti-search" aria-hidden="true"></i>
          <input
            type="search" placeholder="Search test…" aria-label="Search tests"
            [value]="testQuery()"
            (input)="testQuery.set($any($event.target).value)"
          />
        </div>

        <!-- Category filter -->
        <div class="cat-pills" role="group" aria-label="Test categories">
          @for (cat of categories; track cat) {
            <button type="button"
              class="cat-pill"
              [class.cat-pill--active]="activeCategory() === cat"
              (click)="activeCategory.set(cat)"
              [attr.aria-pressed]="activeCategory() === cat"
            >{{ cat }}</button>
          }
        </div>

        <!-- Test list -->
        <div class="test-scroll" role="list" aria-label="Available tests">
          @for (t of filteredTests(); track t.id) {
            <div class="test-row" role="listitem"
              [class.test-row--selected]="isSelected(t.id)"
              (click)="toggleTest(t)"
              [attr.aria-pressed]="isSelected(t.id)"
              [attr.aria-label]="t.name + ', ' + t.category + ', ₹' + t.price"
            >
              <div class="test-info">
                <div class="test-name">{{ t.name }}</div>
                <div class="test-meta">{{ t.category }} · {{ t.tatHours }}h TAT</div>
              </div>
              <div class="test-price">₹{{ t.price }}</div>
              <div class="test-tog" [attr.aria-hidden]="true">
                @if (isSelected(t.id)) { <i class="ti ti-check"></i> }
                @else { <i class="ti ti-plus"></i> }
              </div>
            </div>
          }
        </div>

        <!-- Priority -->
        <div class="priority-sec">
          <div class="priority-label">Priority</div>
          <div class="priority-row" role="group" aria-label="Order priority">
            @for (p of ['Routine','Urgent','STAT']; track p) {
              <button type="button" class="prio-btn"
                [class.prio-btn--active]="priority() === p"
                [class.prio-btn--stat]="p === 'STAT' && priority() === 'STAT'"
                (click)="priority.set(p)"
                [attr.aria-pressed]="priority() === p"
              >{{ p }}</button>
            }
          </div>
        </div>

        <!-- Summary -->
        <div class="order-summary">
          <div class="sum-hd">Ordered tests</div>
          <div class="sum-items" role="list" aria-label="Selected tests">
            @if (selectedTests().length === 0) {
              <div class="sum-empty">No tests selected yet.</div>
            }
            @for (t of selectedTests(); track t.id) {
              <div class="sum-item" role="listitem">
                <span class="sum-name">{{ t.name }}</span>
                <span class="sum-price">₹{{ t.price }}</span>
                <button type="button" class="sum-del" (click)="toggleTest(t)" [attr.aria-label]="'Remove ' + t.name">
                  <i class="ti ti-x" aria-hidden="true"></i>
                </button>
              </div>
            }
          </div>
          <div class="sum-foot">
            <div class="sum-row"><span>Tests</span><span>{{ selectedTests().length }}</span></div>
            <div class="sum-row"><span>Est. TAT</span><span>{{ maxTat() }}h</span></div>
            <div class="sum-row sum-row--grand"><span>Total</span><span>₹{{ total().toLocaleString('en-IN') }}</span></div>
          </div>
        </div>

        <div class="order-actions">
          <a routerLink="/dashboard/billing" class="lis-btn lis-btn--primary lis-btn--full">
            <i class="ti ti-file-invoice" aria-hidden="true"></i> Save & go to billing
          </a>
          <button type="button" class="lis-btn lis-btn--secondary lis-btn--full">
            <i class="ti ti-device-floppy" aria-hidden="true"></i> Save draft
          </button>
        </div>
      </aside>
    </div>
  `,
  styles:[`
    :host { display: block; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:14px; }
    .page-title  { font-size:20px; font-weight:500; color:var(--text-primary); margin:0 0 3px; }
    .breadcrumb  { display:flex; list-style:none; padding:0; margin:0; gap:6px; font-size:12px; color:var(--text-secondary); }
    .breadcrumb li+li::before { content:'/'; margin-right:6px; }
    .breadcrumb a { color:var(--text-secondary); text-decoration:none; &:hover { color:var(--lis-primary,#1D9E75); } }
    .pid-badge   { display:flex; align-items:center; gap:10px; background:var(--lis-primary-xlight,#E1F5EE); border-radius:9px; padding:9px 14px; }
    .pid-badge i { font-size:20px; color:var(--lis-primary,#1D9E75); }
    .pid-label   { font-size:10px; color:var(--lis-primary-deep,#085041); }
    .pid-value   { font-size:14px; font-weight:500; color:var(--lis-primary-deep,#085041); }

    /* Stepper */
    .stepper { display:flex; align-items:center; padding:0 0 14px; gap:0; }
    .step    { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); }
    .step--active { color:var(--lis-primary-deep,#085041); font-weight:500; }
    .step--done   { color:var(--text-secondary); }
    .step-num {
      width:20px; height:20px; border-radius:50%;
      border:1.5px solid var(--border-color);
      display:flex; align-items:center; justify-content:center;
      font-size:10px; font-weight:500; flex-shrink:0;
    }
    .step--active .step-num { background:var(--lis-primary,#1D9E75); border-color:var(--lis-primary,#1D9E75); color:#fff; }
    .step--done   .step-num { background:var(--lis-primary-xlight,#E1F5EE); border-color:var(--lis-primary,#1D9E75); color:var(--lis-primary-deep,#085041); }
    .step-arrow { color:var(--border-color); font-size:13px; margin:0 6px; }

    /* Layout */
    .reg-layout { display:grid; grid-template-columns:1fr 270px; gap:14px; align-items:start; }
    @media (max-width:900px) { .reg-layout { grid-template-columns:1fr; } }
    .reg-main    { display:flex; flex-direction:column; gap:12px; }
    .reg-card    { margin-bottom:0; }

    /* Form grid */
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:13px 14px; }
    .form-full  { grid-column:1/-1; }
    @media (max-width:540px) { .form-grid { grid-template-columns:1fr; } }
    .input-error { border-color:#E24B4A !important; }
    .err-msg     { font-size:10px; color:#E24B4A; margin-top:2px; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; padding-top:4px; }

    /* Order panel */
    .order-panel { display:flex; flex-direction:column; position:sticky; top:80px; }
    .order-search {
      display:flex; align-items:center; gap:7px;
      background:var(--body-bg); border-bottom:0.5px solid var(--border-color);
      padding:8px 13px;
      i { color:var(--text-secondary); font-size:14px; }
      input { background:transparent; border:none; outline:none; font-size:12px; color:var(--text-primary); flex:1; }
    }
    .cat-pills { display:flex; gap:5px; flex-wrap:wrap; padding:8px 13px 6px; }
    .cat-pill {
      font-size:10px; padding:3px 8px; border-radius:20px;
      border:0.5px solid var(--border-color); cursor:pointer;
      color:var(--text-secondary); background:var(--card-bg);
    }
    .cat-pill--active { background:var(--lis-primary-xlight,#E1F5EE); color:var(--lis-primary-deep,#085041); border-color:var(--lis-primary-mid,#5DCAA5); }
    .test-scroll { padding:0 13px 8px; display:flex; flex-direction:column; gap:5px; max-height:180px; overflow-y:auto; }
    .test-row {
      display:flex; align-items:center; gap:7px; padding:7px 9px;
      border:0.5px solid var(--border-color); border-radius:8px; cursor:pointer;
    }
    .test-row:hover { background:var(--body-bg); }
    .test-row--selected { background:var(--lis-primary-xlight,#E1F5EE); border-color:var(--lis-primary-mid,#5DCAA5); }
    .test-info { flex:1; min-width:0; }
    .test-name { font-size:11px; font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .test-meta { font-size:10px; color:var(--text-secondary); }
    .test-price { font-size:11px; font-weight:500; color:var(--lis-primary-deep,#085041); min-width:40px; text-align:right; }
    .test-tog {
      width:18px; height:18px; border-radius:50%; flex-shrink:0;
      border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--text-secondary);
      .test-row--selected & { background:var(--lis-primary,#1D9E75); border-color:var(--lis-primary,#1D9E75); color:#fff; }
    }
    .priority-sec { padding:8px 13px; border-top:0.5px solid var(--border-color); }
    .priority-label { font-size:10px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.05em; font-weight:500; margin-bottom:5px; }
    .priority-row { display:flex; gap:6px; }
    .prio-btn {
      flex:1; padding:6px 4px; border:0.5px solid var(--border-color); border-radius:7px;
      text-align:center; cursor:pointer; font-size:10px; color:var(--text-secondary); background:var(--card-bg);
    }
    .prio-btn--active { border-color:var(--lis-primary,#1D9E75); background:var(--lis-primary-xlight,#E1F5EE); color:var(--lis-primary-deep,#085041); font-weight:500; }
    .prio-btn--stat   { border-color:#E24B4A; background:#FCEBEB; color:#791F1F; }
    .sum-hd   { padding:8px 13px 4px; font-size:10px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.05em; font-weight:500; }
    .sum-items{ padding:0; }
    .sum-empty{ font-size:11px; color:var(--text-secondary); padding:6px 13px 8px; }
    .sum-item { display:flex; align-items:center; gap:6px; padding:6px 13px; border-bottom:0.5px solid var(--border-color); font-size:11px; }
    .sum-name { flex:1; color:var(--text-primary); }
    .sum-price{ color:var(--text-primary); min-width:40px; text-align:right; }
    .sum-del  { background:none; border:none; cursor:pointer; color:var(--text-secondary); font-size:12px; &:hover { color:#E24B4A; } }
    .sum-foot { padding:8px 13px; background:var(--body-bg); }
    .sum-row  { display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary); padding:2px 0; }
    .sum-row--grand { font-size:13px; font-weight:500; color:var(--text-primary); padding-top:6px; border-top:0.5px solid var(--border-color); margin-top:4px; }
    .order-actions { padding:10px 13px; display:flex; flex-direction:column; gap:6px; }
  `]
})
export class PatientRegistrationComponent {
  protected readonly steps = [
    { n:1, label:'Demographics' },
    { n:2, label:'Clinical info' },
    { n:3, label:'Test order' },
    { n:4, label:'Confirm' },
  ];
  protected readonly bloodGroups = ['A+','A−','B+','B−','O+','O−','AB+','AB−','Unknown'];
  protected readonly doctors = DOCTORS;
  protected readonly allTests = LAB_TESTS;
  protected readonly categories = ['All', 'Haematology', 'Biochemistry', 'Endocrinology', 'Urine'];

  currentStep  = signal(2);
  testQuery    = signal('');
  activeCategory = signal('All');
  priority     = signal('Routine');
  private _selected = signal<Set<string>>(new Set(['TSH','CBC']));

  form: FormGroup;
  ageDisplay = signal('');

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      firstName:    ['Ananya', Validators.required],
      lastName:     ['Krishnaswamy', Validators.required],
      dob:          ['1990-03-14'],
      gender:       ['Female'],
      bloodGroup:   ['B+'],
      mobile:       ['91xxxxxxx44', Validators.required],
      email:        ['ananya.k@email.com'],
      address:      ['14, 3rd Cross, Jayanagar 4th Block, Bengaluru — 560041'],
      refDoctor:    [DOCTORS[0]],
      visitType:    ['Walk-in'],
      fasting:      ['Fasting'],
      collection:   ['At lab counter'],
      clinicalNotes:['Fatigue, weight gain, cold intolerance — 3 months. Suspected hypothyroidism.'],
      medications:  [''],
    });
    this.calcAge();
  }

  calcAge(): void {
    const dob = this.form.value.dob;
    if (!dob) { this.ageDisplay.set(''); return; }
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    this.ageDisplay.set(age + ' years');
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  nextStep(): void {
    if (this.currentStep() < 4) this.currentStep.update(s => s + 1);
  }

  filteredTests = computed(() => {
    const q   = this.testQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.allTests.filter(t =>
      (cat === 'All' || t.category === cat) &&
      (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    );
  });

  selectedTests = computed(() =>
    this.allTests.filter(t => this._selected().has(t.id))
  );

  total = computed(() => this.selectedTests().reduce((a, t) => a + t.price, 0));

  maxTat = computed(() =>
    this.selectedTests().reduce((m, t) => Math.max(m, t.tatHours), 0)
  );

  isSelected(id: string): boolean { return this._selected().has(id); }

  toggleTest(t: LabTest): void {
    this._selected.update(s => {
      const next = new Set(s);
      next.has(t.id) ? next.delete(t.id) : next.add(t.id);
      return next;
    });
  }

  onSubmit(): void { /* Wire to real API */ }
}
