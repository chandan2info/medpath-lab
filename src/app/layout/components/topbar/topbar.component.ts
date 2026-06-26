import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarService }    from '../../../core/services/sidebar.service';
import { ThemeService }      from '../../../core/services/theme.service';
import { UserSessionService } from '../../../core/services/user-session.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgClass, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="pc-topbar lis-topbar"
      [ngClass]="{ 'sidebar-collapsed': sidebar.collapsed() }"
      role="banner"
    >
      <!-- Mobile hamburger -->
      <button
        class="topbar-icon-btn lg:hidden"
        (click)="sidebar.toggleMobile()"
        aria-label="Open navigation"
      >
        <i class="ti ti-menu-2" aria-hidden="true"></i>
      </button>

      <!-- Desktop sidebar toggle -->
      <button
        class="topbar-icon-btn hidden lg:flex"
        (click)="sidebar.toggle()"
        [attr.aria-label]="sidebar.collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <i class="ti ti-layout-sidebar" aria-hidden="true"></i>
      </button>

      <!-- Search -->
      <div class="topbar-search lis-search" role="search">
        <label for="lis-search" class="sr-only">Search patient, sample ID, test</label>
        <i class="ti ti-search search-icon" aria-hidden="true"></i>
        <input
          id="lis-search"
          type="search"
          placeholder="Search patient, sample ID, test…"
          autocomplete="off"
        />
        <kbd class="search-kbd" aria-hidden="true">⌘K</kbd>
      </div>

      <div class="topbar-spacer" aria-hidden="true"></div>

      <!-- Actions -->
      <div class="topbar-actions" role="group" aria-label="Header actions">

        <!-- Theme toggle -->
        <button
          class="topbar-icon-btn"
          (click)="theme.toggle()"
          [attr.aria-label]="'Switch to ' + (theme.theme() === 'dark' ? 'light' : 'dark') + ' mode'"
        >
          @if (theme.theme() === 'light') {
            <i class="ti ti-moon" aria-hidden="true"></i>
          } @else {
            <i class="ti ti-sun" aria-hidden="true"></i>
          }
        </button>

        <!-- Notifications -->
        <button class="topbar-icon-btn notification-btn" aria-label="Alerts (4 unread)">
          <i class="ti ti-bell" aria-hidden="true"></i>
          <span class="notif-dot" aria-hidden="true"></span>
        </button>

        <!-- New Patient CTA -->
        <a routerLink="/dashboard/registration" class="lis-topbar-cta" aria-label="Register new patient">
          <i class="ti ti-plus" aria-hidden="true"></i>
          New patient
        </a>

        <div class="topbar-divider" aria-hidden="true"></div>

        <!-- Operator -->
        <button class="topbar-avatar-btn" aria-label="Operator menu" aria-haspopup="true">
          <div class="lis-topbar-avatar" aria-hidden="true">
            {{ session.operator().initials }}
          </div>
          <div class="avatar-info hidden sm:block">
            <p class="avatar-name">{{ session.operator().name }}</p>
            <p class="avatar-role">{{ session.operator().role }}</p>
          </div>
          <i class="ti ti-chevron-down avatar-chevron hidden sm:block" aria-hidden="true"></i>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .lis-topbar { border-bottom: 0.5px solid var(--border-color); }

    .notification-btn { position: relative; }
    .notif-dot {
      position: absolute; top: 6px; right: 6px;
      width: 8px; height: 8px; border-radius: 50%;
      background: #E24B4A;
      border: 2px solid var(--topbar-bg, #fff);
    }
    .topbar-divider {
      width: 1px; height: 28px;
      background: var(--border-color); margin: 0 4px;
    }
    .lis-topbar-cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 13px;
      background: var(--lis-primary, #1D9E75);
      color: #fff;
      border-radius: 8px;
      font-size: 12px; font-weight: 500;
      text-decoration: none;
      transition: filter 0.15s;
      i { font-size: 14px; }
      &:hover { filter: brightness(1.08); }
    }
    .lis-topbar-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: var(--lis-primary-xlight, #E1F5EE);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 500;
      color: var(--lis-primary-deep, #085041);
    }
    .topbar-avatar-btn {
      display: flex; align-items: center; gap: 9px;
      background: none; border: none;
      padding: 5px 8px 5px 5px;
      border-radius: 8px; cursor: pointer;
      transition: background 0.12s; color: var(--text-primary);
      &:hover { background: var(--body-bg); }
    }
    .avatar-name { font-size: 12px; font-weight: 500; color: var(--text-primary); margin: 0; line-height: 1.3; }
    .avatar-role { font-size: 10px; color: var(--text-secondary); margin: 0; }
    .avatar-chevron { font-size: 14px; color: var(--text-secondary); }
    .search-kbd {
      font-size: 10px; font-weight: 600;
      background: var(--body-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px; padding: 2px 5px;
      color: var(--text-secondary);
      font-family: var(--font-family); white-space: nowrap;
    }
  `],
})
export class TopbarComponent {
  protected readonly sidebar = inject(SidebarService);
  protected readonly theme   = inject(ThemeService);
  protected readonly session = inject(UserSessionService);
}
