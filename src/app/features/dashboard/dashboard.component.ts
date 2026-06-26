import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { SocialCardComponent } from './components/social-card/social-card.component';
import { CryptoTicker } from './models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCardComponent, SocialCardComponent, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <nav aria-label="Breadcrumb">
          <ol class="breadcrumb">
            <li><a href="#">Home</a></li>
            <li aria-current="page">Overview</li>
          </ol>
        </nav>
      </div>
      <div class="page-header-actions">
        <button class="btn-icon" aria-label="Refresh data">
          <i class="ti ti-refresh" aria-hidden="true"></i>
        </button>
        <button class="btn-primary-sm" aria-label="Export report">
          <i class="ti ti-download" aria-hidden="true"></i>
          Export
        </button>
      </div>
    </div>

    <!-- Ticker Bar -->
    <div class="ticker-bar" role="region" aria-label="Crypto prices">
      <div class="ticker-scroll">
        @for (ticker of ds.tickers(); track ticker.symbol) {
          <div class="ticker-item">
            <span class="ticker-icon" aria-hidden="true">{{ ticker.icon }}</span>
            <span class="ticker-symbol">{{ ticker.symbol }}</span>
            <span class="ticker-price">{{ ticker.price }}</span>
            <span
              class="ticker-change"
              [ngClass]="ticker.change >= 0 ? 'tick-up' : 'tick-down'"
              [attr.aria-label]="ticker.change >= 0 ? 'Up ' : 'Down ' + Math.abs(ticker.change) + '%'"
            >
              <i class="ti ti-{{ ticker.change >= 0 ? 'caret-up' : 'caret-down' }}" aria-hidden="true"></i>
              {{ ticker.change >= 0 ? '+' : '' }}{{ ticker.change }}%
            </span>
          </div>
        }
      </div>
    </div>

    <!-- Stat Cards Grid -->
    <section aria-label="Key statistics" class="dashboard-section">
      <div class="stat-cards-grid">
        @for (card of ds.statCards(); track card.id) {
          <app-stat-card [card]="card" />
        }
      </div>
    </section>

    <!-- Middle Row: Revenue Chart + Sales Distribution -->
    <section aria-label="Charts" class="dashboard-section">
      <div class="charts-grid">
        <!-- Revenue Chart -->
        <div class="card chart-card chart-card-lg">
          <div class="card-header">
            <div>
              <h2 class="card-title">{{ ds.revenueChart().title }}</h2>
              <p class="card-subtitle">Income vs Expense over 12 months</p>
            </div>
            <div class="chart-legend" aria-hidden="true">
              @for (s of ds.revenueChart().series; track s.name) {
                <div class="legend-item">
                  <span class="legend-dot" [ngClass]="'dot-' + $index"></span>
                  {{ s.name }}
                </div>
              }
            </div>
          </div>
          <div class="card-body">
            <!-- Inline SVG area chart (no external dep needed) -->
            <div class="chart-area-placeholder" aria-label="Revenue chart: Income peaks at 99 in December, Expense follows similar trend">
              <svg viewBox="0 0 680 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" style="width:100%;height:100%">
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--secondary)" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="var(--secondary)" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <!-- Grid lines -->
                <line x1="0" y1="40"  x2="680" y2="40"  stroke="var(--border)" stroke-dasharray="4,4"/>
                <line x1="0" y1="80"  x2="680" y2="80"  stroke="var(--border)" stroke-dasharray="4,4"/>
                <line x1="0" y1="120" x2="680" y2="120" stroke="var(--border)" stroke-dasharray="4,4"/>
                <line x1="0" y1="160" x2="680" y2="160" stroke="var(--border)" stroke-dasharray="4,4"/>
                <!-- Income area: data [35,45,38,52,61,49,70,91,83,75,88,99] mapped to 0-200 -->
                <path d="M0,130 L56,120 L113,124 L169,110 L226,99 L282,109 L339,86 L395,56 L452,66 L508,75 L565,61 L680,40
                         L680,200 L0,200 Z" fill="url(#incomeGrad)"/>
                <path d="M0,130 L56,120 L113,124 L169,110 L226,99 L282,109 L339,86 L395,56 L452,66 L508,75 L565,61 L680,40"
                      stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Expense area: data [22,31,27,34,40,37,52,60,55,48,61,72] -->
                <path d="M0,156 L56,144 L113,150 L169,140 L226,132 L282,136 L339,116 L395,104 L452,110 L508,120 L565,101 L680,79
                         L680,200 L0,200 Z" fill="url(#expGrad)"/>
                <path d="M0,156 L56,144 L113,150 L169,140 L226,132 L282,136 L339,116 L395,104 L452,110 L508,120 L565,101 L680,79"
                      stroke="var(--secondary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- X-axis labels -->
                <text x="0"   y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Jan</text>
                <text x="56"  y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Feb</text>
                <text x="113" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Mar</text>
                <text x="169" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Apr</text>
                <text x="226" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">May</text>
                <text x="282" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Jun</text>
                <text x="339" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Jul</text>
                <text x="395" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Aug</text>
                <text x="452" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Sep</text>
                <text x="508" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Oct</text>
                <text x="565" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Nov</text>
                <text x="680" y="195" font-size="9" fill="var(--text-muted)" text-anchor="middle">Dec</text>
              </svg>
            </div>
          </div>
        </div>

        <!-- Sales Donut -->
        <div class="card chart-card chart-card-sm">
          <div class="card-header">
            <div>
              <h2 class="card-title">{{ ds.salesChart().title }}</h2>
              <p class="card-subtitle">Allocation by asset</p>
            </div>
          </div>
          <div class="card-body donut-body">
            <!-- SVG Donut -->
            <div class="donut-wrap" aria-label="Sales distribution: BTC 44%, ETH 26%, USDT 18%, Others 12%">
              <svg viewBox="0 0 160 160" style="width:140px;height:140px" role="img" aria-hidden="true">
                <!-- BTC 44% → 158.4deg -->
                <circle cx="80" cy="80" r="60" fill="none" stroke="var(--primary)" stroke-width="22"
                        stroke-dasharray="166 377" stroke-dashoffset="94" transform="rotate(-90 80 80)"/>
                <!-- ETH 26% → 93.6deg -->
                <circle cx="80" cy="80" r="60" fill="none" stroke="var(--secondary)" stroke-width="22"
                        stroke-dasharray="98 377" stroke-dashoffset="-72" transform="rotate(-90 80 80)"/>
                <!-- USDT 18% → 64.8deg -->
                <circle cx="80" cy="80" r="60" fill="none" stroke="var(--accent-dark)" stroke-width="22"
                        stroke-dasharray="68 377" stroke-dashoffset="-170" transform="rotate(-90 80 80)"/>
                <!-- Others 12% → 43.2deg -->
                <circle cx="80" cy="80" r="60" fill="none" stroke="var(--border-strong)" stroke-width="22"
                        stroke-dasharray="45 377" stroke-dashoffset="-238" transform="rotate(-90 80 80)"/>
                <text x="80" y="76" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text-base)">$8.6K</text>
                <text x="80" y="92" text-anchor="middle" font-size="9" fill="var(--text-muted)">Total</text>
              </svg>
            </div>
            <!-- Legend -->
            <div class="donut-legend" role="list">
              @for (cat of ds.salesChart().categories; track cat; let i = $index) {
                <div class="donut-legend-item" role="listitem">
                  <span class="donut-dot" [ngClass]="'donut-dot-' + i" aria-hidden="true"></span>
                  <span class="donut-legend-label">{{ cat }}</span>
                  <span class="donut-legend-val">{{ ds.salesChart().series[0].data[i] }}%</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Cards -->
    <section aria-label="Social media statistics" class="dashboard-section">
      <div class="section-title-row">
        <h2 class="section-title">Social Overview</h2>
      </div>
      <div class="social-cards-grid">
        @for (card of ds.socialCards(); track card.platform) {
          <app-social-card [card]="card" />
        }
      </div>
    </section>

    <!-- Crypto Market Table -->
    <section aria-label="Cryptocurrency market" class="dashboard-section">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Market Overview</h2>
            <p class="card-subtitle">Top cryptocurrencies by volume</p>
          </div>
          <button class="btn-primary-sm">View All</button>
        </div>
        <div class="card-body table-wrap">
          <table class="market-table" role="table" aria-label="Cryptocurrency market data">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Asset</th>
                <th scope="col">Price</th>
                <th scope="col">24h Change</th>
                <th scope="col" class="hide-sm">Volume</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (ticker of ds.tickers(); track ticker.symbol; let i = $index) {
                <tr>
                  <td class="rank-cell">{{ i + 1 }}</td>
                  <td>
                    <div class="asset-cell">
                      <div class="asset-icon" aria-hidden="true">{{ ticker.icon }}</div>
                      <div>
                        <p class="asset-name">{{ ticker.name }}</p>
                        <p class="asset-symbol">{{ ticker.symbol }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="price-cell">{{ ticker.price }}</td>
                  <td>
                    <span
                      class="change-badge"
                      [ngClass]="ticker.change >= 0 ? 'change-pos' : 'change-neg'"
                    >
                      <i class="ti ti-{{ ticker.change >= 0 ? 'arrow-up-right' : 'arrow-down-right' }}" aria-hidden="true"></i>
                      {{ ticker.change >= 0 ? '+' : '' }}{{ ticker.change }}%
                    </span>
                  </td>
                  <td class="hide-sm volume-cell">{{ ticker.volume }}</td>
                  <td>
                    <button class="trade-btn" [attr.aria-label]="'Trade ' + ticker.name">Trade</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    /* Page header */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
    }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text-base); margin: 0 0 4px; }
    .breadcrumb { display: flex; list-style: none; padding: 0; margin: 0; gap: 6px; font-size: 13px; color: var(--text-muted); }
    .breadcrumb li + li::before { content: '/'; margin-right: 6px; color: var(--border-strong); }
    .breadcrumb a { color: var(--text-muted); text-decoration: none; }
    .breadcrumb a:hover { color: var(--primary-deeper); }
    .page-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    .btn-icon {
      width: 36px; height: 36px;
      border: 1.5px solid var(--border-strong);
      background: var(--bg-surface);
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); cursor: pointer;
      transition: var(--transition-fast); font-size: 16px;
    }
    .btn-icon:hover { border-color: var(--primary); color: var(--primary-deeper); background: var(--primary-xlight); }

    .btn-primary-sm {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--primary-deeper); color: white;
      border: none; border-radius: var(--radius-md);
      padding: 8px 14px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: var(--transition-fast);
      font-family: var(--font-sans);
    }
    .btn-primary-sm:hover { filter: brightness(1.1); box-shadow: var(--shadow-btn); }
    .btn-primary-sm i { font-size: 14px; }

    /* Ticker bar */
    .ticker-bar {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden; margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
    }
    .ticker-scroll {
      display: flex; align-items: center;
      overflow-x: auto; gap: 0;
      scrollbar-width: none;
    }
    .ticker-scroll::-webkit-scrollbar { display: none; }
    .ticker-item {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 18px; white-space: nowrap;
      border-right: 1px solid var(--border);
      flex-shrink: 0; transition: background var(--transition-fast);
    }
    .ticker-item:hover { background: var(--bg-surface-alt); }
    .ticker-item:last-child { border-right: none; }
    .ticker-icon { font-size: 16px; }
    .ticker-symbol { font-size: 12px; font-weight: 700; color: var(--text-base); }
    .ticker-price  { font-size: 13px; font-weight: 600; color: var(--text-base); }
    .ticker-change { font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 2px; }
    .tick-up   { color: var(--color-success); }
    .tick-down { color: var(--color-danger); }

    /* Section */
    .dashboard-section { margin-bottom: 24px; }
    .section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .section-title { font-size: 16px; font-weight: 700; color: var(--text-base); margin: 0; }

    /* Stat cards */
    .stat-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px) { .stat-cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .stat-cards-grid { grid-template-columns: 1fr; } }

    /* Charts */
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 16px;
    }
    @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }

    .chart-card .card-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 12px;
      flex-wrap: wrap;
    }
    .card-title    { font-size: 15px; font-weight: 700; color: var(--text-base); margin: 0 0 2px; }
    .card-subtitle { font-size: 12px; color: var(--text-muted); margin: 0; }

    .chart-legend { display: flex; gap: 14px; flex-wrap: wrap; }
    .legend-item  { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
    .legend-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot-0 { background: var(--primary); }
    .dot-1 { background: var(--secondary); }

    .chart-area-placeholder { width: 100%; height: 200px; }

    /* Donut */
    .donut-body { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center; }
    .donut-wrap { flex-shrink: 0; }
    .donut-legend { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 100px; }
    .donut-legend-item { display: flex; align-items: center; gap: 8px; }
    .donut-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .donut-dot-0 { background: var(--primary); }
    .donut-dot-1 { background: var(--secondary); }
    .donut-dot-2 { background: var(--accent-dark); }
    .donut-dot-3 { background: var(--border-strong); }
    .donut-legend-label { font-size: 13px; color: var(--text-muted); flex: 1; }
    .donut-legend-val   { font-size: 13px; font-weight: 700; color: var(--text-base); }

    /* Social cards */
    .social-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 1100px) { .social-cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px)  { .social-cards-grid { grid-template-columns: 1fr; } }

    /* Market table */
    .table-wrap { overflow-x: auto; }
    .market-table { width: 100%; border-collapse: collapse; min-width: 480px; }
    .market-table th {
      font-size: 11px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      padding: 10px 12px; text-align: left;
      border-bottom: 1.5px solid var(--border);
      white-space: nowrap;
    }
    .market-table td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .market-table tbody tr { transition: background var(--transition-fast); }
    .market-table tbody tr:hover { background: var(--bg-surface-alt); }
    .market-table tbody tr:last-child td { border-bottom: none; }

    .rank-cell { font-size: 13px; color: var(--text-muted); font-weight: 500; width: 40px; }
    .asset-cell { display: flex; align-items: center; gap: 10px; }
    .asset-icon {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--primary-light); display: flex;
      align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; color: var(--primary-deeper);
      flex-shrink: 0;
    }
    .asset-name   { font-size: 13px; font-weight: 600; color: var(--text-base); margin: 0 0 2px; }
    .asset-symbol { font-size: 11px; color: var(--text-muted); margin: 0; }
    .price-cell   { font-size: 14px; font-weight: 600; color: var(--text-base); white-space: nowrap; }
    .volume-cell  { font-size: 13px; color: var(--text-muted); white-space: nowrap; }

    .change-badge {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 12px; font-weight: 700;
      padding: 4px 8px; border-radius: var(--radius-sm);
      white-space: nowrap;
    }
    .change-pos { background: rgba(16,185,129,0.12); color: var(--color-success); }
    .change-neg { background: rgba(239,68,68,0.12);  color: var(--color-danger); }

    .trade-btn {
      background: var(--primary-xlight); color: var(--primary-deeper);
      border: 1.5px solid var(--primary-light);
      border-radius: var(--radius-md); padding: 6px 14px;
      font-size: 12px; font-weight: 700; cursor: pointer;
      font-family: var(--font-sans); transition: var(--transition-fast);
      white-space: nowrap;
    }
    .trade-btn:hover {
      background: var(--primary-deeper); color: white;
      border-color: var(--primary-deeper);
    }

    .hide-sm { }
    @media (max-width: 640px) { .hide-sm { display: none; } }
  `],
})
export class DashboardComponent {
  protected readonly ds = inject(DashboardService);
  protected Math = Math;
}
