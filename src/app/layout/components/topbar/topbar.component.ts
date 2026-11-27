import { Component, inject, signal, computed, ChangeDetectionStrategy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SidebarService }    from '../../../core/services/sidebar.service';
import { ThemeService }      from '../../../core/services/theme.service';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { PatientFlowService } from '../../../core/services/patient-flow.service';
import { SampleTrackingService } from '../../../core/services/sample-tracking.service';
import { UserChipComponent } from '../../../shared/components/user-chip/user-chip.component';

interface SearchResult {
  id: string;
  kind: 'Patient' | 'Sample' | 'Test';
  title: string;
  subtitle: string;
  route: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgClass, RouterLink, UserChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  protected readonly sidebar = inject(SidebarService);
  protected readonly theme   = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly dashboard = inject(DashboardDataService);
  private readonly flow = inject(PatientFlowService);
  private readonly sampleTracking = inject(SampleTrackingService);
  readonly searchQuery = signal('');
  readonly searchOpen = signal(false);
  readonly highlightedSearchIndex = signal(0);
  readonly alertsOpen = signal(false);
  @ViewChild('alertsPopover') private alertsPopover?: ElementRef<HTMLElement>;
  readonly activeAlerts = this.dashboard.alerts;
  readonly searchResults = computed<SearchResult[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (query.length < 2) return [];

    const patients: SearchResult[] = this.flow.searchPatients(query).map(patient => ({
      id: patient.id, kind: 'Patient', title: patient.name,
      subtitle: `${patient.id} · ${patient.mobile}`, route: '/dashboard/registration',
    }));
    const currentPatient = this.flow.patient();
    if (currentPatient && [currentPatient.firstName, currentPatient.lastName, currentPatient.id, currentPatient.mobile]
      .some(value => value.toLowerCase().includes(query)) && !patients.some(item => item.id === currentPatient.id)) {
      patients.unshift({
        id: currentPatient.id, kind: 'Patient', title: `${currentPatient.firstName} ${currentPatient.lastName}`,
        subtitle: `${currentPatient.id} · ${currentPatient.mobile}`, route: '/dashboard/registration',
      });
    }

    const samples: SearchResult[] = this.sampleTracking.samples()
      .filter(sample => [sample.id, sample.patientId, sample.patientName, ...sample.tests]
        .some(value => value.toLowerCase().includes(query)))
      .map(sample => ({
        id: sample.id, kind: 'Sample', title: sample.id,
        subtitle: `${sample.patientName} · ${sample.tests.join(', ')}`, route: '/dashboard/tracking',
      }));
    const tests: SearchResult[] = this.flow.allTests
      .filter(test => [test.id, test.name, test.category].some(value => value.toLowerCase().includes(query)))
      .map(test => ({
        id: test.id, kind: 'Test', title: test.name,
        subtitle: `${test.id} · ${test.category}`, route: '/dashboard/test-order',
      }));
    return [...patients, ...samples, ...tests].slice(0, 8);
  });

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.searchOpen.set(value.trim().length >= 2);
    this.highlightedSearchIndex.set(0);
  }

  chooseSearchResult(result: SearchResult): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.router.navigate([result.route], { queryParams: { search: result.id } });
  }

  moveSearchHighlight(direction: -1 | 1): void {
    const count = this.searchResults().length;
    if (!count) return;
    this.highlightedSearchIndex.update(index => (index + direction + count) % count);
  }

  selectHighlightedSearchResult(): void {
    const result = this.searchResults()[this.highlightedSearchIndex()];
    if (result) this.chooseSearchResult(result);
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.searchOpen()) return;
      event.preventDefault();
      this.moveSearchHighlight(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && this.searchOpen()) {
      event.preventDefault();
      this.selectHighlightedSearchResult();
    } else if (event.key === 'Escape') {
      this.searchOpen.set(false);
    }
  }

  toggleAlerts(): void {
    const popover = this.alertsPopover?.nativeElement as (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | undefined;
    if (!popover) return;
    if (this.alertsOpen()) {
      this.closeAlerts();
      return;
    }
    try {
      popover.showPopover?.();
      this.alertsOpen.set(true);
    } catch {
      this.alertsOpen.set(false);
    }
  }

  closeAlerts(): void {
    const popover = this.alertsPopover?.nativeElement as (HTMLElement & { hidePopover?: () => void }) | undefined;
    if (popover?.matches(':popover-open')) popover.hidePopover?.();
    this.alertsOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  closePopoversOutside(event: MouseEvent): void {
    const target = event.target as Node | null;
    const host = (event.currentTarget as Document).querySelector('.topbar-search');
    if (!target || !host?.contains(target)) this.searchOpen.set(false);
    const alerts = (event.currentTarget as Document).querySelector('.topbar-alerts');
    if (!target || !alerts?.contains(target)) this.closeAlerts();
  }

  @HostListener('document:keydown', ['$event'])
  handleSearchKeys(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const input = document.getElementById('lis-search') as HTMLInputElement | null;
      input?.focus();
      input?.select();
      return;
    }
    if (event.key === 'Escape') {
      this.searchOpen.set(false);
      this.closeAlerts();
    }
  }
}
