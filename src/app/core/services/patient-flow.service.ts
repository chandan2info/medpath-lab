// ─────────────────────────────────────────────
//  MedPath LIS — Patient Flow State Service
//  Single source of truth shared across the
//  Registration → Test Order → Billing →
//  Sample Collection workflow.
// ─────────────────────────────────────────────
import { Injectable, signal, computed } from '@angular/core';
import { LabTest, Priority, PaymentMode, TestPackage } from '../../shared/models/lis.models';

export interface RegisteredPatient {
  id: string;           // PAT-2406-NNNN
  firstName: string;
  lastName: string;
  dob: string;
  ageYears: string;
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
  collectionAddress?: string;
  collectionDate?: string;
  collectionTime?: string;
  collectionInstructions?: string;
}

export interface OrderedTest {
  test: LabTest;
  priority: Priority;
}

export interface OrderDraft {
  id: string;
  patient: RegisteredPatient;
  patientId: string;
  testIds: string[];
  priority: Priority;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
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
  { id:'CBC',  name:'CBC — Complete blood count',   category:'Haematology',   price:200, tatHours:4, tubeType:'EDTA (Purple top)',      sampleType:'Whole blood', prep:'None' },
  { id:'ESR',  name:'ESR',                           category:'Haematology',   price:80,  tatHours:2, tubeType:'EDTA (Purple top)',      sampleType:'Whole blood', prep:'None' },
  { id:'GLU',  name:'Blood glucose (fasting)',        category:'Biochemistry',  price:120, tatHours:2, tubeType:'Fluoride (Grey top)',    sampleType:'Plasma',      prep:'8–10h fasting required' },
  { id:'HBA',  name:'HbA1c',                         category:'Biochemistry',  price:400, tatHours:4, tubeType:'EDTA (Purple top)',      sampleType:'Whole blood', prep:'None' },
  { id:'LFT',  name:'Liver function test',            category:'Biochemistry',  price:550, tatHours:6, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'8h fasting recommended' },
  { id:'KFT',  name:'Kidney function test',           category:'Biochemistry',  price:500, tatHours:6, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'None' },
  { id:'LIP',  name:'Lipid profile',                  category:'Biochemistry',  price:450, tatHours:6, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'10–12h fasting required' },
  { id:'TSH',  name:'TSH',                            category:'Endocrinology', price:350, tatHours:6, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'None' },
  { id:'FT3',  name:'Free T3 / T4 / TSH panel',      category:'Endocrinology', price:700, tatHours:8, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'None' },
  { id:'VTD',  name:'Vitamin D (25-OH)',              category:'Endocrinology', price:900, tatHours:8, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'None' },
  { id:'URI',  name:'Urine routine & microscopy',     category:'Urine',         price:100, tatHours:2, tubeType:'Universal container',    sampleType:'Urine (midstream)', prep:'First morning sample preferred' },
  { id:'UCR',  name:'Urine creatinine',               category:'Urine',         price:150, tatHours:2, tubeType:'Universal container',    sampleType:'Urine',       prep:'None' },
  { id:'CRP',  name:'C-Reactive Protein',             category:'Biochemistry',  price:320, tatHours:4, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'None' },
  { id:'FER',  name:'Serum Ferritin',                 category:'Biochemistry',  price:380, tatHours:6, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'None' },
  { id:'B12',  name:'Vitamin B12',                    category:'Biochemistry',  price:750, tatHours:6, tubeType:'SST (Red/Gold top)',     sampleType:'Serum',       prep:'None' },
];

const POPULAR_IDS = ['CBC','LFT','KFT','HBA','VTD','TSH','LIP'];

/** Mocked recency signal for demo purposes — in production this would come
 *  from the receptionist's actual order history. */
const RECENT_IDS = ['CBC','HBA','KFT','VTD'];

/** "Patients also order" — a lightweight, static cross-sell map. Keyed by a
 *  selected test id, value is the ids commonly ordered alongside it. */
