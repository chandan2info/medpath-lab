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
  template: `
    <header [ngClass]="['landing-nav', scrolled() ? 'scrolled' : '']" role="banner">
      <div class="nav-container">
        <!-- Brand -->
        <a routerLink="/landing" class="brand" aria-label="CryptoFlow home">
          <div class="brand-logo-wrap" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="var(--primary-deeper)"/>
              <path d="M7 14l5 5 9-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          Crypto<span>Flow</span>
        </a>

        <!-- Desktop nav links -->
        <nav class="nav-links" aria-label="Main navigation">
          <ul role="list">
            @for (link of links; track link.href) {
              <li role="listitem"><a [href]="link.href">{{ link.label }}</a></li>
            }
          </ul>
        </nav>

        <!-- CTA actions -->
        <div class="nav-cta">
          <button
            class="nav-theme-btn"
            (click)="theme.toggle()"
            [attr.aria-label]="'Switch to ' + (theme.theme() === 'dark' ? 'light' : 'dark') + ' mode'"
          >
            @if (theme.theme() === 'light') {
              <i class="ti ti-moon" aria-hidden="true"></i>
            } @else {
              <i class="ti ti-sun" aria-hidden="true"></i>
            }
          </button>
          <a routerLink="/dashboard" class="nav-btn-ghost">Log in</a>
          <a routerLink="/dashboard" class="nav-btn-primary">
            Launch App
            <i class="ti ti-arrow-right" aria-hidden="true"></i>
          </a>
        </div>

        <!-- Mobile hamburger -->
        <button
          class="hamburger"
          (click)="toggleMobile()"
          [attr.aria-label]="mobileOpen() ? 'Close menu' : 'Open menu'"
          [attr.aria-expanded]="mobileOpen()"
          aria-controls="mobile-menu"
        >
          <i class="ti ti-{{ mobileOpen() ? 'x' : 'menu-2' }}" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Mobile menu -->
      @if (mobileOpen()) {
        <nav id="mobile-menu" class="mobile-menu" aria-label="Mobile navigation">
          @for (link of links; track link.href) {
            <a [href]="link.href" (click)="mobileOpen.set(false)">{{ link.label }}</a>
          }
          <div class="mobile-menu-actions">
            <a routerLink="/dashboard" class="nav-btn-ghost mobile-full" (click)="mobileOpen.set(false)">Log in</a>
            <a routerLink="/dashboard" class="nav-btn-primary mobile-full" (click)="mobileOpen.set(false)">Launch App</a>
          </div>
        </nav>
      }
    </header>
  `,
  styles: [`
    .landing-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      padding: 20px 0;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .landing-nav.scrolled {
      background: rgba(10,6,18,0.88);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 4px 32px rgba(0,0,0,0.3);
    }
    .nav-container {
      max-width: 1200px; margin: 0 auto; padding: 0 24px;
      display: flex; align-items: center; gap: 24px;
    }
    .brand {
      font-size: 1.375rem; font-weight: 800; color: #fff;
      text-decoration: none; display: flex; align-items: center; gap: 8px;
      flex-shrink: 0; letter-spacing: -0.3px;
    }
    .brand span { color: var(--primary); }
    .brand-logo-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      background: rgba(205,180,219,0.15);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .nav-links { flex: 1; display: flex; justify-content: center; }
    .nav-links ul { display: flex; list-style: none; padding: 0; margin: 0; gap: 28px; }
    .nav-links a {
      color: rgba(255,255,255,0.72); font-size: 0.9375rem; font-weight: 500;
      text-decoration: none; transition: color 0.2s;
      padding: 4px 0; position: relative;
    }
    .nav-links a::after {
      content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
      height: 2px; background: var(--primary); border-radius: 1px;
      transform: scaleX(0); transition: transform 0.2s;
    }
    .nav-links a:hover { color: #fff; }
    .nav-links a:hover::after { transform: scaleX(1); }

    .nav-cta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .nav-theme-btn {
      width: 36px; height: 36px; border: none; background: rgba(255,255,255,0.08);
      border-radius: 10px; cursor: pointer; color: rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; transition: background 0.2s;
    }
    .nav-theme-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .nav-btn-ghost {
      padding: 8px 16px; border-radius: 10px; font-size: 0.9rem; font-weight: 600;
      color: rgba(255,255,255,0.8); text-decoration: none;
      border: 1.5px solid rgba(255,255,255,0.15);
      transition: all 0.2s; white-space: nowrap;
    }
    .nav-btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); color: #fff; }
    .nav-btn-primary {
      padding: 8px 18px; border-radius: 10px; font-size: 0.9rem; font-weight: 700;
      background: var(--primary-deeper); color: #fff; text-decoration: none;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.2s; white-space: nowrap; box-shadow: 0 4px 14px rgba(138,107,168,0.4);
    }
    .nav-btn-primary:hover { filter: brightness(1.12); box-shadow: 0 6px 20px rgba(138,107,168,0.5); transform: translateY(-1px); }
    .nav-btn-primary i { font-size: 14px; }

    .hamburger {
      display: none; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 10px; width: 40px; height: 40px; cursor: pointer;
      color: rgba(255,255,255,0.9); font-size: 18px; margin-left: auto;
      align-items: center; justify-content: center;
    }

    .mobile-menu {
      display: flex; flex-direction: column; gap: 4px;
      padding: 16px 24px 20px;
      background: rgba(10,6,18,0.96);
      backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255,255,255,0.06);
      animation: slideDown 0.2s ease;
    }
    .mobile-menu a {
      color: rgba(255,255,255,0.8); text-decoration: none;
      padding: 10px 12px; font-size: 0.9375rem; font-weight: 500;
      border-radius: 10px; transition: background 0.15s;
    }
    .mobile-menu a:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .mobile-menu-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .mobile-full { text-align: center; justify-content: center; }

    @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

    @media (max-width: 1024px) {
      .nav-links, .nav-cta { display: none; }
      .hamburger { display: flex; }
    }
    @media (max-width: 480px) {
      .nav-container { padding: 0 16px; }
      .mobile-menu-actions { grid-template-columns: 1fr; }
    }
  `],
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
