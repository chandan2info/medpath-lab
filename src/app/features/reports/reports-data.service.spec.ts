import { TestBed } from '@angular/core/testing';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { PatientHistoryService } from '../patient-history/services/patient-history.service';
import { ReportsDataService } from './reports-data.service';
import { createDemoTests } from '../../core/services/result-entry-data.service';

describe('CBC demo result profile', () => {
  it('provides a value and usable metadata for every CBC parameter with sex-specific ranges', () => {
    const female = createDemoTests(['CBC'], [], 'female', '1996-11-27', '2026-11-27T11:03:00.000Z')[0].parameters;
    const male = createDemoTests(['CBC'], [], 'male', '1990-01-01', '2026-11-27T11:03:00.000Z')[0].parameters;

    expect(female.length).toBe(22);
    expect(female.every(parameter => parameter.value.trim() && parameter.unit && parameter.range && parameter.method)).toBeTrue();
    expect(female[0].range).toBe('12.0 – 15.0');
    expect(male[0].range).toBe('13.0 – 17.0');
    expect(female.find(parameter => parameter.name === 'ANC')?.value).toBe('4836');
    expect(female.find(parameter => parameter.name === 'ALC')?.value).toBe('2340');
  });

  it('applies supported pediatric age bands and leaves unconfigured intervals unavailable', () => {
    const sixYearOld = createDemoTests(['CBC'], [], 'female', '2020-01-01', '2026-11-27T11:03:00.000Z')[0].parameters;
    const infant = createDemoTests(['CBC'], [], 'female', '2026-03-01', '2026-11-27T11:03:00.000Z')[0].parameters;
    const teenager = createDemoTests(['CBC'], [], 'female', '2010-01-01', '2026-11-27T11:03:00.000Z')[0].parameters;

    expect(sixYearOld.find(parameter => parameter.name === 'Haemoglobin')?.range).toBe('11.5 – 15.5');
    expect(sixYearOld.find(parameter => parameter.name === 'Haemoglobin')?.flag).toBe('normal');
    expect(sixYearOld.find(parameter => parameter.name === 'Neutrophils')?.flag).toBe('unavailable');
    expect(infant.every(parameter => parameter.flag === 'unavailable')).toBeTrue();
    expect(teenager.every(parameter => parameter.flag === 'unavailable')).toBeTrue();
  });
});

describe('ReportsDataService workflow integration', () => {
  let store: LabWorkflowMockService;
  let reports: ReportsDataService;
  let history: PatientHistoryService;
  const patientId = 'PAT-QA-REPORT-001';
  const sampleId = 'SMP-QA-REPORT-001';
  let orderId: string;

  function createValidatedReport(includeMetadata = true) {
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
      testIds: ['CBC'], priority: 'routine', gender: 'female', dob: '1991-11-26', collectedAt: '2026-11-26T10:00:00.000Z',
      collector: 'QA', checklist: [], notes: '', specimenGroups: [{
        tubeType: 'EDTA (Purple top)', sampleType: 'Whole blood', testIds: ['CBC'],
      }],
    });
    if (includeMetadata) {
      store.saveResults(sampleId, { 'CBC.cbc-0': '12.5' }, { 'CBC.cbc-0': 'Haemoglobin' }, {
        'CBC.cbc-0': { unit: 'g/dL', range: '12.0 – 15.0', flag: 'normal', method: 'Automated hematology analyzer (demo)' },
      });
    } else {
      store.saveResults(sampleId, { 'CBC.cbc-0': '12.5' }, { 'CBC.cbc-0': 'Haemoglobin' });
    }
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

  it('joins generated reports into the Reports list and preview with saved result metadata', () => {
    const report = createValidatedReport();
    store.generateReport(sampleId);

    expect(reports.reports().some(row => row.id === 'RPT-2406-041')).toBeTrue();
    expect(reports.reports().filter(row => row.id === report.id).length).toBe(1);
    expect(reports.reports().find(row => row.id === report.id)).toEqual(jasmine.objectContaining({
      patientName: 'Synthetic Report', patientId, test: 'CBC — Complete blood count', status: 'generated',
    }));
    expect(reports.getReportDetail(report.id)?.rows).toEqual([jasmine.objectContaining({
      name: 'Haemoglobin', result: '12.5', unit: 'g/dL', ref: '12.0 – 15.0', flag: 'normal', method: 'Automated hematology analyzer (demo)',
    })]);
    expect(reports.getReportDetail(report.id)?.testNames).toEqual(['CBC — Complete blood count']);
  });

  it('exposes composite report tests as individual names for the compact preview header', () => {
    expect(reports.getReportDetail('RPT-2406-038')?.testNames).toEqual([
      'Complete Blood Count (CBC)', 'ESR',
    ]);
  });

  it('reconstructs supported profile metadata for a legacy report with values only', () => {
    const report = createValidatedReport(false);
    const row = reports.getReportDetail(report.id)?.rows[0];

    expect(row).toEqual(jasmine.objectContaining({
      name: 'Haemoglobin', result: '12.5', unit: 'g/dL', ref: '12.0 – 15.0', flag: 'normal',
      method: 'Automated hematology analyzer (demo)',
    }));
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
