// ─────────────────────────────────────────────
//  MedPath LIS — Shared Domain Models
// ─────────────────────────────────────────────

export type SampleStatus = 'pending' | 'processing' | 'ready' | 'critical' | 'dispatched';
export type Priority     = 'routine' | 'urgent' | 'stat';
export type Gender       = 'male' | 'female' | 'other';
export type PaymentMode  = 'cash' | 'upi' | 'card' | 'credit';
export type VisitType    = 'walk-in' | 'appointment' | 'home-visit';
export type FastingStatus = 'fasting' | 'non-fasting' | 'unknown';
export type ResultFlag   = 'normal' | 'high' | 'low' | 'critical';

export interface Patient {
  id: string;           // PAT-2406-XXXX
  firstName: string;
  lastName: string;
  dob: string;          // ISO date string
  ageYears: number;
  gender: Gender;
  bloodGroup: string;
  mobile: string;
  email?: string;
  address: string;
  visitCount: number;
  lastVisit?: string;
}

export interface LabTest {
  id: string;
  name: string;
  category: string;
  price: number;
  tatHours: number;     // turn-around time
}

export interface TestOrder {
  test: LabTest;
  priority: Priority;
}

export interface Sample {
  id: string;           // SMP-YYMM-XXX
  patientId: string;
  patientName: string;
  tests: string[];      // test names
  priority: Priority;
  status: SampleStatus;
  collectedAt: string;
  etaLabel: string;
  tubes: Tube[];
}

export interface Tube {
  id: string;
  color: string;        // hex
  label: string;        // e.g. 'Red top (SST)'
  tests: string[];
}

export interface ResultParameter {
  id: string;
  name: string;
  value: string;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  refLabel: string;
  flag: ResultFlag;
}

export interface ResultGroup {
  title: string;
  parameters: ResultParameter[];
}

export interface Invoice {
  id: string;           // INV-YYMM-XXXX
  patientId: string;
  patientName: string;
  date: string;
  tests: LabTest[];
  discountPct: number;
  paymentMode: PaymentMode;
  paid: boolean;
}

export interface Visit {
  id: string;
  date: string;
  tests: string[];
  refDoctor: string;
  amount: number;
  invoiceId: string;
  keyFindings?: string;
  hasCritical: boolean;
}

export interface NavBadges {
  billing: number;
  reports: number;
  tracking: number;
}

export interface KpiCard {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  deltaUp?: boolean;
  icon: string;
  barPct?: number;
  barColor?: 'teal' | 'amber' | 'red';
}
