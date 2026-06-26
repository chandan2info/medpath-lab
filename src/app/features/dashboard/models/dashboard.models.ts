export interface StatCard {
  id: string;
  title: string;
  value: string;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  progressValue: number;
  colorVariant: 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'warning';
  icon: string;
  subtitle?: string;
}

export interface SocialCard {
  platform: 'facebook' | 'twitter' | 'youtube' | 'linkedin';
  totalCount: string;
  label: string;
  changePercent: number;
  targetCount: string;
  targetProgress: number;
  todayCount: string;
  todayProgress: number;
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartWidget {
  title: string;
  type: 'area' | 'donut' | 'bar';
  categories: string[];
  series: ChartSeries[];
}

export interface CryptoTicker {
  symbol: string;
  name: string;
  price: string;
  change: number;
  volume: string;
  icon: string;
}

export interface DashboardState {
  statCards: StatCard[];
  socialCards: SocialCard[];
  revenueChart: ChartWidget;
  salesChart: ChartWidget;
  tickers: CryptoTicker[];
  loading: boolean;
  error: string | null;
}
