import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LabWorkflowMockService, MockInvoice } from '../../core/services/lab-workflow-mock.service';
import { PatientFlowService } from '../../core/services/patient-flow.service';

type BillingView = 'overview' | 'collection' | 'outstanding' | 'invoices';
type PaymentMode = 'cash' | 'upi' | 'card' | 'credit';
interface BillingRow {
  invoice: MockInvoice;
  patientName: string;
  patientId: string;
  orderId: string;
  visitId: string;
  tests: string[];
  reportCount: number;
  readyReportCount: number;
  reportIds: string[];
  createdAt: string;
}

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing-dashboard.component.html',
  styleUrl: './billing-dashboard.component.css'
})
export class BillingDashboardComponent {
  private readonly store = inject(LabWorkflowMockService);
  private readonly flow = inject(PatientFlowService);
  readonly activeView = signal<BillingView>('overview');
  readonly query = signal('');
  readonly selectedRow = signal<BillingRow | null>(null);
  readonly pendingDelete = signal<BillingRow | null>(null);
  readonly paymentAmount = signal(0);
  readonly paymentMode = signal<PaymentMode>('cash');
  readonly feedback = signal('');
  readonly savingPayment = signal(false);

  readonly rows = computed<BillingRow[]>(() => {
    const orders = this.store.orders();
    const visits = this.store.visits();
    const samples = this.store.samples();
    const reports = this.store.reports();
    return this.store.invoices().map(invoice => {
      const order = orders.find(item => item.id === invoice.orderId);
      const sample = samples.find(item => item.orderId === invoice.orderId);
      const visit = order ? visits.find(item => item.id === order.visitId) : undefined;
      const sampleReports = sample ? reports.filter(item => item.sampleId === sample.id) : [];
      const tests = (order?.testIds ?? sample?.testIds ?? []).map(id =>
        this.flow.allTests.find(test => test.id === id)?.name ?? id
      );
      return {
        invoice,
        patientName: sample?.patientName ?? visit?.patientName ?? order?.patientId ?? 'Patient details unavailable',
        patientId: sample?.patientId ?? visit?.patientId ?? order?.patientId ?? '—',
        orderId: invoice.orderId,
        visitId: visit?.id ?? sample?.visitId ?? '—',
        tests,
        reportCount: sampleReports.length,
        readyReportCount: sampleReports.filter(report => report.status === 'generated').length,
        reportIds: sampleReports.filter(report => report.status === 'generated').map(report => report.id),
        createdAt: invoice.createdAt
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  readonly filteredRows = computed(() => {
    const view = this.activeView();
    const term = this.query().trim().toLowerCase();
    return this.rows().filter(row => {
      const matches = !term || [row.patientName, row.patientId, row.invoice.id, ...row.tests]
        .some(value => value.toLowerCase().includes(term));
      if (!matches) return false;
      if (view === 'collection') return row.readyReportCount > 0;
      if (view === 'outstanding') return row.invoice.balanceDue > 0;
      return true;
    });
  });

  readonly invoiceCount = computed(() => this.rows().length);
  readonly collectedAmount = computed(() => this.rows().reduce((sum, row) => sum + row.invoice.amountReceived, 0));
  readonly outstandingAmount = computed(() => this.rows().reduce((sum, row) => sum + row.invoice.balanceDue, 0));
  readonly readyCount = computed(() => this.rows().filter(row => row.readyReportCount > 0).length);
  readonly pendingPaymentCount = computed(() => this.rows().filter(row => row.invoice.balanceDue > 0).length);

  setView(view: BillingView): void { this.activeView.set(view); this.query.set(''); this.feedback.set(''); }

  openPayment(row: BillingRow): void {
    if (row.invoice.balanceDue <= 0) return;
    this.selectedRow.set(row);
    this.paymentAmount.set(row.invoice.balanceDue);
    this.paymentMode.set('cash');
  }

  closePayment(): void { if (!this.savingPayment()) this.selectedRow.set(null); }

  confirmPayment(): void {
    const row = this.selectedRow();
    const amount = Number(this.paymentAmount());
    if (!row || this.savingPayment()) return;
    if (!Number.isFinite(amount) || amount <= 0 || amount > row.invoice.balanceDue) {
      this.feedback.set('Enter an amount greater than zero and no more than the outstanding balance.');
      return;
    }
    this.savingPayment.set(true);
    try {
      this.store.addPayment(row.invoice.id, amount, this.paymentMode());
      this.selectedRow.set(null);
      this.feedback.set('Payment recorded successfully.');
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Unable to record payment.');
    } finally { this.savingPayment.set(false); }
  }

  requestDelete(row: BillingRow): void {
    if (row.invoice.amountReceived > 0 || row.invoice.payments.length > 0) {
      this.feedback.set('Invoices with recorded payments cannot be deleted. Their payment history must be retained.');
      return;
    }
    this.pendingDelete.set(row);
  }

  cancelDelete(): void { this.pendingDelete.set(null); }

  confirmDelete(): void {
    const row = this.pendingDelete();
    if (!row) return;
    try {
      this.store.deleteUnpaidInvoice(row.invoice.id);
      this.pendingDelete.set(null);
      this.feedback.set('Invoice ' + row.invoice.id + ' was deleted. The patient order and lab records were kept.');
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Unable to delete invoice.');
    }
  }

  markReportDelivered(row: BillingRow): void {
    if (!row.reportIds.length) return;
    try {
      for (const id of row.reportIds) this.store.dispatchReport(id, 'counter');
      this.feedback.set('Report handover recorded for ' + row.patientName + '.');
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Unable to record report handover.');
    }
  }

  statusLabel(row: BillingRow): string {
    if (row.invoice.status === 'paid') return 'Paid';
    return row.invoice.status === 'partial' ? 'Partially paid' : 'Unpaid';
  }
}