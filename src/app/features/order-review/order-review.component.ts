import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { WorkflowStepperComponent, WorkflowStep } from '../../shared/components/workflow-stepper/workflow-stepper.component';

interface SpecimenGroup {
  key: string;
  tubeType: string;
  sampleType: string;
  tests: { id: string; name: string }[];
}

@Component({
  selector: 'app-order-review',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, WorkflowStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-review.component.html',
  styleUrl: './order-review.component.css',
})
export class OrderReviewComponent implements OnInit {
  protected readonly flow = inject(PatientFlowService);
  private readonly router = inject(Router);

  protected readonly workflowSteps: WorkflowStep[] = [
    { label: 'Register', icon: 'ti-user-plus' },
    { label: 'Test Order', icon: 'ti-test-pipe' },
    { label: 'Billing', icon: 'ti-receipt' },
    { label: 'Sample', icon: 'ti-droplet' },
  ];
  protected readonly workflowActiveIndex = 1;
  protected readonly priorities = [
    { id: 'routine' as const, label: 'Routine', description: 'Normal queue', icon: 'ti-list-check' },
    { id: 'urgent' as const, label: 'Urgent', description: 'Priority queue', icon: 'ti-clock-bolt' },
    { id: 'stat' as const, label: 'STAT', description: 'Immediate processing', icon: 'ti-bolt' },
  ];

  protected readonly specimenGroups = computed<SpecimenGroup[]>(() => {
    const groups = new Map<string, SpecimenGroup>();
    for (const test of this.flow.selectedTests()) {
      const key = `${test.tubeType}::${test.sampleType}`;
      const group = groups.get(key) ?? {
        key, tubeType: test.tubeType, sampleType: test.sampleType, tests: [],
      };
      group.tests.push({ id: test.id, name: test.name });
      groups.set(key, group);
    }
    return [...groups.values()];
  });

  protected readonly preparationNotes = computed(() => {
    const seen = new Set<string>();
    return this.flow.selectedTests()
      .filter(test => test.prep && test.prep !== 'None' && !seen.has(test.prep) && !!seen.add(test.prep))
      .map(test => ({ testName: test.name, instruction: test.prep }));
  });

  ngOnInit(): void {
    if (!this.flow.patient()) {
      this.router.navigate(['/dashboard/registration']);
    } else if (this.flow.selectedTests().length === 0) {
      this.router.navigate(['/dashboard/test-order']);
    }
  }

  protected get patient() { return this.flow.patient(); }

  protected patientInitials(): string {
    const p = this.patient;
    return p ? (p.firstName[0] + p.lastName[0]).toUpperCase() : '?';
  }

  protected backToSelection(): void {
    this.router.navigate(['/dashboard/test-order']);
  }

  protected continueToBilling(): void {
    if (this.flow.selectedTests().length) this.router.navigate(['/dashboard/billing']);
  }

  protected formatCurrency(value: number): string {
    return value.toLocaleString('en-IN');
  }
}
