import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { SampleStatus } from '../../models/lis.models';

@Component({
  selector: 'lis-status-pill',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="lis-pill"
      [ngClass]="pillClass()"
      [attr.aria-label]="'Status: ' + status()"
    >
      {{ label() }}
    </span>
  `,
  styles: [`
    .lis-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 500;
      line-height: 1.6;
      white-space: nowrap;
    }
    .pill-pending  { background: var(--pill-pending-bg,  #FAEEDA); color: var(--pill-pending-color,  #633806); }
    .pill-process  { background: var(--pill-process-bg,  #E6F1FB); color: var(--pill-process-color,  #0C447C); }
    .pill-ready    { background: var(--pill-ready-bg,    #E1F5EE); color: var(--pill-ready-color,    #085041); }
    .pill-critical { background: var(--pill-critical-bg, #FCEBEB); color: var(--pill-critical-color, #791F1F); }
    .pill-stat     { background: var(--pill-stat-bg,     #E24B4A); color: var(--pill-stat-color,     #ffffff); }
    .pill-dispatched { background: #E1F5EE; color: #085041; }
  `],
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
