import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
} from '@angular/core';
import { CursorPreferenceService } from '../../core/services/cursor-preference.service';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  template: `
    <span class="cursor-dot" aria-hidden="true"></span>
    <span class="cursor-ring" aria-hidden="true"><span class="cursor-label"></span></span>
  `,
  styleUrl: './custom-cursor.component.css',
})
export class CustomCursorComponent implements AfterViewInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly preference = inject(CursorPreferenceService);
  private readonly view = this.document.defaultView;
  private dot?: HTMLElement;
  private ring?: HTMLElement;
  private label?: HTMLElement;
  private finePointer?: MediaQueryList;
  private reducedMotion?: MediaQueryList;
  private viewReady = false;
  private active = false;
  private visible = false;
  private pointerX = 0;
  private pointerY = 0;
  private ringX = 0;
  private ringY = 0;
  private frame = 0;
  private hovering = false;
  private textMode = false;
  private pressed = false;
  private cursorText = '';

  constructor() {
    effect(() => this.syncActivation(this.preference.enabled()));
    this.destroyRef.onDestroy(() => this.cleanup());
  }

  ngAfterViewInit(): void {
    this.dot = this.host.nativeElement.querySelector('.cursor-dot') ?? undefined;
    this.ring = this.host.nativeElement.querySelector('.cursor-ring') ?? undefined;
    this.label = this.host.nativeElement.querySelector('.cursor-label') ?? undefined;
    this.viewReady = true;

    if (!this.view) return;
    this.finePointer = this.view.matchMedia('(pointer: fine)');
    this.reducedMotion = this.view.matchMedia('(prefers-reduced-motion: reduce)');
    this.finePointer.addEventListener('change', this.onCapabilityChange);
    this.syncActivation(this.preference.enabled());
  }

  private readonly onCapabilityChange = (): void => this.syncActivation(this.preference.enabled());

  private syncActivation(enabled: boolean): void {
    if (!this.viewReady || !this.view) return;
    const shouldActivate = enabled && !!this.finePointer?.matches;
    if (shouldActivate === this.active) return;

    this.active = shouldActivate;
    const root = this.document.documentElement;
    if (shouldActivate) {
      root.classList.add('cursor-dual-layer-active');
      this.document.addEventListener('pointermove', this.onPointerMove, { passive: true });
      this.document.addEventListener('pointerover', this.onPointerOver, true);
      this.document.addEventListener('pointerout', this.onPointerOut, true);
      this.document.addEventListener('pointerdown', this.onPointerDown, true);
      this.document.addEventListener('pointerup', this.onPointerUp, true);
      this.view.addEventListener('blur', this.onWindowBlur);
      this.document.addEventListener('mouseleave', this.onDocumentLeave);
      this.document.addEventListener('mouseenter', this.onDocumentEnter);
    } else {
      root.classList.remove('cursor-dual-layer-active');
      this.removeListeners();
      this.hide();
    }
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.visible = true;
    this.host.nativeElement.classList.remove('is-hidden');
    this.host.nativeElement.classList.add('is-visible');
    this.renderDot();
    this.scheduleFrame();
  };

  private readonly onPointerOver = (event: PointerEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const textTarget = target.closest(
      'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"], [role="textbox"]'
    );
    this.textMode = !!textTarget;
    const interactive = target.closest(
      'a[href], button:not(:disabled), [role="button"], [data-cursor="pointer"], [role="link"], [role="tab"], [role="menuitem"]'
    );
    this.hovering = !!interactive && !this.textMode;
    const textElement = target.closest<HTMLElement>('[data-cursor-text]');
    this.cursorText = textElement?.dataset['cursorText']?.trim() ?? '';
    this.updateState();
  };

  private readonly onPointerOut = (event: PointerEvent): void => {
    const next = event.relatedTarget instanceof Element ? event.relatedTarget : null;
    if (next && (event.target instanceof Element) && event.target.contains(next)) return;
    if (!next) {
      this.hovering = false;
      this.textMode = false;
      this.cursorText = '';
      this.updateState();
    }
  };

  private readonly onPointerDown = (): void => {
    this.pressed = true;
    this.updateState();
  };

  private readonly onPointerUp = (): void => {
    this.pressed = false;
    this.updateState();
  };

  private readonly onDocumentLeave = (): void => this.hide();
  private readonly onDocumentEnter = (): void => {
    if (!this.active) return;
    this.visible = true;
    this.host.nativeElement.classList.remove('is-hidden');
  };
  private readonly onWindowBlur = (): void => this.hide();

  private updateState(): void {
    const host = this.host.nativeElement;
    host.classList.toggle('is-hovering', this.hovering);
    host.classList.toggle('is-text-mode', this.textMode);
    host.classList.toggle('is-pressed', this.pressed);
    host.classList.toggle('has-label', !!this.cursorText);
    if (this.label) this.label.textContent = this.cursorText;
  }

  private renderDot(): void {
    if (!this.dot) return;
    this.dot.style.transform = `translate3d(${this.pointerX - 3}px, ${this.pointerY - 3}px, 0)`;
  }

  private scheduleFrame(): void {
    if (!this.view || this.frame) return;
    this.frame = this.view.requestAnimationFrame(this.animateRing);
  }

  private readonly animateRing = (): void => {
    this.frame = 0;
    if (!this.active || !this.visible || !this.ring || !this.view) return;
    const ease = this.reducedMotion?.matches ? 1 : 0.18;
    this.ringX += (this.pointerX - this.ringX) * ease;
    this.ringY += (this.pointerY - this.ringY) * ease;
    this.ring.style.transform = `translate3d(${this.ringX - 16}px, ${this.ringY - 16}px, 0)`;

    if (Math.abs(this.pointerX - this.ringX) > 0.1 || Math.abs(this.pointerY - this.ringY) > 0.1) {
      this.scheduleFrame();
    }
  };

  private hide(): void {
    this.visible = false;
    this.host.nativeElement.classList.remove('is-visible');
    this.host.nativeElement.classList.add('is-hidden');
    if (this.frame && this.view) this.view.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private removeListeners(): void {
    this.document.removeEventListener('pointermove', this.onPointerMove);
    this.document.removeEventListener('pointerover', this.onPointerOver, true);
    this.document.removeEventListener('pointerout', this.onPointerOut, true);
    this.document.removeEventListener('pointerdown', this.onPointerDown, true);
    this.document.removeEventListener('pointerup', this.onPointerUp, true);
    this.document.removeEventListener('mouseleave', this.onDocumentLeave);
    this.document.removeEventListener('mouseenter', this.onDocumentEnter);
    this.view?.removeEventListener('blur', this.onWindowBlur);
    this.finePointer?.removeEventListener('change', this.onCapabilityChange);
  }

  private cleanup(): void {
    this.removeListeners();
    this.finePointer?.removeEventListener('change', this.onCapabilityChange);
    if (this.frame && this.view) this.view.cancelAnimationFrame(this.frame);
    this.document.documentElement.classList.remove('cursor-dual-layer-active');
  }
}
