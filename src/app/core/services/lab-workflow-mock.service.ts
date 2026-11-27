import { Injectable, signal, computed } from '@angular/core';

export type PatientVisitStatus = 'registered' | 'ordered' | 'billed' | 'in-lab' | 'completed';
export type MockSampleStatus = 'collected' | 'received' | 'processing' | 'results-entered' | 'awaiting-validation' | 'validated' | 'rejected';
export type MockResultStatus = 'draft' | 'awaiting-validation' | 'validated' | 'rejected';
export type MockReportStatus = 'generated' | 'dispatched';

export interface MockVisit {
  id: string; patientId: string; patientName: string; createdAt: string; status: PatientVisitStatus;
  ageYears?: string; gender?: string; mobile?: string; refDoctor?: string;
}
export interface MockLabOrder {
  id: string; visitId: string; patientId: string; testIds: string[]; priority: 'routine'|'urgent'|'stat';
  subtotal: number; discount: number; total: number; createdAt: string;
}
export interface MockInvoice {
  id: string; orderId: string; total: number; amountReceived: number; balanceDue: number;
  paymentMode: 'cash'|'upi'|'card'|'credit'; payments: Array<{id:string;amount:number;mode:string;recordedAt:string}>;
  status: 'unpaid'|'partial'|'paid'; createdAt: string;
}
export interface MockLabSample {
  id: string; orderId: string; visitId: string; patientId: string; patientName: string;
  gender?: 'male'|'female'|'other';
  dob?: string;
  testIds: string[]; priority: 'routine'|'urgent'|'stat'; status: MockSampleStatus;
  fastingStatus?: 'fasting'|'non-fasting'|'post-meal'|'unknown';
  collectedAt: string; collector: string; checklist: string[]; notes: string;
  specimenGroups: Array<{tubeType:string;sampleType:string;testIds:string[]}>;
}
export interface MockResultRecord {
  id: string; sampleId: string; status: MockResultStatus; values: Record<string,string>; parameterLabels?: Record<string,string>;
  parameterDetails?: Record<string,{ unit:string; range:string; flag:'normal'|'high'|'low'|'critical'|'unavailable'; method:string }>;
  updatedAt: string; reviewer?: string; reviewedAt?: string; reviewNote?: string;
}
export interface MockReport {
  id: string; sampleId: string; resultId: string; status: MockReportStatus;
  generatedAt: string; dispatchedAt?: string; dispatchMode?: string;
}

interface StoreState {
  visits: MockVisit[]; orders: MockLabOrder[]; invoices: MockInvoice[];
  samples: MockLabSample[]; results: MockResultRecord[]; reports: MockReport[];
}

/**
 * Offline-first mock repository for the two MedPath workflows.
 * Components use this contract now; replace the implementation with API
 * adapters when the backend is ready. localStorage is demo persistence only,
 * not a production database or a clinical record store.
 */
@Injectable({ providedIn: 'root' })
export class LabWorkflowMockService {
  private readonly storageKey = 'medpath.workflow.mock.v1';
  private readonly state = signal<StoreState>(this.readState());
  readonly visits = computed(() => this.state().visits);
  readonly orders = computed(() => this.state().orders);
  readonly invoices = computed(() => this.state().invoices);
  readonly samples = computed(() => this.state().samples);
  readonly results = computed(() => this.state().results);
  readonly reports = computed(() => this.state().reports);

  private readState(): StoreState {
    const empty: StoreState = { visits: [], orders: [], invoices: [], samples: [], results: [], reports: [] };
    try {
      if (typeof localStorage === 'undefined') return empty;
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return empty;
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      return { ...empty, ...parsed };
    } catch { return empty; }
  }

