import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PdfPreferencesService } from '../../core/services/pdf-preferences.service';
import { ReportDetail, ReportRow, ReportsDataService } from './reports-data.service';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent test heading', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  const report: ReportRow = {
    id: 'RPT-QA-001', patientName: 'Synthetic Patient', patientId: 'PAT-QA-001',
    test: 'CBC, ESR, LFT, KFT, TSH', date: '27 Nov 2026', status: 'generated',
  };
  const detail: ReportDetail = {
    patientAgeSex: '30 years / Female', collectedOn: '27 Nov 2026, 10:00',
    referredBy: 'Self / Walk-in', reportedOn: '27 Nov 2026, 11:00',
    testTitle: 'CBC + ESR + LFT + KFT + TSH',
    testNames: ['CBC', 'ESR', 'LFT', 'KFT', 'TSH'],
    sampleId: 'SMP-QA-001', note: 'Synthetic QA report.', specimen: 'Whole blood',
    fasting: 'Not recorded', groupTitle: 'Haematology · Biochemistry', rows: [],
    authorisedBy: 'Demo Pathologist', qualification: 'Not available',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ReportsDataService,
          useValue: {
            reports: signal([report]),
            getReportDetail: () => detail,
            markAsDispatched: () => undefined,
          },
        },
        { provide: PdfPreferencesService, useValue: { customSettingsEnabled: signal(false) } },
      ],
    });
    fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('shows a compact test summary and reveals the remaining names on request', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.rpt-test-count')?.textContent?.trim()).toBe('5 tests');
    expect(element.querySelectorAll('.rpt-test-chip').length).toBe(5);
    expect(element.querySelectorAll('.rpt-test-chip--overflow').length).toBe(2);
    expect(element.querySelector('.rpt-test-list-toggle')?.textContent?.trim()).toBe('+2 more');

    element.querySelector<HTMLButtonElement>('.rpt-test-list-toggle')?.click();
    fixture.detectChanges();

    expect(element.querySelectorAll('.rpt-test-chip--overflow').length).toBe(0);
    expect(element.querySelector('.rpt-test-list-toggle')?.textContent?.trim()).toBe('Show less');
  });
});
