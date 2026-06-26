import { Injectable, signal, computed } from '@angular/core';
import { DashboardState, StatCard, SocialCard, ChartWidget, CryptoTicker } from '../models/dashboard.models';

const STAT_CARDS: StatCard[] = [
  {
    id: 'daily-sales',
    title: 'Daily Volume',
    value: '$249.95K',
    changePercent: 7.2,
    trend: 'up',
    progressValue: 75,
    colorVariant: 'primary',
    icon: 'trending-up',
    subtitle: 'vs yesterday',
  },
  {
    id: 'monthly-sales',
    title: 'Monthly P&L',
    value: '$2,942.32',
    changePercent: -3.4,
    trend: 'down',
    progressValue: 35,
    colorVariant: 'danger',
    icon: 'trending-down',
    subtitle: 'vs last month',
  },
  {
    id: 'yearly-sales',
    title: 'Total Assets',
    value: '$8,638.32',
    changePercent: 12.1,
    trend: 'up',
    progressValue: 80,
    colorVariant: 'accent',
    icon: 'wallet',
    subtitle: 'portfolio value',
  },
];

const SOCIAL_CARDS: SocialCard[] = [
  {
    platform: 'facebook',
    totalCount: '12,281',
    label: 'Total Likes',
    changePercent: 7.2,
    targetCount: '35,098',
    targetProgress: 60,
    todayCount: '3,506',
    todayProgress: 35,
  },
  {
    platform: 'twitter',
    totalCount: '8,490',
    label: 'Total Follows',
    changePercent: -2.1,
    targetCount: '20,000',
    targetProgress: 42,
    todayCount: '1,200',
    todayProgress: 50,
  },
  {
    platform: 'youtube',
    totalCount: '5,920',
    label: 'Subscribers',
    changePercent: 4.8,
    targetCount: '15,000',
    targetProgress: 39,
    todayCount: '840',
    todayProgress: 28,
  },
  {
    platform: 'linkedin',
    totalCount: '3,270',
    label: 'Connections',
    changePercent: 1.3,
    targetCount: '10,000',
    targetProgress: 33,
    todayCount: '120',
    todayProgress: 12,
  },
];

const REVENUE_CHART: ChartWidget = {
  title: 'Revenue Overview',
  type: 'area',
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    { name: 'Income',  data: [35, 45, 38, 52, 61, 49, 70, 91, 83, 75, 88, 99] },
    { name: 'Expense', data: [22, 31, 27, 34, 40, 37, 52, 60, 55, 48, 61, 72] },
  ],
};

const SALES_CHART: ChartWidget = {
  title: 'Sales Distribution',
  type: 'donut',
  categories: ['BTC', 'ETH', 'USDT', 'Others'],
  series: [{ name: 'Volume', data: [44, 26, 18, 12] }],
};

const TICKERS: CryptoTicker[] = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: '$43,215.80', change: 2.34,  volume: '$28.4B', icon: '₿' },
  { symbol: 'ETH',  name: 'Ethereum', price: '$2,681.20',  change: -1.12, volume: '$14.2B', icon: 'Ξ' },
  { symbol: 'SOL',  name: 'Solana',   price: '$98.45',     change: 5.67,  volume: '$4.1B',  icon: '◎' },
  { symbol: 'BNB',  name: 'BNB',      price: '$312.70',    change: 0.89,  volume: '$2.8B',  icon: 'B' },
  { symbol: 'AVAX', name: 'Avalanche',price: '$36.12',     change: -3.45, volume: '$1.2B',  icon: 'A' },
  { symbol: 'MATIC',name: 'Polygon',  price: '$0.8843',    change: 1.23,  volume: '$0.9B',  icon: 'M' },
];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly _state = signal<DashboardState>({
    statCards: STAT_CARDS,
    socialCards: SOCIAL_CARDS,
    revenueChart: REVENUE_CHART,
    salesChart: SALES_CHART,
    tickers: TICKERS,
    loading: false,
    error: null,
  });

  readonly statCards    = computed(() => this._state().statCards);
  readonly socialCards  = computed(() => this._state().socialCards);
  readonly revenueChart = computed(() => this._state().revenueChart);
  readonly salesChart   = computed(() => this._state().salesChart);
  readonly tickers      = computed(() => this._state().tickers);
  readonly loading      = computed(() => this._state().loading);
  readonly error        = computed(() => this._state().error);
}
