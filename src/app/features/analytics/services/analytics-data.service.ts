import { Injectable, signal, computed } from '@angular/core';
import {
  AnalyticsSnapshot,
  DateRange,
  AnalyticsKpi,
  TrendPoint,
  StatusSlice,
  DepartmentTat,
  TopTest,
  ReferringDoctor,
} from '../models/analytics.models';

/** In production this service would call the reporting API per range. */
const SNAPSHOTS: Record<DateRange, AnalyticsSnapshot> = {
  today: {
    range: 'today',
    collectionRatePct: 82,
    outstandingDues: '₹4,200',
    kpis: [
      { id: 'revenue',  label: 'Revenue',          value: '₹18,450', delta: '↑ 6.4% vs yesterday', deltaType: 'up',      icon: 'currency-rupee', variant: 'primary', spark: '0,24 16,20 32,22 48,14 64,16 80,8 100,6' },
      { id: 'samples',  label: 'Samples processed', value: '61',      delta: '↑ 9 vs yesterday',    deltaType: 'up',      icon: 'test-pipe',      variant: 'accent',  spark: '0,26 16,22 32,18 48,20 64,12 80,14 100,8' },
      { id: 'tat',      label: 'Avg turnaround',    value: '3.4 hrs', delta: '↓ 0.3 hrs improved',  deltaType: 'up',      icon: 'clock-hour-4',   variant: 'accent',  spark: '0,10 16,16 32,12 48,18 64,14 80,20 100,16' },
      { id: 'critical', label: 'Critical flags',    value: '2',       delta: 'Needs review',        deltaType: 'neutral', icon: 'alert-triangle', variant: 'danger',  spark: '0,8 16,14 32,10 48,20 64,12 80,18 100,14' },
      { id: 'collect',  label: 'Collection rate',   value: '82%',     delta: '↓ 3 pts vs yesterday', deltaType: 'down',   icon: 'wallet',         variant: 'warning', spark: '0,20 16,18 32,22 48,16 64,20 80,14 100,18' },
    ],
    trend: [
      { label: '8 AM', revenue: 1200, volume: 4 },
      { label: '9 AM', revenue: 2600, volume: 9 },
      { label: '10 AM', revenue: 3100, volume: 12 },
      { label: '11 AM', revenue: 2400, volume: 10 },
      { label: '12 PM', revenue: 3800, volume: 14 },
      { label: '1 PM', revenue: 2100, volume: 7 },
      { label: '2 PM', revenue: 3350, volume: 11 },
    ],
    statusBreakdown: [
      { status: 'pending',    label: 'Pending',    count: 8,  color: '#EF9F27' },
      { status: 'processing', label: 'Processing', count: 14, color: '#5367FE' },
      { status: 'ready',      label: 'Ready',      count: 11, color: '#3DC9A8' },
      { status: 'dispatched', label: 'Dispatched', count: 26, color: '#0F6E56' },
      { status: 'critical',   label: 'Critical',   count: 2,  color: '#E24B4A' },
    ],
    departmentTat: [
      { id: 'hema',  department: 'Hematology',  avgHours: 2.1, targetHours: 3, samples: 22 },
      { id: 'bio',   department: 'Biochemistry', avgHours: 3.8, targetHours: 4, samples: 18 },
      { id: 'micro', department: 'Microbiology', avgHours: 6.4, targetHours: 5, samples: 6 },
      { id: 'path',  department: 'Pathology',    avgHours: 4.2, targetHours: 6, samples: 9 },
      { id: 'immu',  department: 'Immunology',   avgHours: 5.6, targetHours: 5, samples: 6 },
    ],
    topTests: [
      { id: 't1', name: 'CBC',              orders: 19, revenue: '₹4,750', changePercent: 8.2 },
      { id: 't2', name: 'Lipid profile',    orders: 14, revenue: '₹6,300', changePercent: 4.1 },
      { id: 't3', name: 'HbA1c',            orders: 11, revenue: '₹3,850', changePercent: -2.6 },
      { id: 't4', name: 'Thyroid panel',    orders: 9,  revenue: '₹4,050', changePercent: 12.5 },
      { id: 't5', name: 'KFT',              orders: 8,  revenue: '₹2,960', changePercent: -1.2 },
    ],
    topDoctors: [
      { id: 'd1', name: 'Dr. Anita Rao',     clinic: 'Sunrise Clinic',      referrals: 12, revenue: '₹9,400', changePercent: 6.8 },
      { id: 'd2', name: 'Dr. Vikram Shah',   clinic: 'Cityview Hospital',   referrals: 9,  revenue: '₹7,150', changePercent: 3.2 },
      { id: 'd3', name: 'Dr. Fatima Sheikh', clinic: 'Green Valley Health', referrals: 7,  revenue: '₹5,300', changePercent: -1.9 },
    ],
  },
  '7d': {
    range: '7d',
    collectionRatePct: 88,
    outstandingDues: '₹21,600',
    kpis: [
      { id: 'revenue',  label: 'Revenue',          value: '₹1.28L',  delta: '↑ 11.2% vs prior 7d', deltaType: 'up',      icon: 'currency-rupee', variant: 'primary', spark: '0,28 16,22 32,24 48,16 64,18 80,10 100,6' },
      { id: 'samples',  label: 'Samples processed', value: '418',     delta: '↑ 34 vs prior 7d',    deltaType: 'up',      icon: 'test-pipe',      variant: 'accent',  spark: '0,24 16,20 32,16 48,18 64,10 80,12 100,6' },
      { id: 'tat',      label: 'Avg turnaround',    value: '3.9 hrs', delta: '↑ 0.2 hrs slower',    deltaType: 'down',    icon: 'clock-hour-4',   variant: 'accent',  spark: '0,12 16,18 32,14 48,20 64,16 80,22 100,18' },
      { id: 'critical', label: 'Critical flags',    value: '9',       delta: '3 unresolved',        deltaType: 'neutral', icon: 'alert-triangle', variant: 'danger',  spark: '0,10 16,16 32,12 48,22 64,14 80,20 100,16' },
      { id: 'collect',  label: 'Collection rate',   value: '88%',     delta: '↑ 2 pts vs prior 7d', deltaType: 'up',      icon: 'wallet',         variant: 'warning', spark: '0,18 16,16 32,20 48,14 64,18 80,12 100,16' },
    ],
    trend: [
      { label: 'Mon', revenue: 15200, volume: 52 },
      { label: 'Tue', revenue: 17400, volume: 58 },
      { label: 'Wed', revenue: 14800, volume: 49 },
      { label: 'Thu', revenue: 19600, volume: 63 },
      { label: 'Fri', revenue: 21100, volume: 70 },
      { label: 'Sat', revenue: 22300, volume: 74 },
      { label: 'Sun', revenue: 12800, volume: 41 },
    ],
    statusBreakdown: [
      { status: 'pending',    label: 'Pending',    count: 22, color: '#EF9F27' },
      { status: 'processing', label: 'Processing', count: 38, color: '#5367FE' },
      { status: 'ready',      label: 'Ready',      count: 41, color: '#3DC9A8' },
      { status: 'dispatched', label: 'Dispatched', count: 308, color: '#0F6E56' },
      { status: 'critical',   label: 'Critical',   count: 9,  color: '#E24B4A' },
    ],
    departmentTat: [
      { id: 'hema',  department: 'Hematology',  avgHours: 2.4, targetHours: 3, samples: 148 },
      { id: 'bio',   department: 'Biochemistry', avgHours: 4.1, targetHours: 4, samples: 122 },
      { id: 'micro', department: 'Microbiology', avgHours: 6.0, targetHours: 5, samples: 44 },
      { id: 'path',  department: 'Pathology',    avgHours: 4.8, targetHours: 6, samples: 61 },
      { id: 'immu',  department: 'Immunology',   avgHours: 5.2, targetHours: 5, samples: 43 },
    ],
    topTests: [
      { id: 't1', name: 'CBC',              orders: 132, revenue: '₹33,000', changePercent: 9.4 },
      { id: 't2', name: 'Lipid profile',    orders: 98,  revenue: '₹44,100', changePercent: 6.7 },
      { id: 't3', name: 'HbA1c',            orders: 76,  revenue: '₹26,600', changePercent: -0.8 },
      { id: 't4', name: 'Thyroid panel',    orders: 61,  revenue: '₹27,450', changePercent: 15.1 },
      { id: 't5', name: 'KFT',              orders: 54,  revenue: '₹19,980', changePercent: 2.3 },
    ],
    topDoctors: [
      { id: 'd1', name: 'Dr. Anita Rao',     clinic: 'Sunrise Clinic',      referrals: 74, revenue: '₹58,300', changePercent: 8.1 },
      { id: 'd2', name: 'Dr. Vikram Shah',   clinic: 'Cityview Hospital',   referrals: 61, revenue: '₹47,900', changePercent: 5.4 },
      { id: 'd3', name: 'Dr. Fatima Sheikh', clinic: 'Green Valley Health', referrals: 48, revenue: '₹36,150', changePercent: -0.6 },
    ],
  },
  '30d': {
    range: '30d',
    collectionRatePct: 91,
    outstandingDues: '₹68,900',
    kpis: [
      { id: 'revenue',  label: 'Revenue',          value: '₹5.62L',  delta: '↑ 14.8% vs prior 30d', deltaType: 'up',      icon: 'currency-rupee', variant: 'primary', spark: '0,30 16,24 32,26 48,18 64,20 80,10 100,4' },
      { id: 'samples',  label: 'Samples processed', value: '1,864',   delta: '↑ 212 vs prior 30d',   deltaType: 'up',      icon: 'test-pipe',      variant: 'accent',  spark: '0,26 16,22 32,18 48,20 64,12 80,14 100,6' },
      { id: 'tat',      label: 'Avg turnaround',    value: '4.1 hrs', delta: '↓ 0.4 hrs improved',   deltaType: 'up',      icon: 'clock-hour-4',   variant: 'accent',  spark: '0,14 16,18 32,12 48,20 64,16 80,10 100,14' },
      { id: 'critical', label: 'Critical flags',    value: '31',      delta: '4 unresolved',         deltaType: 'neutral', icon: 'alert-triangle', variant: 'danger',  spark: '0,12 16,18 32,14 48,20 64,16 80,22 100,18' },
      { id: 'collect',  label: 'Collection rate',   value: '91%',     delta: '↑ 4 pts vs prior 30d', deltaType: 'up',      icon: 'wallet',         variant: 'warning', spark: '0,20 16,18 32,22 48,16 64,20 80,14 100,10' },
    ],
    trend: [
      { label: 'W1', revenue: 118000, volume: 412 },
      { label: 'W2', revenue: 134000, volume: 468 },
      { label: 'W3', revenue: 141000, volume: 489 },
      { label: 'W4', revenue: 169000, volume: 495 },
    ],
    statusBreakdown: [
      { status: 'pending',    label: 'Pending',    count: 46,  color: '#EF9F27' },
      { status: 'processing', label: 'Processing', count: 88,  color: '#5367FE' },
      { status: 'ready',      label: 'Ready',      count: 102, color: '#3DC9A8' },
      { status: 'dispatched', label: 'Dispatched', count: 1597, color: '#0F6E56' },
      { status: 'critical',   label: 'Critical',   count: 31, color: '#E24B4A' },
    ],
    departmentTat: [
      { id: 'hema',  department: 'Hematology',  avgHours: 2.6, targetHours: 3, samples: 612 },
      { id: 'bio',   department: 'Biochemistry', avgHours: 4.3, targetHours: 4, samples: 534 },
      { id: 'micro', department: 'Microbiology', avgHours: 5.8, targetHours: 5, samples: 198 },
      { id: 'path',  department: 'Pathology',    avgHours: 5.1, targetHours: 6, samples: 261 },
      { id: 'immu',  department: 'Immunology',   avgHours: 4.9, targetHours: 5, samples: 259 },
    ],
    topTests: [
      { id: 't1', name: 'CBC',              orders: 542, revenue: '₹1,35,500', changePercent: 10.6 },
      { id: 't2', name: 'Lipid profile',    orders: 401, revenue: '₹1,80,450', changePercent: 7.9 },
      { id: 't3', name: 'HbA1c',            orders: 318, revenue: '₹1,11,300', changePercent: 1.4 },
      { id: 't4', name: 'Thyroid panel',    orders: 256, revenue: '₹1,15,200', changePercent: 13.2 },
      { id: 't5', name: 'KFT',              orders: 221, revenue: '₹81,770',   changePercent: 3.8 },
    ],
    topDoctors: [
      { id: 'd1', name: 'Dr. Anita Rao',     clinic: 'Sunrise Clinic',      referrals: 298, revenue: '₹2,34,600', changePercent: 9.7 },
      { id: 'd2', name: 'Dr. Vikram Shah',   clinic: 'Cityview Hospital',   referrals: 246, revenue: '₹1,93,400', changePercent: 6.2 },
      { id: 'd3', name: 'Dr. Fatima Sheikh', clinic: 'Green Valley Health', referrals: 189, revenue: '₹1,42,800', changePercent: 0.9 },
    ],
  },
  quarter: {
    range: 'quarter',
    collectionRatePct: 94,
    outstandingDues: '₹1,84,200',
    kpis: [
      { id: 'revenue',  label: 'Revenue',          value: '₹16.4L',  delta: '↑ 18.3% vs prior quarter', deltaType: 'up',      icon: 'currency-rupee', variant: 'primary', spark: '0,32 16,26 32,28 48,18 64,20 80,10 100,4' },
      { id: 'samples',  label: 'Samples processed', value: '5,412',   delta: '↑ 640 vs prior quarter',   deltaType: 'up',      icon: 'test-pipe',      variant: 'accent',  spark: '0,26 16,22 32,18 48,20 64,12 80,14 100,6' },
      { id: 'tat',      label: 'Avg turnaround',    value: '4.3 hrs', delta: '↓ 0.6 hrs improved',       deltaType: 'up',      icon: 'clock-hour-4',   variant: 'accent',  spark: '0,16 16,20 32,14 48,22 64,18 80,12 100,16' },
      { id: 'critical', label: 'Critical flags',    value: '84',      delta: '11 unresolved',            deltaType: 'neutral', icon: 'alert-triangle', variant: 'danger',  spark: '0,14 16,20 32,16 48,22 64,18 80,24 100,20' },
      { id: 'collect',  label: 'Collection rate',   value: '94%',     delta: '↑ 5 pts vs prior quarter', deltaType: 'up',      icon: 'wallet',         variant: 'warning', spark: '0,22 16,20 32,24 48,18 64,22 80,16 100,12' },
    ],
    trend: [
      { label: 'Jan', revenue: 480000, volume: 1620 },
      { label: 'Feb', revenue: 512000, volume: 1740 },
      { label: 'Mar', revenue: 648000, volume: 2052 },
    ],
    statusBreakdown: [
      { status: 'pending',    label: 'Pending',    count: 58,   color: '#EF9F27' },
      { status: 'processing', label: 'Processing', count: 104,  color: '#5367FE' },
      { status: 'ready',      label: 'Ready',      count: 121,  color: '#3DC9A8' },
      { status: 'dispatched', label: 'Dispatched', count: 5045, color: '#0F6E56' },
      { status: 'critical',   label: 'Critical',   count: 84,   color: '#E24B4A' },
    ],
    departmentTat: [
      { id: 'hema',  department: 'Hematology',  avgHours: 2.7, targetHours: 3, samples: 1780 },
      { id: 'bio',   department: 'Biochemistry', avgHours: 4.5, targetHours: 4, samples: 1546 },
      { id: 'micro', department: 'Microbiology', avgHours: 5.6, targetHours: 5, samples: 572 },
      { id: 'path',  department: 'Pathology',    avgHours: 5.3, targetHours: 6, samples: 754 },
      { id: 'immu',  department: 'Immunology',   avgHours: 4.7, targetHours: 5, samples: 760 },
    ],
    topTests: [
      { id: 't1', name: 'CBC',              orders: 1568, revenue: '₹3,92,000', changePercent: 12.1 },
      { id: 't2', name: 'Lipid profile',    orders: 1142, revenue: '₹5,13,900', changePercent: 8.6 },
      { id: 't3', name: 'HbA1c',            orders: 902,  revenue: '₹3,15,700', changePercent: 3.2 },
      { id: 't4', name: 'Thyroid panel',    orders: 731,  revenue: '₹3,28,950', changePercent: 14.9 },
      { id: 't5', name: 'KFT',              orders: 618,  revenue: '₹2,28,660', changePercent: 5.1 },
    ],
    topDoctors: [
      { id: 'd1', name: 'Dr. Anita Rao',     clinic: 'Sunrise Clinic',      referrals: 842, revenue: '₹6,62,000', changePercent: 11.4 },
      { id: 'd2', name: 'Dr. Vikram Shah',   clinic: 'Cityview Hospital',   referrals: 706, revenue: '₹5,55,300', changePercent: 7.8 },
      { id: 'd3', name: 'Dr. Fatima Sheikh', clinic: 'Green Valley Health', referrals: 534, revenue: '₹4,03,600', changePercent: 2.1 },
    ],
  },
};

