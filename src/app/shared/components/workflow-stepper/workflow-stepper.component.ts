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

  /**
   * Per-step accent colors, cycled by index. Gives each stage of the
   * trail its own identity (instead of one flat teal) while the
   * connector track (see template + CSS) stitches them into a single
   * unbroken multi-color line — so the trail always reads as
   * *connected* rather than a row of separate, floating dots.
   */
  private readonly palette: readonly string[] = [
    '#1D9E75', // teal — brand primary
    '#5367FE', // indigo — brand secondary
    '#8B5CF6', // violet
    '#F59E0B', // amber
    '#EC4899', // pink
    '#06B6D4', // cyan
  ];

  stepColor(index: number): string {
    return this.palette[index % this.palette.length];
  }

  stepState(index: number): WorkflowStepState {
    const active = this.activeIndex();
    if (index < active) return 'done';
    if (index === active) return 'active';
    return 'pending';
  }

  /** % of the track (dot-center to dot-center) that's been completed. */
  progressPct(): number {
    const total = this.steps().length;
    if (total < 2) return 0;
    const active = Math.min(Math.max(this.activeIndex(), 0), total - 1);
    return (active / (total - 1)) * 100;
  }

  /** Full-length multi-color gradient underlying the connector track. */
  trackGradient(): string {
    const colors = this.steps().map((_, i) => this.stepColor(i));
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }
}
