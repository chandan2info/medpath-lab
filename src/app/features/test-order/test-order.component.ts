// ─────────────────────────────────────────────
//  Screen 2 — Test Order
//  Single purpose: search & order tests for the
//  registered patient. Full-width layout.
// ─────────────────────────────────────────────
import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientFlowService } from '../../core/services/patient-flow.service';
import { LabTest } from '../../shared/models/lis.models';

@Component({
  selector: 'app-test-order',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './test-order.component.html',
  styleUrl: './test-order.component.css',
})
export class TestOrderComponent implements OnInit {
  protected readonly flow   = inject(PatientFlowService);
  private   readonly router = inject(Router);

  testQuery      = signal('');
  activeCategory = signal('All');
  saving         = signal(false);

  filteredTests = computed(() => {
    const q   = this.testQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.flow.allTests.filter(t =>
      (cat === 'All' || t.category === cat) &&
      (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    );
  });

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
  clearSearch(): void { this.testQuery.set(''); }

  get hasTests(): boolean { return this.flow.selectedIds().size > 0; }

  proceedToBilling(): void {
    if (!this.hasTests) return;
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.router.navigate(['/dashboard/billing']);
    }, 400);
  }

  get patientInitials(): string {
    const p = this.patient;
    if (!p) return '?';
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
  }

  get patientAge(): string {
    const p = this.patient;
    if (!p) return '';
    return this.flow.calcAge(p.dob) + ' yrs';
  }
}
