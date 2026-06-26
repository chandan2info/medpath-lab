import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavbarComponent }          from './components/navbar/navbar.component';
import { HeroComponent }            from './components/hero/hero.component';
import { FeaturesSectionComponent } from './components/features-section/features-section.component';
import { PricingComponent }         from './components/pricing/pricing.component';
import { FooterComponent }          from './components/footer/footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    FeaturesSectionComponent,
    PricingComponent,
    FooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-landing-navbar />
    <main>
      <app-landing-hero />
      <app-landing-features />
      <app-landing-pricing />
    </main>
    <app-landing-footer />
  `,
  styles: [`
    :host { display: block; }
    main { overflow: hidden; }
  `],
})
export class LandingComponent {}
