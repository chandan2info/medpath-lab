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
    { label: 'Billing',    icon: 'ti-receipt' },
    { label: 'Sample',     icon: 'ti-droplet' },
  ];
  protected readonly workflowActiveIndex = 2;

  readonly today  = new Date();
  discountPct     = signal(0);
  couponCode      = signal('');
  referralCode    = signal('');
  advance         = signal(0);
  saving          = signal(false);
  showReceipt     = signal(false);
  invoiceId       = this.flow.generateInvoiceId();

  subtotal    = this.flow.orderTotal;
  discAmt     = computed(() => Math.round(this.subtotal() * this.discountPct() / 100));
  grandTotal  = computed(() => this.subtotal() - this.discAmt());
  outstanding = computed(() => Math.max(0, this.grandTotal() - this.advance()));
  payMode     = this.flow.payMode;

  get patient() { return this.flow.patient(); }

  ngOnInit(): void {
    if (!this.flow.patient()) {
      this.router.navigate(['/dashboard/registration']);
    } else if (this.flow.selectedTests().length === 0) {
      this.router.navigate(['/dashboard/test-order']);
    }
  }

  setPayMode(m: PaymentMode): void { this.flow.setPayMode(m); }
  applyDiscount(pct: number): void { this.discountPct.set(Math.min(100, Math.max(0, pct))); }

  /**
   * Blocks any non-numeric keystroke at the source, so the Discount % and
   * Advance received fields — now `type="text"` (see task: numeric-only
   * validation done in TS rather than relying on `type="number"`'s native,
   * inconsistent-across-browsers spinner/validation behaviour) — never let
   * a non-digit character land in the input in the first place.
   * Navigation, editing and copy/paste shortcut keys are always allowed.
   */
  allowNumericKeysOnly(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
    ];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return; // allow Ctrl/Cmd+A/C/V/X etc.
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Strips any non-digit characters that slip through (e.g. via paste) and
   * returns a clamped numeric value, keeping the underlying signal a clean
   * number even though the field itself is `type="text"`.
   */
  sanitizeNumericInput(event: Event): number {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/[^0-9]/g, '');
    input.value = digitsOnly;
    return digitsOnly === '' ? 0 : Number(digitsOnly);
  }

  confirmPayment(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.flow.setDiscount(this.discountPct());
      this.saving.set(false);
      this.showReceipt.set(true);
    }, 500);
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
