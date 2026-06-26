import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.css',
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
