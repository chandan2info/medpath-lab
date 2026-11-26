import { Injectable, computed, inject, signal } from '@angular/core';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';
import { PatientFlowService } from '../../core/services/patient-flow.service';

export type ReportStatus = 'pending' | 'generated' | 'dispatched';
export type ResultFlag = 'high' | 'low' | 'critical' | 'normal' | 'unavailable';

export interface ResultRow {
  name: string;
  result: string;
  unit: string;
  ref: string;
  flag: ResultFlag;
}

export interface ReportRow {
  id: string;
  patientName: string;
  patientId: string;
  test: string;
  date: string;
  status: ReportStatus;
}

export interface ReportDetail {
  patientAgeSex: string;
  collectedOn: string;
  referredBy: string;
  reportedOn: string;
  testTitle: string;
  sampleId: string;
  note: string;
  specimen: string;
  fasting: string;
  groupTitle: string;
  rows: ResultRow[];
  authorisedBy: string;
  qualification: string;
}

const REPORTS: ReportRow[] = [
  { id: 'RPT-2406-041', patientName: 'Arun Pillai',  patientId: 'PAT-2406-0316', test: 'KFT',            date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-040', patientName: 'Priya Sharma', patientId: 'PAT-2406-0315', test: 'Thyroid panel',  date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-039', patientName: 'Deepak Rao',   patientId: 'PAT-2406-0321', test: 'Blood glucose', date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-038', patientName: 'Anjali Verma', patientId: 'PAT-2406-0312', test: 'CBC + ESR',      date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-037', patientName: 'Rajan Iyer',   patientId: 'PAT-2406-0309', test: 'HbA1c',         date: '23 Jun 2026', status: 'pending' },
  { id: 'RPT-2406-033', patientName: 'Meena Joshi',  patientId: 'PAT-2406-0302', test: 'LFT',           date: '22 Jun 2026', status: 'dispatched' },
  { id: 'RPT-2406-030', patientName: 'Suresh Menon', patientId: 'PAT-2406-0317', test: 'Lipid profile',date: '22 Jun 2026', status: 'dispatched' },
];

