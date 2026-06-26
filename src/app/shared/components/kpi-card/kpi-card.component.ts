import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { KpiCard } from '../../models/lis.models';

@Component({
  selector: 'lis-kpi-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './kpi-card.component.html',
    styleUrl: './kpi-card.component.css',
})
export class KpiCardComponent {
  readonly card = input.required<KpiCard>();
}
