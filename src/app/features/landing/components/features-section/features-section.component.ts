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
    templateUrl: './features-section.component.html',
    styleUrl: './features-section.component.css',
})
export class FeaturesSectionComponent {
  protected features = FEATURES;
}