  private persist(next: StoreState): void {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(this.storageKey, JSON.stringify(next));
      this.state.set(next);
    } catch {
      throw new Error('Unable to save the mock workflow record. Browser storage may be unavailable or full.');
    }
  }

  private id(prefix: string): string {
    const date = new Date();
    const stamp = date.toISOString().slice(2,10).replace(/-/g,'');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${stamp}-${random}`;
  }

  createVisit(patient: {id:string; firstName:string; lastName:string; ageYears?:string; gender?:string; mobile?:string; refDoctor?:string}): MockVisit {
    const current = this.state();
    const visit: MockVisit = {
      id: this.id('VIS'), patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      ageYears: patient.ageYears, gender: patient.gender, mobile: patient.mobile, refDoctor: patient.refDoctor,
      createdAt: new Date().toISOString(), status: 'registered'
    };
    this.persist({ ...current, visits: [visit, ...current.visits] });
    return visit;
  }

  createOrder(input: Omit<MockLabOrder,'id'|'createdAt'>): MockLabOrder {
    if (!input.testIds.length) throw new Error('At least one test is required to create an order.');
    const current = this.state();
    const order: MockLabOrder = { ...input, id: this.id('ORD'), createdAt: new Date().toISOString() };
    this.persist({
      ...current, orders: [order, ...current.orders],
      visits: current.visits.map(v => v.id === order.visitId ? { ...v, status: 'ordered' } : v)
    });
    return order;
  }

  recordInvoice(input: {id:string;orderId:string;total:number;amountReceived:number;paymentMode:'cash'|'upi'|'card'|'credit'}): MockInvoice {
    const current = this.state();
    const existing = current.invoices.find(i => i.orderId === input.orderId);
    const requestedAmount = Math.max(0, Math.min(input.total, input.amountReceived));
    const amount = Math.max(existing?.amountReceived ?? 0, requestedAmount);
    const additionalPayment = amount - (existing?.amountReceived ?? 0);
    const payments = [...(existing?.payments ?? [])];
    if (additionalPayment > 0) payments.push({
      id: this.id('PAY'), amount: additionalPayment, mode: input.paymentMode, recordedAt: new Date().toISOString()
    });
    const invoice: MockInvoice = {
      id: existing?.id ?? input.id, orderId: input.orderId, total: input.total, amountReceived: amount,
      balanceDue: Math.max(0, input.total - amount), paymentMode: input.paymentMode, payments,
      status: amount <= 0 ? 'unpaid' : amount >= input.total ? 'paid' : 'partial', createdAt: existing?.createdAt ?? new Date().toISOString()
    };
    this.persist({
      ...current, invoices: [invoice, ...current.invoices.filter(i => i.orderId !== input.orderId)],
      visits: current.visits.map(v => v.id === current.orders.find(o => o.id === input.orderId)?.visitId ? { ...v, status: 'billed' } : v)
    });
    return invoice;
  }

  addPayment(invoiceId: string, amount: number, mode: 'cash'|'upi'|'card'|'credit'): MockInvoice {
    const current = this.state();
    const invoice = current.invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found.');
    if (!Number.isFinite(amount) || amount <= 0 || amount > invoice.balanceDue) throw new Error('Payment amount must be greater than zero and cannot exceed the balance due.');
    const received = invoice.amountReceived + amount;
    const updated: MockInvoice = {
      ...invoice, amountReceived: received, balanceDue: invoice.total - received, paymentMode: mode,
      payments: [...invoice.payments, { id: this.id('PAY'), amount, mode, recordedAt: new Date().toISOString() }],
      status: received >= invoice.total ? 'paid' : 'partial'
    };
    this.persist({ ...current, invoices: current.invoices.map(i => i.id === invoiceId ? updated : i) });
    return updated;
  }

  /** Remove an unpaid demo invoice. Orders, visits and lab records are deliberately retained. */
  deleteUnpaidInvoice(invoiceId: string): void {
    const current = this.state();
    const invoice = current.invoices.find(item => item.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found.');
    if (invoice.amountReceived > 0 || invoice.payments.length > 0) {
      throw new Error('This invoice has recorded payments and cannot be deleted. Preserve its payment history.');
    }
    this.persist({ ...current, invoices: current.invoices.filter(item => item.id !== invoiceId) });
  }

  createSample(input: Omit<MockLabSample,'id'|'status'> & { id?: string }): MockLabSample {
    const current = this.state();
    if (current.samples.some(s => s.orderId === input.orderId)) {
      return current.samples.find(s => s.orderId === input.orderId)!;
    }
    const sample: MockLabSample = { ...input, id: input.id ?? this.id('SMP'), status: 'collected' };
    this.persist({
      ...current, samples: [sample, ...current.samples],
      visits: current.visits.map(v => v.id === sample.visitId ? { ...v, status: 'in-lab' } : v)
    });
    return sample;
  }

  updateSampleStatus(sampleId: string, status: MockSampleStatus): MockLabSample {
    const current = this.state();
    const sample = current.samples.find(s => s.id === sampleId);
    if (!sample) throw new Error('Sample not found.');
    const allowed: Record<MockSampleStatus, MockSampleStatus[]> = {
      collected: ['received','rejected'], received: ['processing','rejected'],
      processing: ['results-entered','rejected'], 'results-entered': ['awaiting-validation','processing'],
      'awaiting-validation': ['validated','rejected'], validated: [], rejected: ['collected']
    };
    if (sample.status !== status && !allowed[sample.status].includes(status)) {
      throw new Error(`Invalid sample transition: ${sample.status} → ${status}.`);
    }
    const updated = { ...sample, status };
    this.persist({ ...current, samples: current.samples.map(s => s.id === sampleId ? updated : s) });
    return updated;
  }

  saveResults(sampleId: string, values: Record<string,string>, parameterLabels: Record<string,string> = {}, parameterDetails: MockResultRecord['parameterDetails'] = {}): MockResultRecord {
    const current = this.state();
    if (!current.samples.some(s => s.id === sampleId)) throw new Error('Sample not found.');
    const existing = current.results.find(r => r.sampleId === sampleId);
    const result: MockResultRecord = {
      id: existing?.id ?? this.id('RES'), sampleId, status: 'draft',
      values: { ...values }, parameterLabels: { ...parameterLabels }, parameterDetails: { ...parameterDetails }, updatedAt: new Date().toISOString()
    };
    this.persist({
      ...current,
      results: [result, ...current.results.filter(r => r.sampleId !== sampleId)],
      samples: current.samples.map(sample => sample.id === sampleId && sample.status !== 'validated'
        ? { ...sample, status: 'results-entered' } : sample)
    });
    return result;
  }

  submitResults(sampleId: string): MockResultRecord {
    const current = this.state();
    const result = current.results.find(r => r.sampleId === sampleId);
    if (!result) throw new Error('Save result values before submitting for validation.');
    if (Object.values(result.values).some(value => !String(value).trim())) throw new Error('All required result values must be entered.');
    const updated = { ...result, status: 'awaiting-validation' as const, updatedAt: new Date().toISOString() };
    const sample = current.samples.find(s => s.id === sampleId);
    this.persist({
      ...current, results: [updated, ...current.results.filter(r => r.sampleId !== sampleId)],
      samples: current.samples.map(s => s.id === sampleId ? { ...s, status: 'awaiting-validation' } : s)
    });
    return updated;
  }

  reviewResults(sampleId: string, reviewer: string, approved: boolean, note = ''): MockResultRecord {
    const current = this.state();
    const result = current.results.find(r => r.sampleId === sampleId);
    if (!result || result.status !== 'awaiting-validation') throw new Error('Only submitted results can be reviewed.');
    const updated: MockResultRecord = {
      ...result, status: approved ? 'validated' : 'rejected', reviewer,
      reviewedAt: new Date().toISOString(), reviewNote: note
    };
    this.persist({
      ...current, results: [updated, ...current.results.filter(r => r.sampleId !== sampleId)],
      samples: current.samples.map(s => s.id === sampleId ? { ...s, status: approved ? 'validated' : 'rejected' } : s)
    });
    return updated;
  }

  generateReport(sampleId: string): MockReport {
    const current = this.state();
    const result = current.results.find(r => r.sampleId === sampleId);
    if (!result || result.status !== 'validated') throw new Error('A report can only be generated from validated results.');
    const existing = current.reports.find(r => r.sampleId === sampleId);
    if (existing) return existing;
    const report: MockReport = { id: this.id('RPT'), sampleId, resultId: result.id, status: 'generated', generatedAt: new Date().toISOString() };
    this.persist({ ...current, reports: [report, ...current.reports] });
    return report;
  }

  dispatchReport(reportId: string, mode: string): MockReport {
    const current = this.state();
    const report = current.reports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found.');
    const updated: MockReport = { ...report, status: 'dispatched', dispatchMode: mode, dispatchedAt: new Date().toISOString() };
    this.persist({ ...current, reports: current.reports.map(r => r.id === reportId ? updated : r) });
    return updated;
  }

  clearDemoData(): void {
    this.persist({ visits: [], orders: [], invoices: [], samples: [], results: [], reports: [] });
  }
}
