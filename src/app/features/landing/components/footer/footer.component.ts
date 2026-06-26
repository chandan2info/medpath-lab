import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink { label: string; href: string; }
interface FooterSection { title: string; links: FooterLink[]; }

const FOOTER_LINKS: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features',   href: '#features' },
      { label: 'Pricing',    href: '#pricing' },
      { label: 'Changelog',  href: '#!' },
      { label: 'Roadmap',    href: '#!' },
      { label: 'Status',     href: '#!' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',    href: '#!' },
      { label: 'Blog',     href: '#!' },
      { label: 'Careers',  href: '#!' },
      { label: 'Press',    href: '#!' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#!' },
      { label: 'Contact',     href: '#!' },
      { label: 'Community',   href: '#!' },
      { label: 'API Docs',    href: '#!' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#!' },
      { label: 'Terms of Use',   href: '#!' },
      { label: 'Cookie Policy',  href: '#!' },
      { label: 'Licenses',       href: '#!' },
    ],
  },
];

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="landing-footer" role="contentinfo">
      <div class="footer-inner">
        <!-- Brand column -->
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="footer-logo-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="var(--primary-deeper)"/>
                <path d="M7 14l5 5 9-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span>Crypto<span class="brand-accent">Flow</span></span>
          </div>
          <p class="footer-tagline">
            Trade smarter with AI-powered insights, real-time data, and zero-commission fees.
          </p>
          <!-- Socials -->
          <div class="footer-socials" aria-label="Social media links">
            <a href="#!" class="social-link" aria-label="Follow us on X (Twitter)">
              <i class="ti ti-brand-x" aria-hidden="true"></i>
            </a>
            <a href="#!" class="social-link" aria-label="Follow us on LinkedIn">
              <i class="ti ti-brand-linkedin" aria-hidden="true"></i>
            </a>
            <a href="#!" class="social-link" aria-label="View our GitHub">
              <i class="ti ti-brand-github" aria-hidden="true"></i>
            </a>
            <a href="#!" class="social-link" aria-label="Join our Discord">
              <i class="ti ti-brand-discord" aria-hidden="true"></i>
            </a>
          </div>
          <!-- Trust badges -->
          <div class="footer-badges" aria-label="Security certifications">
            <span class="trust-badge">
              <i class="ti ti-shield-check" aria-hidden="true"></i>
              SOC 2
            </span>
            <span class="trust-badge">
              <i class="ti ti-lock" aria-hidden="true"></i>
              256-bit AES
            </span>
            <span class="trust-badge">
              <i class="ti ti-certificate" aria-hidden="true"></i>
              ISO 27001
            </span>
          </div>
        </div>

        <!-- Link columns -->
        @for (section of sections; track section.title) {
          <nav class="footer-col" [attr.aria-label]="section.title + ' links'">
            <h3 class="footer-col-title">{{ section.title }}</h3>
            <ul role="list">
              @for (link of section.links; track link.label) {
                <li role="listitem">
                  <a [href]="link.href">{{ link.label }}</a>
                </li>
              }
            </ul>
          </nav>
        }
      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-inner">
          <p>© {{ year }} CryptoFlow, Inc. All rights reserved.</p>
          <p class="footer-bottom-note">
            Not financial advice. Crypto trading involves risk. Trade responsibly.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .landing-footer {
      background: #06040f;
      color: rgba(255,255,255,0.7);
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .footer-inner {
      max-width: 1200px; margin: 0 auto; padding: 64px 24px 48px;
      display: grid;
      grid-template-columns: 1.8fr 1fr 1fr 1fr 1fr;
      gap: 40px;
    }

    /* Brand */
    .footer-logo {
      display: flex; align-items: center; gap: 8px;
      font-size: 1.25rem; font-weight: 800; color: #fff;
      margin-bottom: 16px;
    }
    .footer-logo-icon {
      width: 34px; height: 34px; background: rgba(205,180,219,0.12);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
    }
    .brand-accent { color: var(--primary); }

    .footer-tagline {
      font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.65;
      max-width: 260px; margin: 0 0 20px;
    }

    .footer-socials { display: flex; gap: 8px; margin-bottom: 20px; }
    .social-link {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.6); font-size: 16px; text-decoration: none;
      transition: all 0.2s;
    }
    .social-link:hover { background: var(--primary-deeper); border-color: transparent; color: #fff; transform: translateY(-2px); }

    .footer-badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .trust-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5);
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 999px; padding: 4px 10px;
    }
    .trust-badge i { font-size: 12px; color: var(--primary); }

    /* Link columns */
    .footer-col-title {
      font-size: 12px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; color: rgba(255,255,255,0.9);
      margin: 0 0 16px;
    }
    .footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .footer-col a {
      font-size: 14px; color: rgba(255,255,255,0.5); text-decoration: none;
      transition: color 0.15s; display: inline-block;
    }
    .footer-col a:hover { color: rgba(255,255,255,0.9); }

    /* Bottom */
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); }
    .footer-bottom-inner {
      max-width: 1200px; margin: 0 auto; padding: 20px 24px;
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 8px;
    }
    .footer-bottom-inner p { margin: 0; font-size: 13px; color: rgba(255,255,255,0.35); }
    .footer-bottom-note { font-style: italic; }

    /* Responsive */
    @media (max-width: 1024px) {
      .footer-inner { grid-template-columns: 1fr 1fr 1fr; }
      .footer-brand { grid-column: 1/-1; }
    }
    @media (max-width: 640px) {
      .footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; padding: 40px 16px 32px; }
      .footer-brand { grid-column: 1/-1; }
      .footer-bottom-inner { flex-direction: column; text-align: center; gap: 6px; }
    }
    @media (max-width: 380px) {
      .footer-inner { grid-template-columns: 1fr; }
    }
  `],
})
export class FooterComponent {
  protected sections = FOOTER_LINKS;
  protected year = new Date().getFullYear();
}
