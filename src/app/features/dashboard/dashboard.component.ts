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
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected readonly ds = inject(DashboardService);
  protected Math = Math;
}
