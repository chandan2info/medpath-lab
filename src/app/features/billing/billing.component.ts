// ─────────────────────────────────────────────
//  Screen 3 — Billing
//  Single purpose: collect payment for ordered
//  tests. Tests already decided on Screen 2.
// ─────────────────────────────────────────────
import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';
import { PaymentMode } from '../../shared/models/lis.models';
import { WorkflowStepperComponent, WorkflowStep } from '../../shared/components/workflow-stepper/workflow-stepper.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, DatePipe, TitleCasePipe, WorkflowStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css',
})
export class BillingComponent implements OnInit {
  protected readonly flow   = inject(PatientFlowService);
  private   readonly router = inject(Router);
  private readonly workflowStore = inject(LabWorkflowMockService);

  protected readonly payModes: { id: PaymentMode; icon: string; label: string }[] = [
    { id: 'cash',   icon: 'cash',        label: 'Cash'   },
    { id: 'upi',    icon: 'qrcode',      label: 'UPI'    },
    { id: 'card',   icon: 'credit-card', label: 'Card'   },
    { id: 'credit', icon: 'clock',       label: 'Credit' },
  ];

  /** Shared 4-step workflow stepper (Register → Test Order → Billing → Sample). */
  protected readonly workflowSteps: WorkflowStep[] = [
    { label: 'Register',   icon: 'ti-user-plus' },
    { label: 'Test Order', icon: 'ti-test-pipe' },
    { label: 'Review Order', icon: 'ti-clipboard-check' },
    { label: 'Billing',    icon: 'ti-receipt' },
    { label: 'Sample',     icon: 'ti-droplet' },
  ];
  protected readonly workflowActiveIndex = 3;

  readonly today  = new Date();
  discountPct     = signal(0);
  discountType    = signal<'percentage' | 'fixed'>('percentage');
  discountReason  = signal('');
  couponCode      = signal('');
  referralCode    = signal('');
  advance         = signal(0);
  saving          = signal(false);
  showReceipt     = signal(false);
  invoiceId       = this.flow.generateInvoiceId();

  subtotal    = this.flow.orderTotal;
  discAmt     = computed(() => this.discountType() === 'percentage'
    ? Math.min(this.subtotal(), Math.round(this.subtotal() * this.discountPct() / 100))
    : Math.min(this.subtotal(), Math.round(this.discountPct() * 100) / 100));
  grandTotal  = computed(() => this.subtotal() - this.discAmt());
  outstanding = computed(() => Math.max(0, this.grandTotal() - this.advance()));
  paidPercentage = computed(() => this.grandTotal() > 0
    ? Math.min(100, Math.round((this.advance() / this.grandTotal()) * 100)) : 0);
  payMode     = this.flow.payMode;

  get patient() { return this.flow.patient(); }

  ngOnInit(): void {
    if (!this.flow.patient()) {
      this.router.navigate(['/dashboard/registration']);
    } else if (this.flow.selectedTests().length === 0) {
      this.router.navigate(['/dashboard/test-order']);
    } else {
      const orderId = this.flow.ensureWorkflowOrder();
      const existingInvoice = this.workflowStore.invoices().find(invoice => invoice.orderId === orderId);
      if (existingInvoice) {
        this.invoiceId = existingInvoice.id;
        this.advance.set(existingInvoice.amountReceived);
      }
    }
  }

  setPayMode(m: PaymentMode): void { this.flow.setPayMode(m); }

  onPayModeKeydown(event: KeyboardEvent, current: PaymentMode): void {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = this.payModes.findIndex(mode => mode.id === current);
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const next = this.payModes[(index + direction + this.payModes.length) % this.payModes.length];
    this.setPayMode(next.id);
    queueMicrotask(() => document.querySelector<HTMLButtonElement>(`.pay-mode-btn[aria-checked="true"]`)?.focus());
  }
  applyDiscount(value: number): void {
    const maximum = this.discountType() === 'percentage' ? 100 : this.subtotal();
    this.discountPct.set(Math.min(maximum, Math.max(0, value)));
  }

