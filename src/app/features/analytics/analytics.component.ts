import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexYAxis,
  ApexStroke,
  ApexFill,
  ApexGrid,
  ApexTooltip,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { AnalyticsDataService } from './services/analytics-data.service';
import { DateRange } from './models/analytics.models';

interface RangeOption {
  id: DateRange;
  label: string;
}

const RANGE_OPTIONS: RangeOption[] = [
  { id: 'today',   label: 'Today' },
  { id: '7d',      label: '7 Days' },
  { id: '30d',     label: '30 Days' },
  { id: 'quarter', label: 'Quarter' },
];

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [NgClass, RouterLink, NgApexchartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css',
})
export class AnalyticsComponent {
  protected readonly data = inject(AnalyticsDataService);
  protected readonly rangeOptions = RANGE_OPTIONS;
  protected readonly Math = Math;

  activeRange(id: DateRange): boolean {
    return this.data.range() === id;
  }

  selectRange(id: DateRange): void {
    this.data.setRange(id);
  }

  selectDepartment(id: string | 'all'): void {
    this.data.setDepartmentFilter(id);
  }

  tatFlag(avg: number, target: number): 'over' | 'at' {
    return avg > target ? 'over' : 'at';
  }

  tatPct(avg: number, target: number): number {
    return Math.min(100, Math.round((avg / (target * 1.4)) * 100));
  }

  // ── Revenue / volume trend (area chart) ─────────────────────
  protected readonly trendSeries = computed<ApexAxisChartSeries>(() => {
    const t = this.data.trend();
    return [
      { name: 'Revenue (₹)', data: t.map(p => p.revenue) },
      { name: 'Samples',     data: t.map(p => p.volume) },
    ];
  });

  protected readonly trendCategories = computed<string[]>(() =>
    this.data.trend().map(p => p.label)
  );

  protected readonly trendChart: ApexChart = {
    type: 'area',
    height: 280,
    fontFamily: 'DM Sans, system-ui, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { speed: 350 },
  };
  protected readonly trendStroke: ApexStroke = { curve: 'smooth', width: [2.5, 2.5] };
  protected readonly trendFill: ApexFill = {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] },
  };
  protected readonly trendGrid: ApexGrid = {
    borderColor: 'var(--border-color)',
    strokeDashArray: 3,
    yaxis: { lines: { show: true } },
  };
  protected readonly trendDataLabels: ApexDataLabels = { enabled: false };
  protected readonly trendTooltip: ApexTooltip = { theme: 'light', shared: true };
  protected readonly trendColors = ['#3DC9A8', '#5367FE'];
  protected readonly trendLegend: ApexLegend = {
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '12px',
    markers: { width: 8, height: 8 },
  };
  protected readonly trendYaxis: ApexYAxis[] = [
    { title: { text: undefined }, labels: { style: { fontSize: '11px' } } },
  ];

  // ── Status breakdown (donut) ─────────────────────────────────
  protected readonly statusSeries = computed<ApexNonAxisChartSeries>(() =>
    this.data.statusBreakdown().map(s => s.count)
  );
  protected readonly statusLabels = computed<string[]>(() =>
    this.data.statusBreakdown().map(s => s.label)
  );
  protected readonly statusColors = computed<string[]>(() =>
    this.data.statusBreakdown().map(s => s.color)
  );
  protected readonly statusChart: ApexChart = {
    type: 'donut',
    height: 220,
    fontFamily: 'DM Sans, system-ui, sans-serif',
    animations: { speed: 350 },
  };
  protected readonly statusLegend: ApexLegend = { show: false };
  protected readonly statusDataLabels: ApexDataLabels = { enabled: false };
  protected readonly statusPlotOptions: ApexPlotOptions = {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          total: { show: true, label: 'Samples', fontSize: '11px' },
          value: { fontSize: '18px', fontWeight: 500 },
        },
      },
    },
  };
}
