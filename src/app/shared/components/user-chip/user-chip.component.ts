import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserSessionService } from '../../../core/services/user-session.service';

interface ChipMenuLink {
  label: string;
  icon: string;
  link: string;
}

/**
 * app-user-chip
 * ─────────────
 * Self-contained operator identity chip: avatar + name/role + a
 * dropdown menu (profile / settings / sign out). Used in the topbar
 * (light, pill-shaped) and the sidebar footer (dark, full-width) —
 * pick the surface via [variant].
 */
@Component({
  selector: 'app-user-chip',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-chip.component.html',
  styleUrl: './user-chip.component.css',
})
export class UserChipComponent {
  private readonly session = inject(UserSessionService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Surface this chip sits on — swaps the color tokens it uses. */
  readonly variant = input<'topbar' | 'sidebar'>('topbar');
  /** Which side of the trigger the dropdown panel is anchored to. */
  readonly align = input<'left' | 'right'>('right');
  /** Open the panel above the trigger instead of below (e.g. footer). */
  readonly placement = input<'down' | 'up'>('down');

  readonly operator = this.session.operator;
  readonly open = signal(false);

  readonly links: ChipMenuLink[] = [
    { label: 'View profile', icon: 'ti-user-circle', link: '/dashboard/settings' },
    { label: 'Settings',     icon: 'ti-settings',     link: '/dashboard/settings' },
  ];

  toggle(): void {
    this.open.update(v => !v);
  }

  close(): void {
    if (this.open()) this.open.set(false);
  }

  signOut(): void {
    this.close();
    this.session.logout();
    this.router.navigateByUrl('/lis-home');
  }

  /** Close on outside click. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /** Close on Escape, regardless of which element inside the chip has focus. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  /** Close when focus leaves the chip entirely (keyboard tabbing away). */
  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) {
      this.close();
    }
  }
}