  setDiscountType(event: Event): void {
    const type = (event.target as HTMLSelectElement).value as 'percentage' | 'fixed';
    this.discountType.set(type);
    this.discountPct.set(0);
  }

  setDiscountReason(event: Event): void {
    this.discountReason.set((event.target as HTMLSelectElement).value);
  }

  /** Allow digits, one decimal separator and normal editing/shortcut keys. */
  allowDecimalKeysOnly(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
    ];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;
    const input = event.target as HTMLInputElement;
    if (/^[0-9]$/.test(event.key)) return;
    if (event.key === '.' && !input.value.includes('.')) return;
    event.preventDefault();
  }

  /** Sanitize typed/pasted numeric values and preserve up to two decimal places. */
  sanitizeDecimalInput(event: Event): number {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.]/g, '');
    const dot = value.indexOf('.');
    if (dot >= 0) value = value.slice(0, dot + 1) + value.slice(dot + 1).replace(/\./g, '');
    const [whole, fraction] = value.split('.');
    value = fraction === undefined ? whole : whole + '.' + fraction.slice(0, 2);
    input.value = value;
    return value === '' || value === '.' ? 0 : Number(value);
  }

  confirmPayment(): void {
    if (this.discountPct() > 0 && !this.discountReason()) return;
    this.saving.set(true);
    try {
      this.flow.setDiscount(this.subtotal() > 0 ? (this.discAmt() / this.subtotal()) * 100 : 0);
      const orderId = this.flow.ensureWorkflowOrder();
      this.workflowStore.recordInvoice({
        id: this.invoiceId,
        orderId,
        total: this.grandTotal(),
        amountReceived: this.advance(),
        paymentMode: this.payMode()
      });
      this.saving.set(false);
      this.showReceipt.set(true);
    } catch (error) {
      this.saving.set(false);
      window.alert(error instanceof Error ? error.message : 'Unable to save invoice.');
    }
  }

  proceedToSample(): void {
    this.router.navigate(['/dashboard/collection']);
  }

  get patientInitials(): string {
    const p = this.patient;
    if (!p) return '?';
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
  }

  get patientAge(): string {
    const p = this.patient;
    if (!p) return '';
    return this.flow.calcAge(p.dob);
  }

  /** Detailed breakdown used in the patient info row, e.g. "9y 11m 2d". */
  patientAgeBreakdown(): string {
    const p = this.patient;
    if (!p) return '';
    return this.flow.formatAgeBreakdown(p.dob);
  }

  /** Raw Y/M/D parts for the colorized inline age breakdown (see .age-inline* in styles.css). */
  ageParts(): { years: number; months: number; days: number } {
    const p = this.patient;
    if (!p) return { years: 0, months: 0, days: 0 };
    return this.flow.calcAgeParts(p.dob);
  }

  genderIcon(): string {
    const g = (this.patient?.gender ?? '').toLowerCase();
    if (g === 'male')   return 'ti-gender-male';
    if (g === 'female') return 'ti-gender-female';
    return 'ti-gender-genderless';
  }

  visitTypeIcon(): string {
    const v = (this.patient?.visitType ?? '').toLowerCase();
    if (v.includes('appointment')) return 'ti-calendar-event';
    if (v.includes('home'))        return 'ti-home';
    return 'ti-walk';
  }

  /** Derived payment status for the invoice summary badge. */
  readonly paymentStatus = computed<'pending' | 'partial' | 'paid'>(() => {
    if (this.advance() <= 0) return 'pending';
    return this.outstanding() <= 0 ? 'paid' : 'partial';
  });

  incrementDiscount(step: number): void {
    this.applyDiscount(this.discountPct() + step);
  }

  applyCoupon(): void {
    // Placeholder hook — coupon validation happens server-side.
    // Kept as a no-op action target so the Apply button has a handler.
  }
}