// Explicitly illustrative demo values. Each list row has a matching preview record.
const REPORT_DETAILS: Record<string, ReportDetail> = {
  'RPT-2406-041': {
    patientAgeSex: '61 years / Male', collectedOn: '23 Jun 2026 · 9:20 AM',
    referredBy: 'Dr. Suresh Menon', reportedOn: '23 Jun 2026 · 11:05 AM',
    testTitle: 'Kidney Function Test (KFT)', sampleId: 'SMP-2406-087',
    note: 'Critical value — Serum Potassium (K⁺) is significantly elevated. Referring physician has been notified.',
    specimen: 'Serum (Red top SST)', fasting: 'Non-fasting', groupTitle: 'Biochemistry — Renal profile',
    rows: [
      { name: 'Serum creatinine', result: '2.4', unit: 'mg/dL', ref: '0.7 – 1.3', flag: 'high' },
      { name: 'Blood urea nitrogen', result: '48', unit: 'mg/dL', ref: '7 – 20', flag: 'high' },
      { name: 'Serum potassium (K⁺)', result: '6.8', unit: 'mEq/L', ref: '3.5 – 5.0', flag: 'critical' },
      { name: 'Serum sodium (Na⁺)', result: '138', unit: 'mEq/L', ref: '136 – 145', flag: 'normal' },
      { name: 'Serum uric acid', result: '5.2', unit: 'mg/dL', ref: '3.5 – 7.2', flag: 'normal' },
      { name: 'eGFR (CKD-EPI)', result: '32', unit: 'mL/min', ref: '≥ 60', flag: 'low' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-040': {
    patientAgeSex: '34 years / Female', collectedOn: '23 Jun 2026 · 8:45 AM',
    referredBy: 'Dr. Kavita Rao', reportedOn: '23 Jun 2026 · 10:30 AM',
    testTitle: 'Thyroid Profile', sampleId: 'SMP-2406-086',
    note: 'Thyroid profile results are within the supplied reference ranges.',
    specimen: 'Serum', fasting: 'Not required', groupTitle: 'Immunoassay — Thyroid profile',
    rows: [
      { name: 'T3', result: '1.2', unit: 'ng/mL', ref: '0.8 – 2.0', flag: 'normal' },
      { name: 'T4', result: '8.1', unit: 'µg/dL', ref: '5.1 – 14.1', flag: 'normal' },
      { name: 'TSH', result: '2.4', unit: 'µIU/mL', ref: '0.4 – 4.5', flag: 'normal' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-039': {
    patientAgeSex: '45 years / Male', collectedOn: '23 Jun 2026 · 9:05 AM',
    referredBy: 'Dr. Amit Verma', reportedOn: '23 Jun 2026 · 10:15 AM',
    testTitle: 'Blood Glucose', sampleId: 'SMP-2406-085',
    note: 'Fasting glucose result is above the supplied reference range.',
    specimen: 'Fluoride plasma', fasting: 'Fasting', groupTitle: 'Biochemistry — Glucose',
    rows: [
      { name: 'Fasting blood glucose', result: '132', unit: 'mg/dL', ref: '70 – 99', flag: 'high' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-038': {
    patientAgeSex: '29 years / Female', collectedOn: '23 Jun 2026 · 8:30 AM',
    referredBy: 'Dr. Neha Shah', reportedOn: '23 Jun 2026 · 11:20 AM',
    testTitle: 'Complete Blood Count (CBC) + ESR', sampleId: 'SMP-2406-084',
    note: 'Haemoglobin is slightly below the supplied reference range.',
    specimen: 'EDTA whole blood', fasting: 'Not required', groupTitle: 'Haematology — CBC + ESR',
    rows: [
      { name: 'Haemoglobin', result: '11.2', unit: 'g/dL', ref: '12.0 – 15.0', flag: 'low' },
      { name: 'Total WBC count', result: '7,400', unit: '/µL', ref: '4,000 – 11,000', flag: 'normal' },
      { name: 'Platelet count', result: '2.6', unit: 'lakh/µL', ref: '1.5 – 4.5', flag: 'normal' },
      { name: 'ESR', result: '24', unit: 'mm/hr', ref: '0 – 20', flag: 'high' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-037': {
    patientAgeSex: '52 years / Male', collectedOn: '23 Jun 2026 · 9:15 AM',
    referredBy: 'Dr. Suresh Menon', reportedOn: '23 Jun 2026 · 10:45 AM',
    testTitle: 'HbA1c', sampleId: 'SMP-2406-083',
    note: 'HbA1c is above the supplied reference range.',
    specimen: 'EDTA whole blood', fasting: 'Not required', groupTitle: 'Biochemistry — Glycated haemoglobin',
    rows: [
      { name: 'HbA1c', result: '7.2', unit: '%', ref: 'Below 5.7', flag: 'high' },
      { name: 'Estimated average glucose', result: '160', unit: 'mg/dL', ref: 'Interpret with HbA1c', flag: 'high' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-033': {
    patientAgeSex: '40 years / Female', collectedOn: '22 Jun 2026 · 9:10 AM',
    referredBy: 'Dr. Kavita Rao', reportedOn: '22 Jun 2026 · 11:00 AM',
    testTitle: 'Liver Function Test (LFT)', sampleId: 'SMP-2406-079',
    note: 'Liver function results are within the supplied reference ranges.',
    specimen: 'Serum', fasting: 'Not required', groupTitle: 'Biochemistry — Hepatic profile',
    rows: [
      { name: 'Total bilirubin', result: '0.8', unit: 'mg/dL', ref: '0.2 – 1.2', flag: 'normal' },
      { name: 'ALT (SGPT)', result: '28', unit: 'U/L', ref: '7 – 35', flag: 'normal' },
      { name: 'AST (SGOT)', result: '25', unit: 'U/L', ref: '8 – 35', flag: 'normal' },
      { name: 'Alkaline phosphatase', result: '82', unit: 'U/L', ref: '44 – 147', flag: 'normal' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
  'RPT-2406-030': {
    patientAgeSex: '58 years / Male', collectedOn: '22 Jun 2026 · 8:55 AM',
    referredBy: 'Dr. Amit Verma', reportedOn: '22 Jun 2026 · 10:50 AM',
    testTitle: 'Lipid Profile', sampleId: 'SMP-2406-076',
    note: 'Total cholesterol and LDL cholesterol are above the supplied reference ranges.',
    specimen: 'Serum', fasting: 'Fasting', groupTitle: 'Biochemistry — Lipid profile',
    rows: [
      { name: 'Total cholesterol', result: '228', unit: 'mg/dL', ref: 'Below 200', flag: 'high' },
      { name: 'LDL cholesterol', result: '148', unit: 'mg/dL', ref: 'Below 100', flag: 'high' },
      { name: 'HDL cholesterol', result: '52', unit: 'mg/dL', ref: 'Above 40', flag: 'normal' },
      { name: 'Triglycerides', result: '140', unit: 'mg/dL', ref: 'Below 150', flag: 'normal' },
    ],
    authorisedBy: 'Dr. Priya Hegde', qualification: 'MD Pathology',
  },
};



/**
 * Reports data boundary. The current implementation uses clearly illustrative
 * local records; replace this provider's loading and update methods with API
 * calls while keeping the component contract stable.
 */
@Injectable({ providedIn: 'root' })
export class ReportsDataService {
  private readonly workflowStore = inject(LabWorkflowMockService);
  private readonly patientFlow = inject(PatientFlowService);
  private readonly illustrativeReports = signal<ReportRow[]>(REPORTS.map(report => ({ ...report })));

  readonly reports = computed(() => {
    const rows = new Map(this.illustrativeReports().map(report => [report.id, report]));
    for (const report of this.workflowStore.reports()) {
      const joined = this.joinWorkflowReport(report.id);
      if (joined) rows.set(report.id, this.workflowRow(joined));
    }
    return [...rows.values()];
  });

  getReportDetail(reportId: string): ReportDetail | null {
    const joined = this.joinWorkflowReport(reportId);
    if (joined) return this.workflowDetail(joined);
    return REPORT_DETAILS[reportId] ?? null;
  }

  markAsDispatched(reportId: string): void {
    const workflowReport = this.workflowStore.reports().find(item => item.id === reportId);
    if (workflowReport) {
      if (workflowReport.status !== 'dispatched') this.workflowStore.dispatchReport(reportId, 'reports');
      return;
    }
    this.illustrativeReports.update(items => items.map(item =>
      item.id === reportId ? { ...item, status: 'dispatched' as const } : item
    ));
  }

  private joinWorkflowReport(reportId: string) {
    const report = this.workflowStore.reports().find(item => item.id === reportId);
    if (!report) return null;
    const sample = this.workflowStore.samples().find(item => item.id === report.sampleId);
    const result = this.workflowStore.results().find(item => item.id === report.resultId && item.sampleId === report.sampleId);
    const visit = sample && this.workflowStore.visits().find(item => item.id === sample.visitId && item.patientId === sample.patientId);
    const order = sample && this.workflowStore.orders().find(item => item.id === sample.orderId && item.visitId === sample.visitId);
    return sample && result && visit && order ? { report, sample, result, visit, order } : null;
  }

  private workflowRow(joined: NonNullable<ReturnType<ReportsDataService['joinWorkflowReport']>>): ReportRow {
    const testNames = joined.order.testIds.map(id => this.patientFlow.allTests.find(test => test.id === id)?.name ?? id);
    return {
      id: joined.report.id,
      patientName: joined.visit.patientName,
      patientId: joined.visit.patientId,
      test: testNames.join(', '),
      date: this.formatDate(joined.report.generatedAt),
      status: joined.report.status,
    };
  }

  private workflowDetail(joined: NonNullable<ReturnType<ReportsDataService['joinWorkflowReport']>>): ReportDetail {
    const testDetails = joined.order.testIds.map(id => this.patientFlow.allTests.find(test => test.id === id));
    const rows: ResultRow[] = Object.entries(joined.result.values).map(([key, value]) => ({
      name: joined.result.parameterLabels?.[key] || key,
      result: value || 'Not available',
      unit: 'Not available',
      ref: 'Not available',
      flag: 'unavailable',
    }));
    const dateTime = (value: string) => new Date(value).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    return {
      patientAgeSex: `${joined.visit.ageYears || 'Not available'} / ${joined.visit.gender || 'Not available'}`,
      collectedOn: dateTime(joined.sample.collectedAt),
      referredBy: joined.visit.refDoctor || 'Not recorded',
      reportedOn: dateTime(joined.report.generatedAt),
      testTitle: testDetails.map(test => test?.name).filter(Boolean).join(' + ') || 'Not available',
      sampleId: joined.sample.id,
      note: 'Generated from validated mock workflow results. Clinical interpretation is not available in the stored mock data.',
      specimen: joined.sample.specimenGroups.map(group => group.sampleType).filter(Boolean).join(', ') || 'Not available',
      fasting: 'Not available',
      groupTitle: [...new Set(testDetails.map(test => test?.category).filter(Boolean))].join(' · ') || 'Not available',
      rows,
      authorisedBy: joined.result.reviewer || 'Not available',
      qualification: 'Not available',
    };
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
