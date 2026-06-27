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

interface NavSection { caption: string; }
interface NavLink {
  label:  string;
  route:  string;
  icon:   string;
  badge?: keyof NavBadges;
}
type NavEntry = NavSection | NavLink;
const isSection = (e: NavEntry): e is NavSection => 'caption' in e;

// ── Navigation map (reflects the focused workflow) ──────────
const NAV: NavEntry[] = [
  { caption: 'Workspace' },
  { label: 'Home',                 route: '/dashboard/home',         icon: 'home'          },

  { caption: 'Patient Workflow' },
  { label: 'Register Patient',     route: '/dashboard/registration', icon: 'user-plus'     },
  { label: 'Test Order',           route: '/dashboard/test-order',   icon: 'test-pipe'     },
  { label: 'Billing',              route: '/dashboard/billing',      icon: 'file-invoice', badge: 'billing' },
  { label: 'Sample Collection',    route: '/dashboard/collection',   icon: 'droplet'       },

  { caption: 'Lab Work' },
  { label: 'Sample Tracking',      route: '/dashboard/tracking',     icon: 'timeline',     badge: 'tracking' },
  { label: 'Result Entry',         route: '/dashboard/results',      icon: 'writing'       },
  { label: 'Reports',              route: '/dashboard/reports',      icon: 'file-text',    badge: 'reports'  },

  { caption: 'Records' },
  { label: 'Patient History',      route: '/dashboard/history',      icon: 'history'       },
  { label: 'Analytics',            route: '/dashboard/analytics',    icon: 'chart-bar'     },
  { label: 'Settings',             route: '/dashboard/settings',     icon: 'settings'      },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit, OnDestroy {
  protected readonly sidebar   = inject(SidebarService);
  protected readonly nav$      = inject(NavigationService);
  protected readonly session   = inject(UserSessionService);
  protected readonly nav       = NAV;
  protected readonly isSection = isSection;

  badges: NavBadges = { billing: 0, reports: 0, tracking: 0 };
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.nav$.badges$.subscribe(b => this.badges = b);
  }
  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
