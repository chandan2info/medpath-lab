import { TestBed } from '@angular/core/testing';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { PatientHistoryService } from '../patient-history/services/patient-history.service';
import { ReportsDataService } from './reports-data.service';

describe('ReportsDataService workflow integration', () => {
  let store: LabWorkflowMockService;
  let reports: ReportsDataService;
  let history: PatientHistoryService;
  const patientId = 'PAT-QA-REPORT-001';
  const sampleId = 'SMP-QA-REPORT-001';
  let orderId: string;

  function createValidatedReport() {
    const visit = store.createVisit({
      id: patientId, firstName: 'Synthetic', lastName: 'Report', ageYears: '35',
      gender: 'Female', mobile: '6000000001', refDoctor: 'Dr QA',
    });
    const order = store.createOrder({
      visitId: visit.id, patientId, testIds: ['CBC'], priority: 'routine',
      subtotal: 200, discount: 0, total: 200,
    });
    orderId = order.id;
    store.createSample({
      id: sampleId, orderId, visitId: visit.id, patientId, patientName: 'Synthetic Report',
      testIds: ['CBC'], priority: 'routine', collectedAt: '2026-11-26T10:00:00.000Z',
      collector: 'QA', checklist: [], notes: '', specimenGroups: [{
        tubeType: 'EDTA (Purple top)', sampleType: 'Whole blood', testIds: ['CBC'],
      }],
    });
    store.saveResults(sampleId, { 'CBC.hb': '12.5' }, { 'CBC.hb': 'Haemoglobin' });
    store.submitResults(sampleId);
    store.reviewResults(sampleId, 'Dr QA', true);
    return store.generateReport(sampleId);
  }

  beforeEach(() => {
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    spyOn(Storage.prototype, 'setItem').and.stub();
    TestBed.configureTestingModule({});
    store = TestBed.inject(LabWorkflowMockService);
    reports = TestBed.inject(ReportsDataService);
    history = TestBed.inject(PatientHistoryService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('joins generated reports into the Reports list and preview without fabricating clinical metadata', () => {
    const report = createValidatedReport();
    store.generateReport(sampleId);

    expect(reports.reports().some(row => row.id === 'RPT-2406-041')).toBeTrue();
    expect(reports.reports().filter(row => row.id === report.id).length).toBe(1);
    expect(reports.reports().find(row => row.id === report.id)).toEqual(jasmine.objectContaining({
      patientName: 'Synthetic Report', patientId, test: 'CBC — Complete blood count', status: 'generated',
    }));
    expect(reports.getReportDetail(report.id)?.rows).toEqual([jasmine.objectContaining({
      name: 'Haemoglobin', result: '12.5', unit: 'Not available', ref: 'Not available', flag: 'unavailable',
    })]);
  });

  it('persists generated report dispatch status through the shared workflow store', () => {
    const report = createValidatedReport();
    reports.markAsDispatched(report.id);

    expect(store.reports().find(item => item.id === report.id)?.status).toBe('dispatched');
    expect(reports.reports().find(item => item.id === report.id)?.status).toBe('dispatched');
    const [key, raw] = (Storage.prototype.setItem as jasmine.Spy).calls.mostRecent().args;
    expect(key).toBe('medpath.workflow.mock.v1');
    expect(JSON.parse(raw).reports.find((item: { id: string }) => item.id === report.id).status).toBe('dispatched');
  });

  it('keeps the Patient History report ID and dispatch status aligned with Reports', () => {
    const report = createValidatedReport();
    const reportRow = reports.reports().find(item => item.id === report.id)!;
    const historyVisit = history.patients().find(item => item.id === patientId)?.visits[0];

    expect(historyVisit?.reportId).toBe(reportRow.id);
    expect(historyVisit?.reports).toEqual([{ name: 'CBC — Complete blood count', status: 'Generated', reportId: reportRow.id }]);

    reports.markAsDispatched(report.id);
    expect(history.patients().find(item => item.id === patientId)?.visits[0].reports).toEqual([
      { name: 'CBC — Complete blood count', status: 'Dispatched', reportId: reportRow.id },
    ]);
  });
});
