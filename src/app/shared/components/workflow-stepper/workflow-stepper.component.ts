import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export interface WorkflowStep {
  label: string;
  icon: string;
}

export type WorkflowStepState = 'done' | 'active' | 'pending';

/**
 * Shared workflow / progress stepper.
 *
 * Visual design is standardized on the dot + connector-line pattern used by
 * the Sample Collection page (`.proc-timeline`), so Registration, Test
 * Order and Billing all render the exact same stepper — same dot size,
 * spacing, connector style and typography — instead of each page shipping
 * its own bespoke markup/CSS (`.workflow-trail`, `.wf-step`, `.wf-line` …).
 *
 * Usage:
 *   <lis-workflow-stepper [steps]="workflowSteps" [activeIndex]="1" />
 */
@Component({
  selector: 'lis-workflow-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-stepper.component.html',
  styleUrl: './workflow-stepper.component.css',
})
export class WorkflowStepperComponent {
  /** Ordered list of steps to render. */
  readonly steps = input.required<WorkflowStep[]>();

  /** Index (0-based) of the step that is currently active/in-progress. */
  readonly activeIndex = input<number>(0);

  /** Compact sizing for tighter slots (e.g. the Billing page header). */
  readonly dense = input(false);

  /** Override the default aria-label when a page needs a more specific description. */
  readonly ariaLabel = input('Workflow steps');

  stepState(index: number): WorkflowStepState {
    const active = this.activeIndex();
    if (index < active) return 'done';
    if (index === active) return 'active';
    return 'pending';
  }
}
