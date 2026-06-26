import { Component, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [NgClass, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  protected scrolled   = signal(false);
  protected mobileOpen = signal(false);
  protected readonly theme = inject(ThemeService);

  protected links = [
    { label: 'Features',     href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing',      href: '#pricing' },
    { label: 'FAQ',          href: '#faq' },
  ];

  toggleMobile(): void { this.mobileOpen.update(v => !v); }

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 20); }
}
