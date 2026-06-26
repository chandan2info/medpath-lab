// ─────────────────────────────────────────────
//  Billing Feature — Local Models
//  Domain-wide models live in shared/models/lis.models.ts
// ─────────────────────────────────────────────

export interface BillingStep {
  n: number;
  label: string;
}

export interface PaymentOption {
  id: 'cash' | 'upi' | 'card' | 'credit';
  icon: string;
  label: string;
}
