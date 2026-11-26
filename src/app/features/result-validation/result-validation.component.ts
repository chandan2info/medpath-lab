import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LabWorkflowMockService, MockResultRecord, MockLabSample } from '../../core/services/lab-workflow-mock.service';

type ValidationTab = 'pending' | 'validated' | 'returned';
interface ValidationItem {
  result: MockResultRecord;
  sample: MockLabSample;
  patient: ReturnType<LabWorkflowMockService['visits']>[number] | undefined;
  order: ReturnType<LabWorkflowMockService['orders']>[number] | undefined;
}

@Component({
  selector: 'app-result-validation',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './result-validation.component.html',
  styleUrl: './result-validation.component.css'
})
export class ResultValidationComponent {
  private readonly store = inject(LabWorkflowMockService);
  readonly activeTab = signal<ValidationTab>('pending');
  readonly searchTerm = signal('');
  readonly priorityFilter = signal('all');
  readonly selectedSampleId = signal<string | null>(null);
  readonly reviewNote = signal('');
  readonly notice = signal('');
  readonly noticeType = signal<'success' | 'error'>('success');
  readonly isReviewOpen = signal(false);

  readonly items = computed<ValidationItem[]>(() => {
    const visits = this.store.visits();
    const orders = this.store.orders();
    return this.store.results()
      .filter(result => result.status !== 'draft')
      .map(result => {
        const sample = this.store.samples().find(item => item.id === result.sampleId);
        if (!sample) return null;
        return {
          result,
          sample,
          patient: visits.find(visit => visit.id === sample.visitId),
          order: orders.find(order => order.id === sample.orderId)
        };
      })
      .filter((item): item is ValidationItem => item !== null)
      .sort((a, b) => {
        const priority = (value: string) => value === 'stat' ? 0 : value === 'urgent' ? 1 : 2;
        return priority(a.sample.priority) - priority(b.sample.priority)
          || b.result.updatedAt.localeCompare(a.result.updatedAt);
      });
  });

  readonly pendingItems = computed(() => this.items().filter(item => item.result.status === 'awaiting-validation'));
  readonly validatedItems = computed(() => this.items().filter(item => item.result.status === 'validated'));
  readonly returnedItems = computed(() => this.items().filter(item => item.result.status === 'rejected'));
  readonly pendingCount = computed(() => this.pendingItems().length);
  readonly urgentCount = computed(() => this.pendingItems().filter(item => item.sample.priority !== 'routine').length);
  readonly validatedCount = computed(() => this.validatedItems().length);
  readonly reportsReadyCount = computed(() => this.validatedItems().filter(item => !this.store.reports().some(report => report.sampleId === item.sample.id)).length);

  readonly visibleItems = computed(() => {
    const source = this.activeTab() === 'pending' ? this.pendingItems()
      : this.activeTab() === 'validated' ? this.validatedItems() : this.returnedItems();
    const term = this.searchTerm().trim().toLowerCase();
    return source.filter(item => {
      const matchesPriority = this.priorityFilter() === 'all' || item.sample.priority === this.priorityFilter();
      const matchesSearch = !term || [
        item.sample.patientName, item.sample.patientId, item.sample.id, item.sample.orderId,
        ...item.sample.testIds, ...Object.values(item.result.parameterLabels ?? {})
      ].join(' ').toLowerCase().includes(term);
      return matchesPriority && matchesSearch;
    });
  });

  readonly selectedItem = computed(() => this.items().find(item => item.sample.id === this.selectedSampleId()) ?? null);
  readonly resultRows = computed(() => {
    const result = this.selectedItem()?.result;
    if (!result) return [];
    return Object.entries(result.values).map(([key, value]) => ({
      key,
      label: result.parameterLabels?.[key] || this.formatParameter(key),
      value: value || '—'
    }));
  });

  setTab(tab: ValidationTab): void {
    this.activeTab.set(tab);
    this.selectedSampleId.set(null);
    this.isReviewOpen.set(false);
  }

  openReview(item: ValidationItem): void {
    this.selectedSampleId.set(item.sample.id);
    this.reviewNote.set(item.result.reviewNote ?? '');
    this.notice.set('');
    this.isReviewOpen.set(true);
  }

  closeReview(): void {
    this.isReviewOpen.set(false);
    this.selectedSampleId.set(null);
    this.reviewNote.set('');
  }

  approve(): void {
    const item = this.selectedItem();
    if (!item) return;
    try {
      this.store.reviewResults(item.sample.id, 'Demo Pathologist', true, this.reviewNote().trim());
      this.showNotice('Results approved. This sample is now eligible for report generation.', 'success');
      this.closeReview();
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : 'Unable to approve results.', 'error');
    }
  }

  reject(): void {
    const item = this.selectedItem();
    const note = this.reviewNote().trim();
    if (!item) return;
    if (!note) {
      this.showNotice('Add a correction note before returning these results.', 'error');
      return;
    }
    try {
      this.store.reviewResults(item.sample.id, 'Demo Pathologist', false, note);
      this.showNotice('Results returned to Result Entry for correction.', 'success');
      this.closeReview();
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : 'Unable to return results.', 'error');
    }
  }

  generateReport(sampleId: string): void {
    try {
      const report = this.store.generateReport(sampleId);
      this.showNotice(`Report ${report.id} generated successfully.`, 'success');
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : 'Unable to generate report.', 'error');
    }
  }

  hasReport(sampleId: string): boolean {
    return this.store.reports().some(report => report.sampleId === sampleId);
  }

  testNames(sample: MockLabSample): string {
    return sample.testIds.join(', ');
  }

  formatParameter(key: string): string {
    return key.split('.').map(part => part.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())).join(' · ');
  }

  private showNotice(message: string, type: 'success' | 'error'): void {
    this.notice.set(message);
    this.noticeType.set(type);
  }
}
