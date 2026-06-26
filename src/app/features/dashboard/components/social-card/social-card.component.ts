import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { SocialCard } from '../../models/dashboard.models';

interface PlatformConfig {
  color: string;
  bgClass: string;
  icon: string;
  label: string;
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  facebook: { color: '#1877f2', bgClass: 'plat-facebook', icon: 'brand-facebook', label: 'Facebook' },
  twitter:  { color: '#1da1f2', bgClass: 'plat-twitter',  icon: 'brand-x',        label: 'X (Twitter)' },
  youtube:  { color: '#ff0000', bgClass: 'plat-youtube',  icon: 'brand-youtube',  label: 'YouTube' },
  linkedin: { color: '#0a66c2', bgClass: 'plat-linkedin', icon: 'brand-linkedin', label: 'LinkedIn' },
};

@Component({
  selector: 'app-social-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './social-card.component.html',
    styleUrl: './social-card.component.css',
})
export class SocialCardComponent {
  readonly card = input.required<SocialCard>();
  protected Math = Math;
  platformCfg() { return PLATFORM_CONFIG[this.card().platform] ?? PLATFORM_CONFIG['facebook']; }
}
