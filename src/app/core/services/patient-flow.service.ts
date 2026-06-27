// ─────────────────────────────────────────────
//  MedPath LIS — Patient Flow State Service
//  Single source of truth shared across the
//  Registration → Test Order → Billing →
//  Sample Collection workflow.
// ─────────────────────────────────────────────
import { Injectable, signal, computed } from '@angular/core';
import { LabTest, Priority, PaymentMode } from '../../shared/models/lis.models';

export interface RegisteredPatient {
  id: string;           // PAT-2406-NNNN
  firstName: string;
  lastName: string;
  dob: string;
  ageYears: number;
  gender: string;
  bloodGroup: string;
  mobile: string;
  email: string;
  address: string;
  refDoctor: string;
  visitType: string;
  fasting: string;
  collection: string;
  clinicalNotes: string;
  medications: string;
}

export interface OrderedTest {
  test: LabTest;
  priority: Priority;
}

export interface BillingSummary {
  subtotal: number;
  discountPct: number;
  discountAmt: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  invoiceId: string;
}

const LAB_TESTS: LabTest[] = [
  { id:'CBC',  name:'CBC — Complete blood count',   category:'Haematology',   price:200, tatHours:4 },
  { id:'ESR',  name:'ESR',                           category:'Haematology',   price:80,  tatHours:2 },
  { id:'GLU',  name:'Blood glucose (fasting)',        category:'Biochemistry',  price:120, tatHours:2 },
  { id:'HBA',  name:'HbA1c',                         category:'Biochemistry',  price:400, tatHours:4 },
  { id:'LFT',  name:'Liver function test',            category:'Biochemistry',  price:550, tatHours:6 },
  { id:'KFT',  name:'Kidney function test',           category:'Biochemistry',  price:500, tatHours:6 },
  { id:'LIP',  name:'Lipid profile',                  category:'Biochemistry',  price:450, tatHours:6 },
  { id:'TSH',  name:'TSH',                            category:'Endocrinology', price:350, tatHours:6 },
  { id:'FT3',  name:'Free T3 / T4 / TSH panel',      category:'Endocrinology', price:700, tatHours:8 },
  { id:'VTD',  name:'Vitamin D (25-OH)',              category:'Endocrinology', price:900, tatHours:8 },
  { id:'URI',  name:'Urine routine & microscopy',     category:'Urine',         price:100, tatHours:2 },
  { id:'UCR',  name:'Urine creatinine',               category:'Urine',         price:150, tatHours:2 },
  { id:'CRP',  name:'C-Reactive Protein',             category:'Biochemistry',  price:320, tatHours:4 },
  { id:'FER',  name:'Serum Ferritin',                 category:'Biochemistry',  price:380, tatHours:6 },
  { id:'B12',  name:'Vitamin B12',                    category:'Biochemistry',  price:750, tatHours:6 },
];

const POPULAR_IDS = ['CBC','LFT','KFT','HBA','VTD','TSH','LIP'];

const DOCTORS = [
  'Dr. Pradeep Iyer (Cardiology)',
  'Dr. Suresh Menon (Internal Medicine)',
  'Dr. Anita Rao (Endocrinology)',
  'Dr. Meera Pillai (General Practice)',
  'Self / Walk-in',
];

@Injectable({ providedIn: 'root' })
export class PatientFlowService {
  // ── Master test catalogue ─────────────────
  readonly allTests  = LAB_TESTS;
  readonly popularTests = LAB_TESTS.filter(t => POPULAR_IDS.includes(t.id));
  readonly doctors   = DOCTORS;
  readonly categories = ['All','Haematology','Biochemistry','Endocrinology','Urine'];

  // ── Registered patient ────────────────────
  private _patient  = signal<RegisteredPatient | null>(null);
  readonly patient  = this._patient.asReadonly();

  // ── Test order ────────────────────────────
  private _selected  = signal<Set<string>>(new Set());
  private _priority  = signal<Priority>('routine');
  readonly priority  = this._priority.asReadonly();

  readonly selectedIds    = this._selected.asReadonly();
  readonly selectedTests  = computed(() =>
    this.allTests.filter(t => this._selected().has(t.id))
  );
  readonly orderTotal     = computed(() =>
    this.selectedTests().reduce((a, t) => a + t.price, 0)
  );
  readonly maxTat         = computed(() =>
    this.selectedTests().reduce((m, t) => Math.max(m, t.tatHours), 0)
  );

  // ── Billing ───────────────────────────────
  private _discountPct  = signal(0);
  private _payMode      = signal<PaymentMode>('cash');
  readonly discountPct  = this._discountPct.asReadonly();
  readonly payMode      = this._payMode.asReadonly();
  readonly discountAmt  = computed(() =>
    Math.round(this.orderTotal() * this._discountPct() / 100)
  );
  readonly grandTotal   = computed(() =>
    this.orderTotal() - this.discountAmt()
  );

  // ── Actions ───────────────────────────────
  registerPatient(data: Omit<RegisteredPatient, 'id'>): RegisteredPatient {
    const seq = String(Math.floor(Math.random() * 900) + 100);
    const mm  = String(new Date().getMonth() + 1).padStart(2, '0');
    const yy  = String(new Date().getFullYear()).slice(2);
    const pat: RegisteredPatient = { ...data, id: `PAT-${yy}${mm}-0${seq}` };
    this._patient.set(pat);
    this._selected.set(new Set());          // reset tests for new patient
    this._discountPct.set(0);
    this._payMode.set('cash');
    return pat;
  }

  toggleTest(id: string): void {
    this._selected.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  setPriority(p: Priority): void { this._priority.set(p); }
  setDiscount(pct: number): void { this._discountPct.set(pct); }
  setPayMode(m: PaymentMode): void { this._payMode.set(m); }

  generateInvoiceId(): string {
    const seq = String(Math.floor(Math.random() * 900) + 100);
    const mm  = String(new Date().getMonth() + 1).padStart(2, '0');
    const yy  = String(new Date().getFullYear()).slice(2);
    return `INV-${yy}${mm}-0${seq}`;
  }

  calcAge(dob: string): number {
    if (!dob) return 0;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  }
}
