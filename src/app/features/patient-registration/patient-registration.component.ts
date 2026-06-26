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
    templateUrl: './patient-registration.component.html',
    styleUrl: './patient-registration.component.css',
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