@Injectable({ providedIn: 'root' })
export class AnalyticsDataService {
  private readonly _range = signal<DateRange>('7d');
  private readonly _departmentFilter = signal<string | 'all'>('all');
  private readonly _loading = signal(false);

  readonly range = this._range.asReadonly();
  readonly departmentFilter = this._departmentFilter.asReadonly();
  readonly loading = this._loading.asReadonly();

  private readonly _snapshot = computed<AnalyticsSnapshot>(() => SNAPSHOTS[this._range()]);

  readonly kpis            = computed<AnalyticsKpi[]>(() => this._snapshot().kpis);
  readonly trend           = computed<TrendPoint[]>(() => this._snapshot().trend);
  readonly statusBreakdown = computed<StatusSlice[]>(() => this._snapshot().statusBreakdown);
  readonly collectionRatePct = computed<number>(() => this._snapshot().collectionRatePct);
  readonly outstandingDues   = computed<string>(() => this._snapshot().outstandingDues);

  readonly allDepartments = computed<DepartmentTat[]>(() => this._snapshot().departmentTat);

  readonly departmentTat = computed<DepartmentTat[]>(() => {
    const rows = this._snapshot().departmentTat;
    const filter = this._departmentFilter();
    return filter === 'all' ? rows : rows.filter(r => r.id === filter);
  });

  readonly topTests   = computed<TopTest[]>(() => this._snapshot().topTests);
  readonly topDoctors = computed<ReferringDoctor[]>(() => this._snapshot().topDoctors);

  readonly totalSamplesInStatus = computed<number>(() =>
    this.statusBreakdown().reduce((sum, s) => sum + s.count, 0)
  );

  readonly departmentsOverTarget = computed<number>(() =>
    this._snapshot().departmentTat.filter(d => d.avgHours > d.targetHours).length
  );

  setRange(range: DateRange): void {
    if (range === this._range()) return;
    this._loading.set(true);
    this._range.set(range);
    // Simulate async refresh latency (replace with real HTTP call)
    setTimeout(() => this._loading.set(false), 240);
  }

  setDepartmentFilter(id: string | 'all'): void {
    this._departmentFilter.set(id);
  }

  /** Simulate a live refresh (wire to WebSocket / polling in production) */
  refresh(): void {
    this._loading.set(true);
    setTimeout(() => this._loading.set(false), 300);
  }
}
