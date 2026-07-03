import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarService }    from '../../../core/services/sidebar.service';
import { ThemeService }      from '../../../core/services/theme.service';
import { UserChipComponent } from '../../../shared/components/user-chip/user-chip.component';

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
  readonly searchQuery = signal('');
}
