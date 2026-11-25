import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private observer?: MutationObserver;
  private activeDialog: HTMLElement | null = null;
  private returnFocus: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.observer = new MutationObserver(() => this.syncDialogFocus());
    this.observer.observe(this.host.nativeElement, { childList: true, subtree: true });
    this.syncDialogFocus();
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  private syncDialogFocus(): void {
    const dialog = this.host.nativeElement.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    if (dialog && dialog !== this.activeDialog) {
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.activeDialog = dialog;
      queueMicrotask(() => this.focusFirst(dialog));
    } else if (!dialog && this.activeDialog) {
      this.activeDialog = null;
      const previous = this.returnFocus;
      this.returnFocus = null;
      if (previous?.isConnected) queueMicrotask(() => previous.focus());
    }
  }

  private focusables(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(
      'a[href]:not([aria-disabled="true"]), button:not([disabled]):not([aria-disabled="true"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])'
    )).filter(element => element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0);
  }

  private focusFirst(dialog: HTMLElement): void {
    if (!dialog.isConnected) return;
    const first = this.focusables(dialog)[0];
    if (first) first.focus();
    else { if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1'); dialog.focus(); }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const dialog = this.host.nativeElement.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    if (dialog) {
      if (event.key === 'Escape') {
        const close = dialog.querySelector<HTMLElement>('[data-dialog-close], button[aria-label*="close" i], button[title*="close" i]');
        const backdrop = dialog.closest<HTMLElement>('.modal-backdrop');
        if (close || backdrop) {
          event.preventDefault(); event.stopPropagation();
          if (close) close.click(); else backdrop?.click();
        }
        return;
      }
      if (event.key === 'Tab') {
        const items = this.focusables(dialog);
        if (!items.length) { event.preventDefault(); dialog.focus(); return; }
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
      return;
    }
    if (event.key === 'Escape') this.dismissOpenPopover();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    const popups = this.host.nativeElement.querySelectorAll<HTMLElement>(
      '.alert-popover, .collection-datetime-popover, .filter-popover, .more-menu, .search-suggestions, .dropdown-menu, .drafts-panel'
    );
    for (const popup of Array.from(popups)) {
      if (!target || popup.contains(target)) continue;
      if (popup.classList.contains('drafts-panel')) {
        const trigger = this.host.nativeElement.querySelector<HTMLElement>('.drafts-toggle');
        if (!trigger?.contains(target)) trigger?.click();
        continue;
      }
      const wrapper = popup.closest<HTMLElement>(
        '.alert-popover-host, .collection-datetime-control, .filter-wrap, .more-wrap, .search-wrap, .dropdown'
      ) ?? popup.parentElement;
      const trigger = wrapper?.querySelector<HTMLElement>('button[aria-expanded="true"]');
      if (trigger?.contains(target)) continue;
      if (trigger) trigger.click();
    }
  }

  private dismissOpenPopover(): void {
    const popup = this.host.nativeElement.querySelector<HTMLElement>(
      '.alert-popover, .collection-datetime-popover, .filter-popover, .more-menu, .search-suggestions, .dropdown-menu, .drafts-panel'
    );
    if (!popup) return;
    const wrapper = popup.closest<HTMLElement>(
      '.alert-popover-host, .collection-datetime-control, .filter-wrap, .more-wrap, .search-wrap, .dropdown'
    ) ?? popup.parentElement;
    const close = popup.querySelector<HTMLElement>('[data-popover-close], button[aria-label*="close" i], button[title*="close" i]');
    const trigger = popup.classList.contains('drafts-panel')
      ? this.host.nativeElement.querySelector<HTMLElement>('.drafts-toggle')
      : wrapper?.querySelector<HTMLElement>('button[aria-expanded="true"]');
    if (close) close.click(); else if (trigger) trigger.click();
    trigger?.focus();
  }
}