const RELATED_TESTS: Record<string, string[]> = {
  HBA: ['GLU','LIP','TSH'],
  GLU: ['HBA','LIP'],
  LIP: ['HBA','GLU'],
  LFT: ['KFT','CRP'],
  KFT: ['LFT','URI'],
  TSH: ['FT3','VTD'],
  CBC: ['ESR','CRP'],
};

const TEST_PACKAGES: TestPackage[] = [
  { id:'PKG-DIA', name:'Diabetes Package',  testIds:['HBA','GLU','LIP'] },
  { id:'PKG-KID', name:'Kidney Package',    testIds:['KFT','URI','UCR'] },
  { id:'PKG-THY', name:'Thyroid Package',   testIds:['TSH','FT3'] },
  { id:'PKG-WEL', name:'Wellness Package',  testIds:['CBC','LFT','KFT','LIP','TSH'] },
];

const DOCTORS = [
  'Dr. Pradeep Iyer (Cardiology)',
  'Dr. Suresh Menon (Internal Medicine)',
  'Dr. Anita Rao (Endocrinology)',
  'Dr. Meera Pillai (General Practice)',
  'Self / Walk-in',
];

// Mock "already registered" directory — used only to demo
// duplicate-patient detection on the registration form.
// Replace with a real lookup API call in production.
export interface KnownPatientRecord {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  mobile: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  email: string;
  address: string;
  registeredLabel: string;
}

const KNOWN_PATIENTS: KnownPatientRecord[] = [
  { id:'PAT-2608-0101', name:'Chandan Kumar', firstName:'Chandan', lastName:'Kumar', mobile:'9876543210', dob:'1991-05-14', gender:'Male', bloodGroup:'B+', email:'', address:'', registeredLabel:'Registered 3 months ago' },
  { id:'PAT-2611-0102', name:'Priya Sharma', firstName:'Priya', lastName:'Sharma', mobile:'9845123456', dob:'1994-02-21', gender:'Female', bloodGroup:'O+', email:'priya@example.com', address:'Indiranagar, Bengaluru', registeredLabel:'Registered 2 weeks ago' },
];

@Injectable({ providedIn: 'root' })
export class PatientFlowService {
  // ── Master test catalogue ─────────────────
  readonly allTests  = LAB_TESTS;
  readonly popularTests = LAB_TESTS.filter(t => POPULAR_IDS.includes(t.id));
  readonly recentTests  = LAB_TESTS.filter(t => RECENT_IDS.includes(t.id));
  readonly testPackages: TestPackage[] = TEST_PACKAGES;
  readonly doctors   = DOCTORS;
  readonly categories = ['All','Haematology','Biochemistry','Endocrinology','Urine'];

  /** Ids commonly ordered alongside a given test id ("patients also order"). */
  relatedTo(testId: string): string[] {
    return RELATED_TESTS[testId] ?? [];
  }

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

  // ── Local order drafts (multi-draft + autosave) ──
  private readonly draftsStorageKey = 'medpath.orderDrafts.v2';
  readonly orderDrafts = signal<OrderDraft[]>(this.readOrderDrafts());
  readonly activeDraftId = signal<string | null>(null);

