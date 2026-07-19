import { Component, signal, computed, ChangeDetectionStrategy, inject, HostListener, ElementRef, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass, NgStyle, TitleCasePipe } from '@angular/common';
import { ResultParameter, ResultFlag } from '../../shared/models/lis.models';
import { ReportPreviewService } from '../../core/services/report-preview.service';
import { PatientFlowService } from '../../core/services/patient-flow.service';

interface ParamRow extends ResultParameter {
  editing: boolean;
  editedBy?: string;
  editedAt?: string;
}

interface TabDef {
  key: string;
  label: string;
  cardTitle: string;
  cardIcon: string;
  params: ParamRow[];
}

const TABS: TabDef[] = [
  {
    key: 'kft',
    label: 'KFT (Kidney function)',
    cardTitle: 'Kidney function test (KFT)',
    cardIcon: 'ti-test-pipe',
    params: [
      { id:'cr',  name:'Serum creatinine',      value:'2.4',  unit:'mg/dL',  refLow:0.7, refHigh:1.3,  refLabel:'0.7 – 1.3',  flag:'high',     editing:false, editedBy:'Ravi Anand', editedAt:'10:41 AM' },
      { id:'bun', name:'Blood urea nitrogen',   value:'48',   unit:'mg/dL',  refLow:7,   refHigh:20,   refLabel:'7 – 20',     flag:'high',     editing:false, editedBy:'Ravi Anand', editedAt:'10:42 AM' },
      { id:'k',   name:'Serum potassium (K⁺)',  value:'6.8',  unit:'mEq/L',  refLow:3.5, refHigh:5.0,  refLabel:'3.5 – 5.0',  flag:'critical', editing:false, editedBy:'Ravi Anand', editedAt:'10:43 AM' },
      { id:'na',  name:'Serum sodium (Na⁺)',    value:'138',  unit:'mEq/L',  refLow:136, refHigh:145,  refLabel:'136 – 145',  flag:'normal',   editing:false, editedBy:'Ravi Anand', editedAt:'10:43 AM' },
      { id:'ua',  name:'Serum uric acid',       value:'5.2',  unit:'mg/dL',  refLow:3.5, refHigh:7.2,  refLabel:'3.5 – 7.2',  flag:'normal',   editing:false, editedBy:'Ravi Anand', editedAt:'10:43 AM' },
      { id:'egfr',name:'eGFR (CKD-EPI)',        value:'32',   unit:'mL/min', refLow:60,  refHigh:null, refLabel:'≥ 60',       flag:'low',      editing:false, editedBy:'Ravi Anand', editedAt:'10:44 AM' },
    ],
  },
  {
    key: 'urine',
    label: 'Urine R/M',
    cardTitle: 'Urine routine & microscopy',
    cardIcon: 'ti-droplet',
    params: [
      { id:'u-ph',   name:'pH',                value:'6.0',   unit:'',     refLow:4.5, refHigh:8.0, refLabel:'4.5 – 8.0',  flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:32 AM' },
      { id:'u-sg',   name:'Specific gravity',  value:'1.02',  unit:'',     refLow:1.005, refHigh:1.03, refLabel:'1.005 – 1.030', flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:32 AM' },
      { id:'u-prot', name:'Protein',           value:'0',     unit:'mg/dL',refLow:0,   refHigh:15,  refLabel:'Negative',   flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:33 AM' },
      { id:'u-gluc', name:'Glucose',           value:'0',     unit:'mg/dL',refLow:0,   refHigh:15,  refLabel:'Negative',   flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:33 AM' },
      { id:'u-pus',  name:'Pus cells',         value:'4',     unit:'/hpf', refLow:0,   refHigh:5,   refLabel:'0 – 5',      flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:34 AM' },
      { id:'u-rbc',  name:'RBC',               value:'1',     unit:'/hpf', refLow:0,   refHigh:2,   refLabel:'0 – 2',      flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:34 AM' },
    ],
  },
  {
    key: 'haem',
    label: 'Haematology',
    cardTitle: 'Haematology profile',
    cardIcon: 'ti-microscope',
    params: [
      { id:'h-hb',   name:'Haemoglobin',       value:'13.5',   unit:'g/dL',    refLow:13,    refHigh:17,    refLabel:'13 – 17',        flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:50 AM' },
      { id:'h-wbc',  name:'Total WBC count',   value:'7800',   unit:'/µL',     refLow:4000,  refHigh:11000, refLabel:'4000 – 11000',   flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:50 AM' },
      { id:'h-plt',  name:'Platelet count',    value:'210000', unit:'/µL',     refLow:150000,refHigh:410000,refLabel:'150000 – 410000',flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:51 AM' },
      { id:'h-esr',  name:'ESR',               value:'18',     unit:'mm/hr',   refLow:0,     refHigh:15,    refLabel:'0 – 15',         flag:'high',   editing:false, editedBy:'Ravi Anand', editedAt:'9:51 AM' },
      { id:'h-rbc',  name:'RBC count',         value:'4.8',    unit:'mil/µL',  refLow:4.5,   refHigh:5.5,   refLabel:'4.5 – 5.5',      flag:'normal', editing:false, editedBy:'Ravi Anand', editedAt:'9:52 AM' },
    ],
  },
];

@Component({
  selector: 'app-result-entry',
  standalone: true,
  imports: [RouterLink, NgClass, NgStyle, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './result-entry.component.html',
    styleUrl: './result-entry.component.css',
})
export class ResultEntryComponent implements OnInit {
  private readonly router     = inject(Router);
  private readonly previewSvc = inject(ReportPreviewService);
  private readonly host       = inject(ElementRef<HTMLElement>);
  protected readonly flow     = inject(PatientFlowService);

  protected readonly tabs: TabDef[] = TABS;

  ngOnInit(): void {
    // Same guard used on Test Order/Billing/Sample Collection — Result
    // Entry is part of the same patient workflow, so it shouldn't show
    // a page's worth of demographic data for a patient that was never
    // registered.
    if (!this.flow.patient()) {
      this.router.navigate(['/dashboard/registration']);
    }
  }

  /** Single source of truth for the patient bar — shared with
   *  Registration/Test Order/Billing/Sample Collection via
   *  PatientFlowService, instead of this page's own hardcoded copy. */
  get patient() { return this.flow.patient(); }

  get patientInitials(): string {
    const p = this.patient;
    if (!p) return '?';
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
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

  /** Mirrors the male/female/genderless mapping used on Billing/Test
   *  Order/Sample Collection, so the icon reads identically everywhere
   *  a patient's gender appears. */
  genderIcon(): string {
    const g = (this.patient?.gender ?? '').toLowerCase();
    if (g === 'male')   return 'ti-gender-male';
    if (g === 'female') return 'ti-gender-female';
    return 'ti-gender-genderless';
  }

  /** Pristine copy of every tab's data, used to power the reset controls. */
  private readonly originalTabData: Record<string, ParamRow[]> =
    Object.fromEntries(TABS.map(t => [t.key, t.params.map(p => ({ ...p }))]));

  /** All tabs' data, keyed by tab key, so switching tabs never loses in-progress edits. */
  private readonly tabData = signal<Record<string, ParamRow[]>>(
    Object.fromEntries(TABS.map(t => [t.key, t.params.map(p => ({ ...p }))]))
  );

  activeTabKey = signal<string>(TABS[0].key);
  activeTab = computed(() => this.tabs.find(t => t.key === this.activeTabKey())!);
  params = computed(() => this.tabData()[this.activeTabKey()]);

  /** Last saved timestamp, kept in sync so the autosave chip reflects real edits. */
  lastSavedAt = signal(this.now());

  hasCritical = computed(() => this.params().some(p => p.flag === 'critical'));
  criticalParam = computed(() => this.params().find(p => p.flag === 'critical') ?? null);
  enteredCount = computed(() => this.params().filter(p => p.value !== '').length);
  pct = computed(() => Math.round(this.enteredCount() / this.params().length * 100));
  normalCount  = computed(() => this.params().filter(p => p.flag === 'normal').length);
  abnCount     = computed(() => this.params().filter(p => p.flag === 'high' || p.flag === 'low').length);
  critCount    = computed(() => this.params().filter(p => p.flag === 'critical').length);

  /** Header badge for the result card: reflects the ACTIVE tab's real data, not a fixed count. */
  cardBadge = computed(() => {
    if (this.critCount() > 0) return { style: 'danger', icon: 'ti-alert-octagon', text: this.critCount() + ' critical' };
    if (this.abnCount() > 0)  return { style: 'warn',   icon: 'ti-alert-triangle', text: this.abnCount() + ' abnormal' };
    return { style: 'ok', icon: 'ti-circle-check', text: 'All normal' };
  });

  /** True once at least one value on the active tab has been changed from its original entry. */
  anyEdited = computed(() => this.params().some(p => p.editedBy === 'You'));

  isRowEdited(p: ParamRow): boolean {
    return p.editedBy === 'You';
  }

  selectTab(key: string): void {
    this.activeTabKey.set(key);
  }

  private now(): string {
    return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }

  /** Position (0-100 percent) of the current value along the reference range, for the mini range bar. */
  rangePct(p: ParamRow): number {
    const v = parseFloat(p.value);
    if (isNaN(v)) return 50;
    const lo = p.refLow ?? 0;
    if (p.refHigh === null) {
      return v >= lo ? 70 : Math.max(4, Math.min(96, (v / (lo || 1)) * 70));
    }
    const hi = p.refHigh;
    const span = hi - lo || 1;
    const pct = ((v - lo) / span) * 100;
    return Math.max(4, Math.min(96, pct));
  }

  statusIcon(f: ResultFlag): string {
    return { normal: 'ti-check', high: 'ti-alert-triangle', low: 'ti-alert-triangle', critical: 'ti-x' }[f] ?? 'ti-check';
  }

  /** Ctrl+S saves the draft, Ctrl+Enter generates the report, from anywhere on the page. */
  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      this.saveDraft();
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
      ev.preventDefault();
      this.navigateToPreview();
    }
  }

  /** Left/Right arrow keys move focus between tabs, per the WAI-ARIA tabs pattern. */
  onTabKeydown(ev: KeyboardEvent, index: number): void {
    let nextIndex: number | null = null;
    if (ev.key === 'ArrowRight') nextIndex = (index + 1) % this.tabs.length;
    else if (ev.key === 'ArrowLeft') nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    else if (ev.key === 'Home') nextIndex = 0;
    else if (ev.key === 'End') nextIndex = this.tabs.length - 1;
    if (nextIndex === null) return;

    ev.preventDefault();
    const nextKey = this.tabs[nextIndex].key;
    this.selectTab(nextKey);
    const btn = this.host.nativeElement.querySelector(
      '[data-tab-key="' + nextKey + '"]'
    ) as HTMLButtonElement | null;
    btn?.focus();
  }

  /** Enter on a result field moves focus to the same field on the next row. */
  onResultKeydown(ev: KeyboardEvent, i: number): void {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    const selector = 'input[data-row-index="' + (i + 1) + '"]';
    const next = this.host.nativeElement.querySelector(selector) as HTMLInputElement | null;
    next?.focus();
    next?.select();
  }

  saveDraft(): void {
    this.lastSavedAt.set(this.now());
  }

  evalFlag(i: number): void {
    const key = this.activeTabKey();
    this.tabData.update(all => {
      const rows = [...all[key]];
      const p = { ...rows[i] };
      const v = parseFloat(p.value);
      if (isNaN(v)) { p.flag = 'normal'; }
      else if (p.id === 'k' && v > 6.0) { p.flag = 'critical'; }
      else if (p.refHigh !== null && v > p.refHigh) { p.flag = 'high'; }
      else if (p.refLow !== null && v < p.refLow)   { p.flag = 'low';  }
      else { p.flag = 'normal'; }
      rows[i] = p;
      return { ...all, [key]: rows };
    });
  }

  updateValue(i: number, value: string): void {
    const key = this.activeTabKey();
    this.tabData.update(all => {
      const rows = [...all[key]];
      rows[i] = { ...rows[i], value, editedBy: 'You', editedAt: this.now() };
      return { ...all, [key]: rows };
    });
    this.evalFlag(i);
  }

  /** Restore a single row to its original, unedited value — undoes a typo without touching the rest. */
  resetRow(i: number): void {
    const key = this.activeTabKey();
    const original = this.originalTabData[key][i];
    this.tabData.update(all => {
      const rows = [...all[key]];
      rows[i] = { ...original };
      return { ...all, [key]: rows };
    });
  }

  /** Restore every row on the active tab back to its original values, after a confirmation. */
  resetAll(): void {
    if (!this.anyEdited()) return;
    const confirmed = window.confirm('Reset all results in this section back to their original entries? This cannot be undone.');
    if (!confirmed) return;
    const key = this.activeTabKey();
    this.tabData.update(all => ({
      ...all,
      [key]: this.originalTabData[key].map(p => ({ ...p })),
    }));
  }

  flagLabel(f: ResultFlag): string {
    return { normal:'Normal', high:'High', low:'Low', critical:'Critical' }[f] ?? f;
  }

  navigateToPreview(): void {
    // Stage the current result set so the preview reflects live edits
    this.previewSvc.stage({ params: this.params() });
    this.router.navigate(['/dashboard/report-preview']);
  }
}
