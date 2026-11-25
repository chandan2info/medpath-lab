import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  /** Desktop: switch between expanded and icon-only navigation. */
  toggle(): void {
    this.collapsed.update(value => !value);
  }

  /** Whether the shared header control is currently in mobile drawer mode. */
  isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  }

  /** Expanded state for the shared header control at the current breakpoint. */
  responsiveExpanded(): boolean {
    return this.isMobileViewport() ? this.mobileOpen() : !this.collapsed();
  }

  /** Route the single header control to desktop collapse or mobile drawer behavior. */
  toggleResponsive(): void {
    if (this.isMobileViewport()) {
      this.toggleMobile();
      return;
    }
    this.toggle();
  }

  private collapsedBeforeMobile = false;

  /** Mobile/tablet: open a full-width navigation drawer, even if desktop
   * navigation was previously collapsed to an icon rail. */
  toggleMobile(): void {
    if (this.mobileOpen()) {
      this.closeMobile();
    } else {
      this.openMobile();
    }
  }

  openMobile(): void {
    if (this.mobileOpen()) return;
    this.collapsedBeforeMobile = this.collapsed();
    this.collapsed.set(false);
    this.mobileOpen.set(true);
  }

  closeMobile(): void {
    if (!this.mobileOpen()) return;
    this.mobileOpen.set(false);
    this.collapsed.set(this.collapsedBeforeMobile);
  }

  collapse(): void {
    this.collapsed.set(true);
  }

  expand(): void {
    this.collapsed.set(false);
  }
}
