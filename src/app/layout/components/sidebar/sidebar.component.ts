import {
  Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, AsyncPipe } from '@angular/common';
import { SidebarService }    from '../../../core/services/sidebar.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { UserSessionService } from '../../../core/services/user-session.service';
import { NavBadges } from '../../../shared/models/lis.models';
import { Subscription } from 'rxjs';

interface NavSection {
  caption: string;
}

interface NavLink {
  label:  string;
  route:  string;
  icon:   string;
  badge?: keyof NavBadges;
}

type NavEntry = NavSection | NavLink;

const isSection = (e: NavEntry): e is NavSection => 'caption' in e;

const NAV: NavEntry[] = [
  { caption: 'Workspace' },
  { label: 'Home',                 route: '/dashboard/home',         icon: 'home' },
  { label: 'Patient registration', route: '/dashboard/registration', icon: 'user-plus' },
  { label: 'Billing',              route: '/dashboard/billing',      icon: 'file-invoice', badge: 'billing' },
  { caption: 'Lab work' },
  { label: 'Sample collection',    route: '/dashboard/collection',   icon: 'test-pipe' },
  { label: 'Sample tracking',      route: '/dashboard/tracking',     icon: 'timeline',     badge: 'tracking' },
  { label: 'Result entry',         route: '/dashboard/results',      icon: 'writing' },
  { label: 'Reports',              route: '/dashboard/reports',      icon: 'file-text',    badge: 'reports' },
  { caption: 'Records' },
  { label: 'Patient history',      route: '/dashboard/history',      icon: 'history' },
  { label: 'Analytics',            route: '/dashboard/analytics',    icon: 'chart-bar' },
  { label: 'Settings',             route: '/dashboard/settings',     icon: 'settings' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mobile overlay -->
    @if (sidebar.mobileOpen()) {
      <div
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        (click)="sidebar.closeMobile()"
        aria-hidden="true"
      ></div>
    }

    <nav
      class="pc-sidebar lis-sidebar"
      [ngClass]="{
        'collapsed':    sidebar.collapsed(),
        'mobile-open':  sidebar.mobileOpen()
      }"
      role="navigation"
      aria-label="Lab navigation"
    >
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="lis-brand-icon" aria-hidden="true">
          <i class="ti ti-flask"></i>
        </div>
        @if (!sidebar.collapsed()) {
          <div class="lis-brand-text">
            <span class="lis-brand-name">MedPath LIS</span>
            <span class="lis-brand-sub">Diagnostic Lab · v2.4</span>
          </div>
        }
        <button
          class="mobile-close-btn lg:hidden"
          (click)="sidebar.closeMobile()"
          aria-label="Close navigation"
        >
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Navigation -->
      <div class="sidebar-nav" role="list">
        @for (entry of nav; track $index) {
          @if (isSection(entry)) {
            @if (!sidebar.collapsed()) {
              <div class="nav-caption" role="presentation">{{ entry.caption }}</div>
            }
          } @else {
            <div class="nav-item" role="listitem">
              <a
                [routerLink]="entry.route"
                routerLinkActive="active"
                [attr.aria-label]="entry.label"
                [attr.title]="sidebar.collapsed() ? entry.label : null"
                (click)="sidebar.closeMobile()"
              >
                <span class="nav-icon" aria-hidden="true">
                  <i class="ti ti-{{ entry.icon }}"></i>
                </span>
                @if (!sidebar.collapsed()) {
                  <span class="nav-label">{{ entry.label }}</span>
                  @if (entry.badge && badges && badges[entry.badge] > 0) {
                    <span
                      class="nav-badge"
                      [attr.aria-label]="badges[entry.badge] + ' items'"
                    >{{ badges[entry.badge] }}</span>
                  }
                }
              </a>
            </div>
          }
        }
      </div>

      <!-- Operator footer -->
      @if (!sidebar.collapsed()) {
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="lis-avatar" aria-hidden="true">
              {{ session.operator().initials }}
            </div>
            <div class="sidebar-user-info">
              <p class="sidebar-user-name">{{ session.operator().name }}</p>
              <p class="sidebar-user-role">{{ session.operator().role }}</p>
            </div>
            <i class="ti ti-logout lis-logout-icon" aria-label="Sign out"></i>
          </div>
        </div>
      }
    </nav>
  `,
  styles: [`
    /* LIS brand overrides */
    .lis-sidebar { background: var(--lis-sidebar-bg, #04342C) !important; }

    .lis-brand-icon {
      width: 33px; height: 33px;
      background: var(--lis-primary, #1D9E75);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      i { color: #fff; font-size: 18px; }
    }
    .lis-brand-text { display: flex; flex-direction: column; }
    .lis-brand-name {
      font-size: 13px; font-weight: 500; color: #fff; line-height: 1.2;
    }
    .lis-brand-sub  { font-size: 10px; color: rgba(255,255,255,0.5); }

    /* Nav items inherit base .pc-sidebar styles — only override colour */
    .pc-sidebar .nav-item a:hover,
    .pc-sidebar .nav-item a.active {
      background: rgba(29,158,117,0.18) !important;
      color: #9FE1CB !important;
    }
    .pc-sidebar .nav-item a.active { font-weight: 600; }

    /* Badge */
    .nav-badge {
      margin-left: auto;
      background: #E24B4A;
      color: #fff;
      font-size: 10px;
      border-radius: 10px;
      padding: 1px 6px;
      font-weight: 500;
      line-height: 1.6;
    }

    /* Avatar */
    .lis-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: var(--lis-primary, #1D9E75);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 500; color: #fff;
      flex-shrink: 0;
    }
    .lis-logout-icon {
      margin-left: auto; font-size: 15px;
      color: rgba(255,255,255,0.4); cursor: pointer;
      &:hover { color: rgba(255,255,255,0.8); }
    }

    /* Footer */
    .sidebar-footer {
      margin-top: auto;
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .sidebar-user {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 8px;
      cursor: pointer; transition: background 0.12s;
      &:hover { background: rgba(255,255,255,0.05); }
    }
    .sidebar-user-name { font-size: 12px; font-weight: 500; color: #fff; margin: 0; line-height: 1.3; }
    .sidebar-user-role { font-size: 10px; color: rgba(255,255,255,0.5); margin: 0; }

    .mobile-close-btn {
      margin-left: auto;
      width: 32px; height: 32px;
      border: none; border-radius: 8px;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.6);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      &:hover { background: rgba(255,255,255,0.15); }
    }
  `],
})
export class SidebarComponent implements OnInit, OnDestroy {
  protected readonly sidebar = inject(SidebarService);
  protected readonly nav$    = inject(NavigationService);
  protected readonly session = inject(UserSessionService);
  protected readonly nav     = NAV;
  protected readonly isSection = isSection;

  badges: NavBadges = { billing: 0, reports: 0, tracking: 0 };
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.nav$.badges$.subscribe(b => this.badges = b);
  }
  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
