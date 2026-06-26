import { Component, ChangeDetectionStrategy } from '@angular/core';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const FEATURES: Feature[] = [
  { icon: 'bolt',          color: 'feat-purple', title: 'Real-Time Analytics',   description: 'Live market data with sub-50ms latency. Advanced charting tools track your portfolio across all positions instantly.' },
  { icon: 'shield-check',  color: 'feat-blue',   title: 'Bank-Grade Security',   description: 'Multi-factor authentication, cold storage, and 256-bit AES encryption protect every asset in your portfolio.' },
  { icon: 'robot',         color: 'feat-green',  title: 'AI Trading Signals',    description: 'Our ML algorithms analyse 200+ market indicators to surface high-confidence, actionable trade signals daily.' },
  { icon: 'chart-pie',     color: 'feat-pink',   title: 'Portfolio Dashboard',   description: 'Unified view of all your positions, P&L, risk exposure, and performance benchmarks in one clean interface.' },
  { icon: 'world',         color: 'feat-orange', title: '50+ Global Markets',    description: 'Access hundreds of crypto pairs across all major exchanges — Binance, Coinbase, Kraken — from one account.' },
  { icon: 'file-text',     color: 'feat-teal',   title: 'Compliance Toolkit',    description: 'Built-in KYC/AML tools, tax reporting, and audit trails keep you compliant in all supported jurisdictions.' },
];

@Component({
  selector: 'app-landing-features',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="features" class="features-section" aria-label="Platform features">
      <div class="section-inner">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Why CryptoFlow</span>
          <h2 class="section-title">
            Everything you need to<br/>
            <span class="title-accent">trade with confidence</span>
          </h2>
          <p class="section-desc">
            CryptoFlow gives you the edge with advanced tools designed for both beginners exploring the market and professional traders who demand precision.
          </p>
        </div>

        <!-- Features grid -->
        <div class="features-grid" role="list">
          @for (f of features; track f.title) {
            <article class="feature-card" role="listitem" [attr.aria-label]="f.title">
              <div class="feature-icon-wrap {{ f.color }}" aria-hidden="true">
                <i class="ti ti-{{ f.icon }}"></i>
              </div>
              <h3 class="feature-title">{{ f.title }}</h3>
              <p class="feature-desc">{{ f.description }}</p>
              <a href="#" class="feature-link" [attr.aria-label]="'Learn more about ' + f.title">
                Learn more <i class="ti ti-arrow-right" aria-hidden="true"></i>
              </a>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .features-section {
      padding: 96px 0;
      background: linear-gradient(175deg, #0d0820 0%, #0f0b22 60%, #0d0820 100%);
      color: #fff;
      position: relative; overflow: hidden;
    }
    .features-section::before {
      content: ''; position: absolute;
      top: 0; left: 50%; transform: translateX(-50%);
      width: 800px; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(205,180,219,0.3), transparent);
    }

    .section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    .section-header { text-align: center; margin-bottom: 64px; }
    .section-eyebrow {
      display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: var(--primary);
      background: rgba(205,180,219,0.1); border: 1px solid rgba(205,180,219,0.2);
      padding: 5px 14px; border-radius: 999px; margin-bottom: 16px;
    }
    .section-title {
      font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800;
      line-height: 1.15; letter-spacing: -0.5px; margin: 0 0 16px;
    }
    .title-accent {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .section-desc {
      color: rgba(255,255,255,0.6); font-size: 1.0625rem;
      max-width: 560px; margin: 0 auto; line-height: 1.7;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .feature-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 28px;
      transition: all 0.25s ease;
      position: relative; overflow: hidden;
    }
    .feature-card::before {
      content: ''; position: absolute;
      top: 0; left: 0; right: 0; height: 2px;
      opacity: 0; transition: opacity 0.25s;
    }
    .feature-card:hover {
      background: rgba(255,255,255,0.06);
      border-color: rgba(205,180,219,0.2);
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }
    .feature-card:hover::before { opacity: 1; }

    .feature-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; margin-bottom: 18px; transition: transform 0.2s;
    }
    .feature-card:hover .feature-icon-wrap { transform: scale(1.08); }

    /* Colour variants */
    .feat-purple { background: rgba(139,107,168,0.2); color: var(--primary); }
    .feat-blue   { background: rgba(189,224,254,0.15); color: var(--accent); }
    .feat-green  { background: rgba(16,185,129,0.15); color: #10b981; }
    .feat-pink   { background: rgba(255,175,204,0.15); color: var(--secondary); }
    .feat-orange { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .feat-teal   { background: rgba(20,184,166,0.15); color: #14b8a6; }

    .feature-title { font-size: 1.0625rem; font-weight: 700; margin: 0 0 10px; }
    .feature-desc  { font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.65; margin: 0 0 16px; }
    .feature-link  {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 13px; font-weight: 600; color: var(--primary);
      text-decoration: none; transition: gap 0.15s;
    }
    .feature-link:hover { gap: 8px; }
    .feature-link i { font-size: 13px; }

    @media (max-width: 960px)  { .features-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px)  { .features-grid { grid-template-columns: 1fr; } }
    @media (max-width: 480px)  { .features-section { padding: 64px 0; } .section-inner { padding: 0 16px; } }
  `],
})
export class FeaturesSectionComponent {
  protected features = FEATURES;
}
