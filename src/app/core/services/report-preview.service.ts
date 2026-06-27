// ─────────────────────────────────────────────────────────────
//  MedPath LIS — Report Preview Service
//  Staging buffer between ResultEntry and ReportPreview.
//  Holds the in-progress result set so the preview screen
//  reflects the user's current selections without re-fetching.
//  Cleared after finalisation or cancellation.
// ─────────────────────────────────────────────────────────────
import { Injectable, signal } from '@angular/core';
import { ResultParameter } from '../../shared/models/lis.models';

export interface ReportPreviewData {
  // Patient & sample identifiers
  patientName:  string;
  patientId:    string;
  ageGender:    string;
  referredBy:   string;
  sampleId:     string;
  sampleType:   string;
  collectedAt:  string;
  reportedAt:   string;
  priority:     'STAT' | 'Routine';

  // Test section
  testName:     string;
  testCode:     string;
  department:   string;
  criticalNote: string | null;

  // Results
  params: ResultParameter[];

  // Lab identity
  labName:      string;
  labAddress:   string;
  labPhone:     string;
  labAccreditation: string;
  authorisedBy: string;
  authorisedRole: string;
  authorisedReg: string;

  // Report metadata
  reportDate:   string;
  verifyUrl:    string;
  invoiceId:    string;

  // Display settings (carried from ReportSettings panel)
  showRefRange:     boolean;
  showFlags:        boolean;
  showNotes:        boolean;
  showQrCode:       boolean;
  showAccreditation: boolean;
  paperSize:        'A4' | 'Letter';
  orientation:      'portrait' | 'landscape';
  template:         'Standard Template' | 'Compact Template' | 'Detailed Template';
}

/** Default preview data — mirrors the KFT / Arun Pillai scenario used in mockups */
const DEFAULT_DATA: ReportPreviewData = {
  patientName:  'Arun Pillai',
  patientId:    'PAT-2406-0316',
  ageGender:    '61 years / Male',
  referredBy:   'Dr. Suresh Menon',
  sampleId:     'SMP-2406-087',
  sampleType:   'Urine R/M',
  collectedAt:  '27 Jun 2026, 09:20 PM',
  reportedAt:   '27 Jun 2026, 11:05 PM',
  priority:     'STAT',

  testName:     'Kidney Function Test (KFT)',
  testCode:     'KFT',
  department:   'Biochemistry',
  criticalNote: 'Critical value — Serum Potassium (K⁺) is significantly elevated. Referring physician has been notified. Fasting: Non-fasting. Specimen: Serum (Red top SST).',

  params: [
    { id:'cr',   name:'Serum creatinine',     value:'2.4',  unit:'mg/dL',  refLow:0.7, refHigh:1.3,  refLabel:'0.7 – 1.3',  flag:'high'     },
    { id:'bun',  name:'Blood urea nitrogen',  value:'48',   unit:'mg/dL',  refLow:7,   refHigh:20,   refLabel:'7 – 20',     flag:'high'     },
    { id:'k',    name:'Serum potassium (K⁺)', value:'6.8',  unit:'mEq/L',  refLow:3.5, refHigh:5.0,  refLabel:'3.5 – 5.0',  flag:'critical' },
    { id:'na',   name:'Serum sodium (Na⁺)',   value:'138',  unit:'mEq/L',  refLow:136, refHigh:145,  refLabel:'136 – 145',  flag:'normal'   },
    { id:'ua',   name:'Serum uric acid',      value:'5.2',  unit:'mg/dL',  refLow:3.5, refHigh:7.2,  refLabel:'3.5 – 7.2',  flag:'normal'   },
    { id:'egfr', name:'eGFR (CKD-EPI)',       value:'32',   unit:'mL/min', refLow:60,  refHigh:null, refLabel:'≥ 60',       flag:'low'      },
  ],

  labName:          'MedPath Diagnostics',
  labAddress:       '123, Health Street, Medical Area, Bengaluru — 560001',
  labPhone:         '+91 98765 43210',
  labAccreditation: 'NABL Accredited',
  authorisedBy:     'Dr. Priya Hegde',
  authorisedRole:   'MD Pathology, MedPath Diagnostics',
  authorisedReg:    'Reg. No. MCI-2019-048721',

  reportDate:  '27 Jun 2026',
  verifyUrl:   'rpt.medpath.in/SMP-2406-087',
  invoiceId:   'INV-2406-0669',

  showRefRange:      true,
  showFlags:         true,
  showNotes:         true,
  showQrCode:        true,
  showAccreditation: true,
  paperSize:         'A4',
  orientation:       'portrait',
  template:          'Standard Template',
};

@Injectable({ providedIn: 'root' })
export class ReportPreviewService {
  private _data = signal<ReportPreviewData>(DEFAULT_DATA);

  /** Read-only snapshot for the preview component */
  readonly data = this._data.asReadonly();

  /** Stage new preview data (called from ResultEntryComponent before navigating) */
  stage(data: Partial<ReportPreviewData>): void {
    this._data.update(current => ({ ...current, ...data }));
  }

  /** Update a single display-settings field without replacing everything */
  updateSetting<K extends keyof ReportPreviewData>(key: K, value: ReportPreviewData[K]): void {
    this._data.update(current => ({ ...current, [key]: value }));
  }

  /** Reset to defaults after finalisation or cancel */
  clear(): void {
    this._data.set({ ...DEFAULT_DATA });
  }
}