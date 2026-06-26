import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent }  from '../topbar/topbar.component';
import { SidebarService }   from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NgClass, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pc-container lis-app-shell"
      [ngClass]="{
        'sidebar-collapsed': sidebar.collapsed(),
        'mobile-nav-open':   sidebar.mobileOpen()
      }"
    >
      <!-- Persistent sidebar -->
      <app-sidebar />

      <!-- Main content column -->
      <div class="pc-main-content">
        <!-- Persistent topbar -->
        <app-topbar />

        <!-- Routed feature pages land here -->
        <main
          class="pc-page-content lis-page-content"
          role="main"
          id="main-content"
          aria-live="polite"
        >
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    /* LIS page content area */
    .lis-page-content {
      padding: 20px 22px;
      min-height: calc(100vh - var(--lis-topbar-height, 52px));
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .lis-page-content { padding: 14px 14px; }
    }

    /* Skip-to-content link for a11y */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--lis-primary, #1D9E75);
      color: #fff;
      padding: 8px 16px;
      border-radius: 0 0 8px 0;
      text-decoration: none;
      font-size: 13px;
      z-index: 9999;
      transition: top 0.1s;

      &:focus { top: 0; }
    }
  `],
})
export class MainLayoutComponent {
  protected readonly sidebar = inject(SidebarService);
}
