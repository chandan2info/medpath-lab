import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  /** Desktop: switch between expanded and icon-only navigation. */
  toggle(): void {
    this.collapsed.update(value => !value);
  }

  /** Mobile/tablet: open the off-canvas navigation. */
  toggleMobile(): void {
    this.mobileOpen.update(value => !value);
  }

  openMobile(): void {
    this.mobileOpen.set(true);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  collapse(): void {
    this.collapsed.set(true);
  }

  expand(): void {
    this.collapsed.set(false);
  }
}
