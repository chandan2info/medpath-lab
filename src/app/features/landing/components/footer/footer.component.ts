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
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css',
})
export class FooterComponent {
  protected sections = FOOTER_LINKS;
  protected year = new Date().getFullYear();
}
