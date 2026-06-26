import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { SampleStatus } from '../../models/lis.models';

@Component({
  selector: 'lis-status-pill',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './status-pill.component.html',
    styleUrl: './status-pill.component.css',
})
export class StatusPillComponent {
  readonly status = input.required<SampleStatus | 'stat'>();

  pillClass(): string {
    const map: Record<string, string> = {
      pending:    'pill-pending',
      processing: 'pill-process',
      ready:      'pill-ready',
      critical:   'pill-critical',
      stat:       'pill-stat',
      dispatched: 'pill-dispatched',
    };
    return map[this.status()] ?? 'pill-pending';
  }

  label(): string {
    const map: Record<string, string> = {
      pending:    'Pending',
      processing: 'Processing',
      ready:      'Ready',
      critical:   'Critical',
      stat:       'STAT',
      dispatched: 'Dispatched',
    };
    return map[this.status()] ?? this.status();
  }
}
