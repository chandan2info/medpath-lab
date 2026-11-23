import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LabWorkflowMockService } from '../../core/services/lab-workflow-mock.service';

@Component({
  selector: 'app-result-validation',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './result-validation.component.html',
  styleUrl: './result-validation.component.css'
})
export class ResultValidationComponent {
  private readonly store = inject(LabWorkflowMockService);
  readonly queue = computed(() => this.store.results()
    .filter(result => result.status === 'awaiting-validation')
    .map(result => ({ result, sample: this.store.samples().find(sample => sample.id === result.sampleId) }))
    .filter(item => !!item.sample));
  readonly selectedId = signal<string | null>(null);
  readonly reviewNote = signal('');
  readonly notice = signal('');

  select(sampleId: string): void { this.selectedId.set(sampleId); this.reviewNote.set(''); this.notice.set(''); }

  approve(sampleId: string): void {
    try {
      this.store.reviewResults(sampleId, 'Demo Pathologist', true, this.reviewNote().trim());
      this.notice.set('Result approved. It is now eligible for report generation.');
      this.selectedId.set(null);
    } catch (error) { this.notice.set(error instanceof Error ? error.message : 'Unable to approve result.'); }
  }

  reject(sampleId: string): void {
    const note = this.reviewNote().trim();
    if (!note) { this.notice.set('Add a review note before rejecting results.'); return; }
    try {
      this.store.reviewResults(sampleId, 'Demo Pathologist', false, note);
      this.notice.set('Result returned for correction. The sample is marked rejected in the mock workflow.');
      this.selectedId.set(null);
    } catch (error) { this.notice.set(error instanceof Error ? error.message : 'Unable to reject result.'); }
  }

  generateReport(sampleId: string): void {
    try {
      const report = this.store.generateReport(sampleId);
      this.notice.set(`Report ${report.id} generated successfully from validated results.`);
    } catch (error) { this.notice.set(error instanceof Error ? error.message : 'Unable to generate report.'); }
  }
}
