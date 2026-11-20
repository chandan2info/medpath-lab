// Test selection page. Each catalogue tab switches the content shown in the list.
import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { LabTest, TestPackage } from '../../shared/models/lis.models';
import { WorkflowStepperComponent, WorkflowStep } from '../../shared/components/workflow-stepper/workflow-stepper.component';

type CatalogueView = 'catalogue' | 'packages' | 'recent' | 'favorites';

@Component({
  selector: 'app-test-order',
  standalone: true,
  imports: [RouterLink, FormsModule, TitleCasePipe, DatePipe, WorkflowStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './test-order.component.html',
  styleUrl: './test-order.component.css'
})
export class TestOrderComponent implements OnInit {
  protected readonly flow = inject(PatientFlowService);
  private readonly router = inject(Router);
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  protected readonly workflowSteps: WorkflowStep[] = [
    { label: 'Register', icon: 'ti-user-plus' },
    { label: 'Test Order', icon: 'ti-test-pipe' },
    { label: 'Review Order', icon: 'ti-clipboard-check' },
    { label: 'Billing', icon: 'ti-receipt' }
  ];
  protected readonly workflowActiveIndex = 1;

  activeView = signal<CatalogueView>('catalogue');
  testQuery = signal('');
  activeCategory = signal('All');
  savingDraft = signal(false);
  draftSaved = signal(false);
  feedbackMessage = signal('');
  feedbackKind = signal<'warning' | 'success' | 'error'>('warning');
  draftsOpen = signal(false);
  autoSaveState = signal<'idle' | 'saved' | 'error'>('idle');
  highlightedIndex = signal(-1);

  filteredTests = computed(() => {
    const q = this.testQuery().trim().toLowerCase();
    const category = this.activeCategory();
    return this.flow.allTests.filter(test =>
      (category === 'All' || test.category === category) &&
      this.matchesTest(test, q)
    );
  });

  filteredPackages = computed(() => {
    const q = this.testQuery().trim().toLowerCase();
    return this.flow.testPackages.filter(pkg =>
      !q || pkg.name.toLowerCase().includes(q) ||
      pkg.id.toLowerCase().includes(q) ||
      pkg.testIds.some(id => {
        const test = this.flow.allTests.find(item => item.id === id);
        return id.toLowerCase().includes(q) || !!test?.name.toLowerCase().includes(q);
      })
    );
  });

  visibleTests = computed(() => {
    const view = this.activeView();
    const q = this.testQuery().trim().toLowerCase();
    let source: LabTest[];
    switch (view) {
      case 'recent': source = this.flow.recentTests; break;
      case 'favorites': source = this.flow.popularTests; break;
      case 'catalogue':
      default: return this.filteredTests();
    }
    return source.filter(test => this.matchesTest(test, q));
  });

  get patient() { return this.flow.patient(); }
  get hasTests(): boolean { return this.flow.selectedIds().size > 0; }

  ngOnInit(): void {
    if (!this.flow.patient()) this.router.navigate(['/dashboard/registration']);
  }

  setView(view: CatalogueView): void {
    this.activeView.set(view);
    this.testQuery.set('');
    this.activeCategory.set('All');
    this.highlightedIndex.set(-1);
  }

  viewHeading(): string {
    switch (this.activeView()) {
      case 'packages': return 'Available Packages';
      case 'recent': return 'Recently Ordered Tests';
      case 'favorites': return 'Frequently Used Tests';
      default: return 'All Tests';
    }
  }

  searchPlaceholder(): string {
    switch (this.activeView()) {
      case 'packages': return 'Search packages by name or included test…';
      case 'recent': return 'Search recently ordered tests…';
      case 'favorites': return 'Search frequently used tests…';
      default: return 'Search tests by name, code or keyword (e.g. CBC, KFT, TSH…)';
    }
  }

  private matchesTest(test: LabTest, query: string): boolean {
    return !query ||
      test.name.toLowerCase().includes(query) ||
      test.id.toLowerCase().includes(query) ||
      test.category.toLowerCase().includes(query) ||
      test.sampleType.toLowerCase().includes(query) ||
      test.tubeType.toLowerCase().includes(query);
  }

  isSelected(id: string): boolean { return this.flow.selectedIds().has(id); }
  toggle(test: LabTest): void {
    try { this.flow.toggleTest(test.id); this.markAutoSaved(); }
    catch (error) { this.autoSaveState.set('error'); this.showFeedback(error instanceof Error ? error.message : 'Autosave failed.', 'error'); }
  }

  private markAutoSaved(): void {
    this.autoSaveState.set('saved');
    window.setTimeout(() => this.autoSaveState.set('idle'), 2200);
  }

  restoreDraft(id: string): void {
    const draft = this.flow.restoreOrderDraft(id);
    if (!draft) { this.showFeedback('This draft is no longer available.', 'error'); return; }
    this.draftsOpen.set(false);
    this.activeView.set('catalogue');
    this.activeCategory.set('All');
    this.testQuery.set('');
    this.markAutoSaved();
    this.showFeedback('Draft restored. You can continue editing this order.', 'success');
  }

  deleteDraft(id: string): void {
    this.flow.deleteOrderDraft(id);
    this.showFeedback('Draft deleted.', 'success');
  }

  draftUpdatedLabel(value: string): string {
    return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  categoryCount(category: string): number {
    return category === 'All'
      ? this.flow.allTests.length
      : this.flow.allTests.filter(test => test.category === category).length;
  }

  clearSearch(): void {
    this.testQuery.set('');
    this.highlightedIndex.set(-1);
    this.searchInputRef?.nativeElement.focus();
  }

  addPackage(pkg: TestPackage): void {
    // Add only missing package tests; do not toggle already-selected tests off.
    for (const id of pkg.testIds) {
      if (!this.flow.selectedIds().has(id)) this.flow.toggleTest(id);
    }
    this.markAutoSaved();
  }

  isPackageSelected(pkg: TestPackage): boolean {
    return pkg.testIds.every(id => this.flow.selectedIds().has(id));
  }

  packagePrice(pkg: TestPackage): number {
    return pkg.testIds.reduce((sum, id) =>
      sum + (this.flow.allTests.find(test => test.id === id)?.price ?? 0), 0
    );
  }

  packageTestNames(pkg: TestPackage): string {
    return pkg.testIds.map(id => this.flow.allTests.find(test => test.id === id)?.name ?? id).join(' · ');
  }

  testIcon(test: LabTest): string {
    switch (test.category) {
      case 'Haematology': return 'ti-droplet';
      case 'Biochemistry': return 'ti-flask-2';
      case 'Endocrinology': return 'ti-activity';
      case 'Urine': return 'ti-test-pipe';
      default: return 'ti-microscope';
    }
  }

  private showFeedback(message: string, kind: 'warning' | 'success' | 'error'): void {
    this.feedbackKind.set(kind);
    this.feedbackMessage.set(message);
    window.setTimeout(() => {
      if (this.feedbackMessage() === message) this.feedbackMessage.set('');
    }, 3200);
  }

  goToReview(): void {
    if (!this.hasTests) {
      this.showFeedback('Please add at least one test before reviewing the order.', 'warning');
      return;
    }
    this.router.navigate(['/dashboard/review-order']);
  }

  saveDraft(): void {
    if (this.savingDraft()) return;
    if (!this.hasTests) {
      this.showFeedback('No tests added. Add at least one test before saving this order as a draft.', 'warning');
      return;
    }

    this.savingDraft.set(true);
    this.draftSaved.set(false);
    try {
      this.flow.saveOrderDraft();
      this.draftSaved.set(true);
      this.markAutoSaved();
      this.showFeedback('Order draft saved on this device. You can continue selecting tests.', 'success');
      window.setTimeout(() => this.draftSaved.set(false), 3200);
    } catch (error) {
      this.showFeedback(error instanceof Error ? error.message : 'Unable to save the draft. Please try again.', 'error');
    } finally {
      this.savingDraft.set(false);
    }
  }

  get patientInitials(): string {
    const patient = this.patient;
    return patient ? (patient.firstName[0] + patient.lastName[0]).toUpperCase() : '?';
  }

  patientAgeBreakdown(): string {
    return this.patient ? this.flow.formatAgeBreakdown(this.patient.dob) : '';
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const typing = !!target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.searchInputRef?.nativeElement.focus();
      return;
    }
    if (modifier && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.saveDraft();
      return;
    }
    if (modifier && event.key === 'Enter') {
      event.preventDefault();
      this.goToReview();
      return;
    }
    if (this.activeView() !== 'packages' && (this.activeView() === 'catalogue' || this.activeView() === 'recent' || this.activeView() === 'favorites')) {
      if (event.key === 'ArrowDown' && !typing) {
        event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, this.visibleTests().length - 1));
        return;
      }
      if (event.key === 'ArrowUp' && !typing) {
        event.preventDefault();
        this.highlightedIndex.update(index => Math.max(index - 1, 0));
        return;
      }
      if (event.key === 'Enter' && !typing) {
        const test = this.visibleTests()[this.highlightedIndex()];
        if (test) {
          event.preventDefault();
          this.toggle(test);
        }
      }
    }
    if (event.key === 'Escape' && typing) this.clearSearch();
  }
}
