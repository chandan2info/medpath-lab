import { Injectable, computed, inject } from '@angular/core';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';
import { PatientFlowService } from '../../core/services/patient-flow.service';

export interface HistoryVisitRecord {
  date: string; time: string; dateValue: string; invoiceId: string; tests: string[];
  refDoctor: string; amount: number; keyFinding: string; hasCritical: boolean;
  resultStatus: 'Completed' | 'Pending'; paymentStatus: 'Paid' | 'Unpaid';
  reports: { name: string; status: 'Available' | 'Pending'; reportId?: string }[];
  results: { parameter: string; value: number; unit: string; reference: string; date: string }[];
  orderId: string; sampleId: string | null; reportId: string | null; invoiceRecordId: string | null;
}
export interface HistoryPatientRecord {
  id: string; name: string; age: number; sex: string; mobile: string;
  initials: string; avatarClass: string; visits: HistoryVisitRecord[];
}

@Injectable({ providedIn: 'root' })
export class PatientHistoryService {
  private readonly store = inject(LabWorkflowMockService);
  private readonly flow = inject(PatientFlowService);

  readonly patients = computed<HistoryPatientRecord[]>(() => {
    const visits = this.store.visits();
    const orders = this.store.orders();
    const invoices = this.store.invoices();
    const samples = this.store.samples();
    const results = this.store.results();
    const reports = this.store.reports();
    const grouped = new Map<string, HistoryPatientRecord>();

    for (const visit of visits) {
      const visitOrders = orders.filter(order => order.visitId === visit.id);
      if (!visitOrders.length) continue;
      const age = Number(visit.ageYears ?? 0) || 0;
      const sex = visit.gender || 'Not recorded';
      const name = visit.patientName || 'Patient';
      const initials = name.split(/\\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase();
      const patient = grouped.get(visit.patientId) ?? {
        id: visit.patientId, name, age, sex, mobile: visit.mobile ? '+91 ' + visit.mobile : 'Mobile not recorded',
        initials: initials || 'P', avatarClass: 'av-t', visits: []
      };
      for (const order of visitOrders) {
        const sample = samples.find(item => item.orderId === order.id);
        const result = sample ? results.find(item => item.sampleId === sample.id) : undefined;
        const report = sample ? reports.find(item => item.sampleId === sample.id) : undefined;
        const invoice = invoices.find(item => item.orderId === order.id);
        const date = new Date(order.createdAt);
        const tests = order.testIds.map(id => this.flow.allTests.find(test => test.id === id)?.name ?? id);
        const shortTests = order.testIds.map(id => this.flow.allTests.find(test => test.id === id)?.id ?? id);
        const resultRows = Object.entries(result?.values ?? {}).map(([parameter, raw]) => ({
          parameter, value: Number(raw), unit: '', reference: 'Not recorded', date: date.toLocaleDateString('en-IN')
        })).filter(row => Number.isFinite(row.value));
        patient.visits.push({
          date: date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
          time: date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
          dateValue: order.createdAt.slice(0,10), invoiceId: order.id, orderId: order.id,
          tests: shortTests, refDoctor: visit.refDoctor || 'Not recorded', amount: order.total,
          keyFinding: report ? 'Validated report available' : result?.status === 'awaiting-validation' ? 'Awaiting result validation' : result?.status === 'rejected' ? 'Results rejected — review required' : sample ? 'Sample in processing workflow' : 'Order created — sample not yet collected',
          hasCritical: false, resultStatus: report ? 'Completed' : 'Pending',
          paymentStatus: invoice?.status === 'paid' ? 'Paid' : 'Unpaid',
          reports: shortTests.map(test => ({ name: test, status: report ? 'Available' : 'Pending', reportId: report?.id })),
          results: resultRows, sampleId: sample?.id ?? null, reportId: report?.id ?? null, invoiceRecordId: invoice?.id ?? null
        });
      }
      patient.visits.sort((a,b) => b.dateValue.localeCompare(a.dateValue));
      grouped.set(visit.patientId, patient);
    }
    return [...grouped.values()].sort((a,b) => (b.visits[0]?.dateValue ?? '').localeCompare(a.visits[0]?.dateValue ?? ''));
  });
}