  private readOrderDrafts(): OrderDraft[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(this.draftsStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  private writeOrderDrafts(drafts: OrderDraft[]): void {
    try {
      localStorage.setItem(this.draftsStorageKey, JSON.stringify(drafts));
      this.orderDrafts.set(drafts);
    } catch {
      throw new Error('Draft autosave failed. Browser storage may be full or unavailable.');
    }
  }

  private persistActiveDraft(): void {
    const patient = this._patient();
    if (!patient || this._selected().size === 0) return;
    const now = new Date().toISOString();
    const id = this.activeDraftId() ?? (globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    const existing = this.orderDrafts().find(d => d.id === id);
    const draft: OrderDraft = {
      id, patient: { ...patient }, patientId: patient.id,
      testIds: [...this._selected()], priority: this._priority(),
      subtotal: this.orderTotal(), createdAt: existing?.createdAt ?? now, updatedAt: now
    };
    const drafts = [draft, ...this.orderDrafts().filter(d => d.id !== id)];
    this.writeOrderDrafts(drafts);
    this.activeDraftId.set(id);
  }

  saveOrderDraft(): OrderDraft {
    const patient = this._patient();
    if (!patient) throw new Error('A patient must be selected before saving a draft.');
    if (this._selected().size === 0) throw new Error('Add at least one test before saving a draft.');
    this.persistActiveDraft();
    const saved = this.orderDrafts().find(d => d.id === this.activeDraftId());
    if (!saved) throw new Error('The draft could not be saved. Please try again.');
    return saved;
  }

  restoreOrderDraft(id: string): OrderDraft | null {
    const draft = this.orderDrafts().find(d => d.id === id);
    if (!draft) return null;
    this._patient.set({ ...draft.patient });
    this._selected.set(new Set(draft.testIds.filter(testId => this.allTests.some(t => t.id === testId))));
    this._priority.set(draft.priority);
    this._discountPct.set(0);
    this.activeDraftId.set(draft.id);
    return draft;
  }

  deleteOrderDraft(id: string): void {
    this.writeOrderDrafts(this.orderDrafts().filter(d => d.id !== id));
    if (this.activeDraftId() === id) this.activeDraftId.set(null);
  }

  clearActiveDraft(): void { this.activeDraftId.set(null); }

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
  registerPatient(data: Omit<RegisteredPatient, 'id'>, existingPatientId?: string): RegisteredPatient {
    const seq = String(Math.floor(Math.random() * 900) + 100);
    const mm  = String(new Date().getMonth() + 1).padStart(2, '0');
    const yy  = String(new Date().getFullYear()).slice(2);
    const pat: RegisteredPatient = { ...data, id: existingPatientId ?? `PAT-${yy}${mm}-0${seq}` };
    this._patient.set(pat);
    this._selected.set(new Set());          // reset tests for new patient
    this.activeDraftId.set(null);
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
    this.persistActiveDraft();
  }

  setPriority(p: Priority): void { this._priority.set(p); this.persistActiveDraft(); }
  setDiscount(pct: number): void { this._discountPct.set(pct); }
  setPayMode(m: PaymentMode): void { this._payMode.set(m); }

  generateInvoiceId(): string {
    const seq = String(Math.floor(Math.random() * 900) + 100);
    const mm  = String(new Date().getMonth() + 1).padStart(2, '0');
    const yy  = String(new Date().getFullYear()).slice(2);
    return `INV-${yy}${mm}-0${seq}`;
  }

  // Looks up an existing patient by mobile number so the
  // registration form can warn about possible duplicates.
  findByMobile(mobile: string): KnownPatientRecord | null {
    if (!mobile || mobile.length !== 10) return null;
    return KNOWN_PATIENTS.find(p => p.mobile === mobile) ?? null;
  }

  searchPatients(query: string): KnownPatientRecord[] {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return KNOWN_PATIENTS.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.mobile.includes(q)
    );
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

  // Same calculation as calcAge(), but returns the raw Y/M/D numbers
  // instead of a formatted sentence — used by the stylish Age card
  // on Patient Registration, which renders each unit as its own
  // colour-coded segment rather than a single string.
  calcAgeParts(dob: string): { years: number; months: number; days: number } {
  if (!dob) {
    return { years: 0, months: 0, days: 0 };
  }

  const birth = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days };
}

  /**
   * Human-readable "Y-M-D" age breakdown, e.g. "19y 11m 14d".
   * Single source of truth for this format — previously each page
   * (Billing, Test Order, Sample Collection) built its own string
   * and each one used a different style ("19Y-11M-14Days" vs
   * "19 Years - 11 Months - 14 Days"). Lowercase, single-letter,
   * space-separated units read faster than mixing abbreviated and
   * spelled-out units, and are compact enough for a dense
   * pipe-separated metadata row.
   */
  formatAgeBreakdown(dob: string): string {
    const { years, months, days } = this.calcAgeParts(dob);
    return `${years}y ${months}m ${days}d`;
  }
}
