// ─────────────────────────────────────────────
//  Screen 2 — Test Order
//  Single purpose: search & order tests for the
//  registered patient. Full-width layout.
//  Redesigned per UX review (2026-07):
//   - patient summary as a strong sticky anchor
//   - segmented category filter + Recently Ordered
//   - Popular Tests as action cards
//   - Frequently Ordered Packages (fills dead space)
//   - Smart Suggestions ("patients also order")
//   - richer test metadata (tube/sample/prep)
//   - summary panel split into distinct sections
//   - full keyboard workflow
// ─────────────────────────────────────────────
import {
  Component, ChangeDetectionStrategy, signal, computed, inject, effect,
  OnInit, ElementRef, ViewChild, HostListener
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { LabTest, TestPackage } from '../../shared/models/lis.models';

const CATEGORY_ICON: Record<string, string> = {
  'All':            'ti-apps',
  'Haematology':    'ti-droplet',
  'Biochemistry':   'ti-flask',
  'Endocrinology':  'ti-activity',
  'Urine':          'ti-droplet-half-2',
};

const PRIORITY_INFO: Record<'routine' | 'urgent' | 'stat', { label: string; desc: string; icon: string }> = {
  routine: { label: 'Routine', desc: 'Normal queue',   icon: 'ti-list-check' },
  urgent:  { label: 'Urgent',  desc: 'Priority queue', icon: 'ti-clock-bolt' },
  stat:    { label: 'STAT',    desc: 'Immediate',      icon: 'ti-bolt' },
};

@Component({
  selector: 'app-test-order',
  standalone: true,
  imports: [RouterLink, FormsModule, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './test-order.component.html',
  styleUrl: './test-order.component.css',
})
export class TestOrderComponent implements OnInit {
  protected readonly flow   = inject(PatientFlowService);
  private   readonly router = inject(Router);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  protected readonly categoryIcon  = CATEGORY_ICON;
  protected readonly priorityInfo  = PRIORITY_INFO;
  protected readonly priorities: ('routine' | 'urgent' | 'stat')[] = ['routine', 'urgent', 'stat'];

  testQuery      = signal('');
  activeCategory = signal('All');
  popularVisible  = signal(false);
  packagesVisible = signal(false);
  saving         = signal(false);
  savingDraft    = signal(false);
  draftSaved     = signal(false);
  highlightedIndex = signal(-1);
  totalPulse     = signal(false);

  filteredTests = computed(() => {
    const q   = this.testQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.flow.allTests.filter(t =>
      (cat === 'All' || t.category === cat) &&
      (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    );
  });

  // "Patients also order" — union of related tests for everything selected,
  // minus anything already selected, capped to keep the panel compact.
  suggestions = computed<LabTest[]>(() => {
    const selected = this.flow.selectedIds();
    const seen = new Set<string>();
    const out: LabTest[] = [];
    for (const t of this.flow.selectedTests()) {
      for (const relId of this.flow.relatedTo(t.id)) {
        if (selected.has(relId) || seen.has(relId)) continue;
        const relTest = this.flow.allTests.find(x => x.id === relId);
        if (relTest) { seen.add(relId); out.push(relTest); }
      }
    }
    return out.slice(0, 4);
  });

  constructor() {
    // Micro-interaction: briefly pulse the Grand Total when it changes,
    // instead of a silent, static number update.
    effect(() => {
      this.flow.grandTotal();
      this.totalPulse.set(true);
      setTimeout(() => this.totalPulse.set(false), 350);
    });
  }

  get patient() { return this.flow.patient(); }

  ngOnInit(): void {
    // If no registered patient, redirect to registration
    if (!this.flow.patient()) {
      this.router.navigate(['/dashboard/registration']);
    }
  }

  isSelected(id: string): boolean { return this.flow.selectedIds().has(id); }
  toggle(t: LabTest): void { this.flow.toggleTest(t.id); }
  setPriority(p: 'routine' | 'urgent' | 'stat'): void { this.flow.setPriority(p); }
  onPriorityClick(p: string): void { this.flow.setPriority(p as 'routine' | 'urgent' | 'stat'); }

  clearSearch(): void {
    this.testQuery.set('');
    this.highlightedIndex.set(-1);
  }

  addPackage(pkg: TestPackage): void {
    for (const id of pkg.testIds) {
      if (!this.flow.selectedIds().has(id)) this.flow.toggleTest(id);
    }
  }

  packagePrice(pkg: TestPackage): number {
    return pkg.testIds.reduce((sum, id) => {
      const t = this.flow.allTests.find(x => x.id === id);
      return sum + (t?.price ?? 0);
    }, 0);
  }

  packageTestNames(pkg: TestPackage): string {
    return pkg.testIds
      .map(id => this.flow.allTests.find(x => x.id === id)?.id ?? id)
      .join(' + ');
  }

  get hasTests(): boolean { return this.flow.selectedIds().size > 0; }

  proceedToBilling(): void {
    if (!this.hasTests || this.saving()) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.router.navigate(['/dashboard/billing']);
    }, 400);
  }

  saveDraft(): void {
    if (this.savingDraft()) return;
    this.savingDraft.set(true);
    this.draftSaved.set(false);
    setTimeout(() => {
      this.savingDraft.set(false);
      this.draftSaved.set(true);
      setTimeout(() => this.draftSaved.set(false), 1800);
    }, 350);
  }

  // ── Ripple micro-interaction for the primary CTA ──────────────
  onCtaRipple(e: MouseEvent): void {
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
    btn.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
    btn.classList.remove('is-rippling');
    // Force reflow so the animation restarts on rapid re-clicks
    void btn.offsetWidth;
    btn.classList.add('is-rippling');
  }

  // ── Keyboard workflow ──────────────────────────────────────────
  // Ctrl/Cmd+F   focus test search
  // ↑ / ↓        navigate the test list
  // Enter        add the highlighted test
  // Delete       remove the most recently added test
  // Ctrl/Cmd+S   save as draft
  // Ctrl/Cmd+Enter  continue to billing
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      this.searchInputRef?.nativeElement.focus();
      return;
    }
    if (mod && e.key === 'Enter') {
      e.preventDefault();
      this.proceedToBilling();
      return;
    }
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.saveDraft();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = this.filteredTests().length - 1;
      this.highlightedIndex.update(i => Math.min(i + 1, max));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex.update(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && !typing) {
      const list = this.filteredTests();
      const i = this.highlightedIndex();
      if (list[i]) { e.preventDefault(); this.toggle(list[i]); }
      return;
    }
    if (e.key === 'Enter' && typing && this.testQuery()) {
      // Enter from inside the search box quick-adds the first match
      const first = this.filteredTests()[0];
      if (first) { e.preventDefault(); this.toggle(first); }
      return;
    }
    if (e.key === 'Escape' && typing) {
      this.clearSearch();
      (target as HTMLInputElement).blur();
      return;
    }
    if (e.key === 'Delete' && !typing) {
      const last = this.flow.selectedTests().at(-1);
      if (last) { e.preventDefault(); this.toggle(last); }
    }
  }

  get patientInitials(): string {
    const p = this.patient;
    if (!p) return '?';
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
  }

  patientAgeBreakdown(): string {
    const p = this.patient;
    if (!p) return '';
    const { years, months, days } = this.flow.calcAgeParts(p.dob);
    return `${years} Years - ${months} Months - ${days} Days`;
  }

  genderIcon(): string {
    const g = (this.patient?.gender ?? '').toLowerCase();
    if (g === 'male')   return 'ti-gender-male';
    if (g === 'female') return 'ti-gender-female';
    return 'ti-gender-genderless';
  }
}