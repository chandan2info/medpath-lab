import { Injectable, computed, inject } from '@angular/core';
import { LabWorkflowMockService, MockInvoice } from '../../../core/services/lab-workflow-mock.service';
import { PaymentMode } from '../../../shared/models/lis.models';

/**
 * Billing owns invoice and payment mutations.
 * The mock workflow repository remains the persistence adapter until an API adapter is added.
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly workflowStore = inject(LabWorkflowMockService);

  readonly invoices = computed(() => this.workflowStore.invoices());

  getByOrderId(orderId: string): MockInvoice | undefined {
    return this.invoices().find(invoice => invoice.orderId === orderId);
  }

  recordInvoice(input: {
    id: string;
    orderId: string;
    total: number;
    amountReceived: number;
    paymentMode: PaymentMode;
  }): MockInvoice {
    return this.workflowStore.recordInvoice(input);
  }

  addPayment(invoiceId: string, amount: number, mode: PaymentMode): MockInvoice {
    return this.workflowStore.addPayment(invoiceId, amount, mode);
  }

  deleteUnpaidInvoice(invoiceId: string): void {
    this.workflowStore.deleteUnpaidInvoice(invoiceId);
  }
}
