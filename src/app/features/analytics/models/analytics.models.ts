// ─────────────────────────────────────────────
//  MedPath LIS — Analytics Domain Models
// ─────────────────────────────────────────────

export type DateRange = 'today' | '7d' | '30d' | 'quarter';

export interface AnalyticsKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaType: 'up' | 'down' | 'neutral';
  icon: string;
  variant: 'primary' | 'accent' | 'warning' | 'danger';
  spark: string; // "x,y x,y ..." normalized points for inline sparkline
}

export interface TrendPoint {
  label: string;
  revenue: number;
  volume: number;
}

export interface StatusSlice {
  status: 'pending' | 'processing' | 'ready' | 'dispatched' | 'critical';
  label: string;
  count: number;
  color: string;
}

export interface DepartmentTat {
  id: string;
  department: string;
  avgHours: number;
  targetHours: number;
  samples: number;
}

export interface TopTest {
  id: string;
  name: string;
  orders: number;
  revenue: string;
  changePercent: number;
}

export interface ReferringDoctor {
  id: string;
  name: string;
  clinic: string;
  referrals: number;
  revenue: string;
  changePercent: number;
}

export interface AnalyticsSnapshot {
  range: DateRange;
  kpis: AnalyticsKpi[];
  trend: TrendPoint[];
  statusBreakdown: StatusSlice[];
  departmentTat: DepartmentTat[];
  topTests: TopTest[];
  topDoctors: ReferringDoctor[];
  collectionRatePct: number;
  outstandingDues: string;
}
