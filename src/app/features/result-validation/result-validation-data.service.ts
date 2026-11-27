import { Injectable, computed, inject } from '@angular/core';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';

/**
 * Result-validation data boundary.
 * This adapter uses the offline workflow repository today. When the API is
 * available, replace this adapter with HTTP-backed methods while keeping the
 * validation page and review workflow unchanged.
 */
@Injectable({ providedIn: 'root' })
export class ResultValidationDataService {
  private readonly repository = inject(LabWorkflowMockService);

  readonly visits = computed(() => this.repository.visits());
  readonly orders = computed(() => this.repository.orders());
  readonly samples = computed(() => this.repository.samples());
  readonly results = computed(() => this.repository.results());
  readonly reports = computed(() => this.repository.reports());

  approve(sampleId: string, reviewer: string, note = ''): void {
    this.repository.reviewResults(sampleId, reviewer, true, note);
  }

  returnForCorrection(sampleId: string, reviewer: string, note: string): void {
    this.repository.reviewResults(sampleId, reviewer, false, note);
  }

  generateReport(sampleId: string) {
    return this.repository.generateReport(sampleId);
  }
}
