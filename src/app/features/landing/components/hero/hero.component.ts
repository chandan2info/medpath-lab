import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero-section" aria-label="Hero">
      <!-- Background blobs -->
      <div class="blob blob-1" aria-hidden="true"></div>
      <div class="blob blob-2" aria-hidden="true"></div>
      <div class="blob blob-3" aria-hidden="true"></div>

      <div class="hero-inner">
        <!-- Left: Copy -->
        <div class="hero-copy">
          <div class="hero-eyebrow" aria-label="New feature announcement">
            <span class="eyebrow-dot" aria-hidden="true"></span>
            <span>New: AI Trading Signals v2.0</span>
            <a href="#features" class="eyebrow-link" aria-label="Learn more about AI Trading Signals">
              Learn more <i class="ti ti-arrow-right" aria-hidden="true"></i>
            </a>
          </div>

          <h1 class="hero-title">
            Trade Crypto<br/>
            <span class="hero-title-accent">with Confidence</span>
          </h1>

          <p class="hero-desc">
            Real-time analytics, AI-powered signals, and zero-commission trading — all in one platform built for serious traders.
          </p>

          <div class="hero-actions">
            <a routerLink="/dashboard" class="hero-btn-primary" aria-label="Start trading now">
              Start Trading Free
              <i class="ti ti-arrow-right" aria-hidden="true"></i>
            </a>
            <a href="#features" class="hero-btn-ghost">
              <i class="ti ti-play" aria-hidden="true"></i>
              Watch Demo
            </a>
          </div>

          <!-- Trust badges -->
          <div class="hero-trust" aria-label="Trust indicators">
            <div class="trust-item">
              <i class="ti ti-shield-check" aria-hidden="true"></i>
              <span>SOC 2 Certified</span>
            </div>
            <div class="trust-divider" aria-hidden="true"></div>
            <div class="trust-item">
              <i class="ti ti-lock" aria-hidden="true"></i>
              <span>Bank-Grade Security</span>
            </div>
            <div class="trust-divider" aria-hidden="true"></div>
            <div class="trust-item">
              <i class="ti ti-star" aria-hidden="true"></i>
              <span>4.9★ on Trustpilot</span>
            </div>
          </div>
        </div>

        <!-- Right: Visual -->
        <div class="hero-visual" aria-hidden="true">
          <!-- Floating alert card -->
          <div class="float-card float-tl animate-fade-up" style="animation-delay:0.3s">
            <div class="float-card-icon success">
              <i class="ti ti-trending-up"></i>
            </div>
            <div>
              <p class="float-card-label">BTC Signal</p>
              <p class="float-card-value success-text">Buy +12.4%</p>
            </div>
          </div>

          <!-- Main dashboard mockup -->
          <div class="dashboard-preview animate-fade-up">
            <!-- Mini topbar -->
            <div class="preview-topbar">
              <div class="preview-dots">
                <span></span><span></span><span></span>
              </div>
              <div class="preview-url">cryptoflow.app/dashboard</div>
            </div>
            <!-- Preview content -->
            <div class="preview-body">
              <!-- Mini stats row -->
              <div class="preview-stats">
                @for (stat of previewStats; track stat.label) {
                  <div class="preview-stat">
                    <p class="preview-stat-label">{{ stat.label }}</p>
                    <p class="preview-stat-val" [style.color]="stat.color">{{ stat.value }}</p>
                  </div>
                }
              </div>
              <!-- Mini chart lines -->
              <div class="preview-chart">
                <svg viewBox="0 0 340 80" fill="none" style="width:100%;height:100%">
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#CDB4DB" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#CDB4DB" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,65 C20,60 40,50 70,42 S110,28 140,22 S190,18 220,14 S270,8 340,4 L340,80 L0,80 Z"
                        fill="url(#heroGrad)"/>
                  <path d="M0,65 C20,60 40,50 70,42 S110,28 140,22 S190,18 220,14 S270,8 340,4"
                        stroke="#CDB4DB" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M0,72 C30,68 60,64 90,58 S140,50 180,46 S240,40 280,38 S310,36 340,34"
                        stroke="rgba(255,175,204,0.5)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4,3"/>
                </svg>
              </div>
              <!-- Mini ticker row -->
              <div class="preview-tickers">
                @for (t of previewTickers; track t.sym) {
                  <div class="preview-ticker">
                    <span class="preview-ticker-sym">{{ t.sym }}</span>
                    <span class="preview-ticker-chg" [class.up]="t.up" [class.dn]="!t.up">
                      {{ t.up ? '+' : '' }}{{ t.chg }}%
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Floating volume card -->
          <div class="float-card float-br animate-fade-up" style="animation-delay:0.5s">
            <div class="float-card-icon accent">
              <i class="ti ti-chart-bar"></i>
            </div>
            <div>
              <p class="float-card-label">24h Volume</p>
              <p class="float-card-value">$2.5B</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="hero-stats-bar" aria-label="Platform statistics">
        <div class="stats-bar-inner">
          @for (stat of stats; track stat.label) {
            <div class="hero-stat">
              <p class="hero-stat-value">{{ stat.value }}</p>
              <p class="hero-stat-label">{{ stat.label }}</p>
            </div>
            @if (!$last) {
              <div class="hero-stat-divider" aria-hidden="true"></div>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      position: relative; min-height: 100vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      background: linear-gradient(145deg, #0d0820 0%, #120d2a 50%, #0a0618 100%);
      color: #fff;
    }

    /* Blobs */
    .blob { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
    .blob-1 { top: 10%; left: -5%;  width: 500px; height: 500px; background: radial-gradient(circle, rgba(139,90,168,0.18) 0%, transparent 70%); animation: float 8s ease-in-out infinite; }
    .blob-2 { top: 30%; right: -8%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(205,180,219,0.10) 0%, transparent 70%); animation: float 10s ease-in-out infinite reverse; }
    .blob-3 { bottom: 10%; left: 30%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(189,224,254,0.07) 0%, transparent 70%); animation: float 7s 2s ease-in-out infinite; }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-18px); }
    }

    /* Inner layout */
    .hero-inner {
      flex: 1; max-width: 1200px; margin: 0 auto; padding: 120px 24px 60px;
      display: grid; grid-template-columns: 1fr 1fr;
      align-items: center; gap: 56px; position: relative; z-index: 1;
    }

    /* Eyebrow */
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(205,180,219,0.1); border: 1px solid rgba(205,180,219,0.2);
      border-radius: 999px; padding: 6px 14px 6px 10px;
      font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.8);
      margin-bottom: 24px; width: fit-content;
    }
    .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 6px var(--primary); flex-shrink: 0; }
    .eyebrow-link { color: var(--primary); font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 3px; font-size: 12px; }
    .eyebrow-link:hover { color: var(--primary-light); }

    /* Title */
    .hero-title {
      font-size: clamp(2.2rem, 5vw, 3.75rem);
      font-weight: 800; line-height: 1.1;
      letter-spacing: -1px; margin: 0 0 20px;
    }
    .hero-title-accent {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 60%, var(--accent) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-desc {
      font-size: 1.0625rem; color: rgba(255,255,255,0.65);
      max-width: 460px; margin-bottom: 32px; line-height: 1.75;
    }

    /* Actions */
    .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
    .hero-btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--primary-deeper); color: white;
      padding: 13px 24px; border-radius: 12px;
      font-size: 15px; font-weight: 700; text-decoration: none;
      box-shadow: 0 4px 20px rgba(138,107,168,0.45);
      transition: all 0.2s;
    }
    .hero-btn-primary:hover { filter: brightness(1.12); box-shadow: 0 8px 28px rgba(138,107,168,0.55); transform: translateY(-2px); }
    .hero-btn-ghost {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85);
      padding: 13px 24px; border-radius: 12px;
      border: 1.5px solid rgba(255,255,255,0.14);
      font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.2s;
    }
    .hero-btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); }

    /* Trust */
    .hero-trust { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .trust-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.55); }
    .trust-item i { font-size: 15px; color: var(--primary); }
    .trust-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.15); }

    /* Visual */
    .hero-visual { position: relative; }
    .animate-fade-up { animation: fadeUp 0.7s ease-out both; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

    /* Float cards */
    .float-card {
      position: absolute; z-index: 10;
      background: rgba(20,14,36,0.85); backdrop-filter: blur(12px);
      border: 1px solid rgba(205,180,219,0.2); border-radius: 14px;
      padding: 12px 16px; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .float-tl { top: 8px; left: -20px; }
    .float-br { bottom: 8px; right: -20px; }
    .float-card-icon {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .float-card-icon.success { background: rgba(16,185,129,0.15); color: #10b981; }
    .float-card-icon.accent  { background: rgba(189,224,254,0.15); color: #7ec8fd; }
    .float-card-label { font-size: 10px; color: rgba(255,255,255,0.5); margin: 0 0 2px; white-space: nowrap; }
    .float-card-value { font-size: 14px; font-weight: 700; color: #fff; margin: 0; white-space: nowrap; }
    .success-text { color: #10b981 !important; }

    /* Dashboard mockup */
    .dashboard-preview {
      background: rgba(18,12,32,0.9); backdrop-filter: blur(12px);
      border: 1px solid rgba(205,180,219,0.15); border-radius: 16px;
      overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    }
    .preview-topbar {
      background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 10px 14px; display: flex; align-items: center; gap: 12px;
    }
    .preview-dots { display: flex; gap: 5px; }
    .preview-dots span { width: 8px; height: 8px; border-radius: 50%; }
    .preview-dots span:nth-child(1) { background: #ff5f57; }
    .preview-dots span:nth-child(2) { background: #ffbd2e; }
    .preview-dots span:nth-child(3) { background: #28c840; }
    .preview-url { font-size: 10px; color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 6px; flex: 1; text-align: center; }

    .preview-body { padding: 14px; }
    .preview-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 14px; }
    .preview-stat { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.06); }
    .preview-stat-label { font-size: 9px; color: rgba(255,255,255,0.4); margin: 0 0 3px; }
    .preview-stat-val   { font-size: 13px; font-weight: 700; margin: 0; }

    .preview-chart { height: 80px; margin-bottom: 12px; }

    .preview-tickers { display: flex; gap: 6px; flex-wrap: wrap; }
    .preview-ticker { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 4px 8px; display: flex; gap: 6px; }
    .preview-ticker-sym { font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600; }
    .preview-ticker-chg { font-size: 10px; font-weight: 700; }
    .preview-ticker-chg.up { color: #10b981; }
    .preview-ticker-chg.dn { color: #ef4444; }

    /* Stats bar */
    .hero-stats-bar {
      position: relative; z-index: 1;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: rgba(0,0,0,0.2);
    }
    .stats-bar-inner {
      max-width: 1200px; margin: 0 auto; padding: 28px 24px;
      display: flex; align-items: center; justify-content: center;
      gap: 0; flex-wrap: wrap;
    }
    .hero-stat { text-align: center; padding: 0 40px; }
    .hero-stat-value { font-size: 1.875rem; font-weight: 800; margin: 0 0 4px; color: #fff; }
    .hero-stat-label { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }
    .hero-stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }

    /* Responsive */
    @media (max-width: 900px) {
      .hero-inner { grid-template-columns: 1fr; padding: 100px 24px 40px; gap: 40px; }
      .float-tl { top: -10px; left: -10px; }
      .float-br { bottom: -10px; right: -10px; }
      .hero-visual { width: 100%; }
    }
    @media (max-width: 600px) {
      .hero-inner { padding: 90px 16px 32px; }
      .hero-stat { padding: 0 20px; }
      .float-tl, .float-br { display: none; }
      .stats-bar-inner { gap: 8px; }
      .hero-stat-divider { display: none; }
      .hero-stat { padding: 8px 16px; }
    }
  `],
})
export class HeroComponent {
  protected stats = [
    { value: '$2.5B+', label: 'Trading Volume' },
    { value: '120K+',  label: 'Active Traders' },
    { value: '50+',    label: 'Global Markets' },
    { value: '99.9%',  label: 'Uptime SLA' },
  ];

  protected previewStats = [
    { label: 'Portfolio', value: '$8,432', color: '#fff' },
    { label: '24h P&L',  value: '+$312',  color: '#10b981' },
    { label: 'Open Pos.', value: '7',      color: '#fff' },
  ];

  protected previewTickers = [
    { sym: 'BTC', chg: '+2.3', up: true },
    { sym: 'ETH', chg: '-1.1', up: false },
    { sym: 'SOL', chg: '+5.6', up: true },
    { sym: 'BNB', chg: '+0.8', up: true },
  ];
}
