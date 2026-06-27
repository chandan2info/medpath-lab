import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { DashboardDataService } from '../../core/services/dashboard-data.service';

@Component({
  selector: 'app-lis-home',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lis-home.component.html',
  styleUrl: './lis-home.component.css',
})
export class LisHomeComponent {
  protected readonly dash = inject(DashboardDataService);

  protected today = signal(
    new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  );

  alertDotClass(level: 'red' | 'amber' | 'teal'): string {
    return `alert-dot alert-dot--${level}`;
  }
}
