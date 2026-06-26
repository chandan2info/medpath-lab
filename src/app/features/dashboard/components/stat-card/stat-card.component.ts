import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { StatCard } from '../../models/dashboard.models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './stat-card.component.html',
    styleUrl: './stat-card.component.css',
})
export class StatCardComponent {
  readonly card = input.required<StatCard>();
  protected Math = Math;
}
