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

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, DatePipe, TitleCasePipe],
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
    return this.flow.calcAge(p.dob) + ' yrs';
  }
}
