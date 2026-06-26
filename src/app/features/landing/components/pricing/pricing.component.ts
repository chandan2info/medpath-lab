import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

interface PricingPlan {
  name: string;
  icon: string;
  price: { monthly: string; annual: string };
  priceSub?: string;
  description: string;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: 'Starter', icon: 'sparkles',
    price: { monthly: '$0', annual: '$0' },
    description: 'Perfect for beginners exploring the crypto markets for the first time.',
    features: ['Up to 5 trades/day', '10 supported assets', 'Basic analytics dashboard', 'Email support', 'Portfolio tracking'],
    buttonText: 'Get Started Free',
  },
  {
    name: 'Pro', icon: 'rocket', highlighted: true,
    price: { monthly: '$29', annual: '$23' },
    priceSub: '/month',
    description: 'For active traders who demand advanced tools, AI signals, and priority access.',
    features: ['Unlimited trades', '200+ assets & pairs', 'AI trading signals', 'Priority support (24/7)', 'Advanced portfolio analytics', 'API access', 'Custom alerts'],
    buttonText: 'Start 14-Day Trial',
  },
  {
    name: 'Enterprise', icon: 'building',
    price: { monthly: '$99', annual: '$79' },
    priceSub: '/month',
    description: 'Custom solutions for institutions, funds, and professional trading desks.',
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', '99.9% SLA guarantee', 'Compliance toolkit', 'White-label options', 'Volume discounts'],
    buttonText: 'Contact Sales',
  },
];

@Component({
  selector: 'app-landing-pricing',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="pricing" class="pricing-section" aria-label="Pricing plans">
      <div class="section-inner">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Pricing</span>
          <h2 class="section-title">
            Simple, transparent<br/>
            <span class="title-accent">pricing for every trader</span>
          </h2>
          <p class="section-desc">
            Choose the plan that fits your trading style. Upgrade or downgrade any time. All plans include a 14-day free trial.
          </p>

          <!-- Billing toggle -->
          <div class="billing-toggle" role="group" aria-label="Billing period">
            <button
              [ngClass]="{ active: billing() === 'monthly' }"
              (click)="billing.set('monthly')"
              [attr.aria-pressed]="billing() === 'monthly'"
            >Monthly</button>
            <button
              [ngClass]="{ active: billing() === 'annual' }"
              (click)="billing.set('annual')"
              [attr.aria-pressed]="billing() === 'annual'"
            >
              Annual
              <span class="save-chip" aria-label="Save 20%">-20%</span>
            </button>
          </div>
        </div>

        <!-- Plans -->
        <div class="plans-grid" role="list">
          @for (plan of plans; track plan.name) {
            <article
              class="plan-card"
              [ngClass]="{ highlighted: plan.highlighted }"
              role="listitem"
              [attr.aria-label]="plan.name + ' plan'"
            >
              @if (plan.highlighted) {
                <div class="popular-badge" aria-label="Most popular plan">
                  <i class="ti ti-star-filled" aria-hidden="true"></i>
                  Most Popular
                </div>
              }

              <div class="plan-icon" [ngClass]="plan.highlighted ? 'plan-icon-hl' : ''" aria-hidden="true">
                <i class="ti ti-{{ plan.icon }}"></i>
              </div>

              <h3 class="plan-name">{{ plan.name }}</h3>

              <div class="plan-price-row">
                <span class="plan-price">{{ billing() === 'monthly' ? plan.price.monthly : plan.price.annual }}</span>
                @if (plan.priceSub) {
                  <span class="plan-price-sub">{{ plan.priceSub }}</span>
                }
              </div>
              @if (billing() === 'annual' && plan.priceSub) {
                <p class="plan-annual-note">Billed annually</p>
              }

              <p class="plan-desc">{{ plan.description }}</p>

              <button
                class="plan-btn"
                [ngClass]="plan.highlighted ? 'plan-btn-primary' : 'plan-btn-outline'"
                [attr.aria-label]="plan.buttonText + ' for ' + plan.name + ' plan'"
              >
                {{ plan.buttonText }}
              </button>

              <div class="plan-features-title" aria-hidden="true">What's included:</div>
              <ul class="plan-features" [attr.aria-label]="plan.name + ' plan features'">
                @for (f of plan.features; track f) {
                  <li>
                    <i class="ti ti-check" aria-hidden="true"></i>
                    <span>{{ f }}</span>
                  </li>
                }
              </ul>
            </article>
          }
        </div>

        <!-- Bottom note -->
        <p class="pricing-note" aria-live="polite">
          <i class="ti ti-shield-check" aria-hidden="true"></i>
          No credit card required to start. Cancel anytime. All plans include 14-day free access to Pro features.
        </p>
      </div>
    </section>
  `,
  styles: [`
    .pricing-section {
      padding: 96px 0;
      background: linear-gradient(175deg, #0f0b22 0%, #0d0820 100%);
      color: #fff; position: relative; overflow: hidden;
    }
    .pricing-section::before {
      content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 800px; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(205,180,219,0.3), transparent);
    }

    .section-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    .section-header { text-align: center; margin-bottom: 56px; }
    .section-eyebrow {
      display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: var(--primary);
      background: rgba(205,180,219,0.1); border: 1px solid rgba(205,180,219,0.2);
      padding: 5px 14px; border-radius: 999px; margin-bottom: 16px;
    }
    .section-title {
      font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800;
      line-height: 1.15; letter-spacing: -0.5px; margin: 0 0 16px;
    }
    .title-accent {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .section-desc { color: rgba(255,255,255,0.6); font-size: 1rem; max-width: 500px; margin: 0 auto 28px; line-height: 1.7; }

    .billing-toggle {
      display: inline-flex;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 999px; padding: 4px; gap: 2px;
    }
    .billing-toggle button {
      padding: 8px 22px; border: none; background: transparent;
      color: rgba(255,255,255,0.6); border-radius: 999px;
      cursor: pointer; font-size: 14px; font-weight: 500; font-family: inherit;
      transition: all 0.2s; display: flex; align-items: center; gap: 7px;
    }
    .billing-toggle button.active { background: var(--primary-deeper); color: #fff; font-weight: 700; }
    .save-chip {
      font-size: 11px; font-weight: 700; background: rgba(16,185,129,0.2);
      color: #10b981; padding: 2px 7px; border-radius: 999px;
    }

    .plans-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 20px; align-items: start; margin-bottom: 32px;
    }

    .plan-card {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; padding: 28px; position: relative; overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .plan-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.3); }
    .plan-card.highlighted {
      background: rgba(138,107,168,0.12);
      border-color: rgba(205,180,219,0.35);
      box-shadow: 0 8px 40px rgba(138,107,168,0.2);
    }

    .popular-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--primary-deeper); color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 5px 12px; border-radius: 999px; margin-bottom: 16px;
    }
    .popular-badge i { font-size: 11px; color: #fbbf24; }

    .plan-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; color: rgba(255,255,255,0.7); margin-bottom: 16px;
    }
    .plan-icon-hl { background: rgba(205,180,219,0.15); border-color: rgba(205,180,219,0.3); color: var(--primary); }

    .plan-name { font-size: 1.125rem; font-weight: 700; margin: 0 0 10px; }
    .plan-price-row { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 4px; }
    .plan-price { font-size: 2.5rem; font-weight: 800; line-height: 1; }
    .plan-price-sub { font-size: 14px; color: rgba(255,255,255,0.5); padding-bottom: 6px; }
    .plan-annual-note { font-size: 11px; color: rgba(255,255,255,0.4); margin: 0 0 12px; }
    .plan-desc { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; margin: 8px 0 20px; }

    .plan-btn {
      width: 100%; padding: 12px; border-radius: 12px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: all 0.2s; margin-bottom: 24px;
    }
    .plan-btn-primary {
      background: var(--primary-deeper); color: #fff; border: none;
      box-shadow: 0 4px 14px rgba(138,107,168,0.4);
    }
    .plan-btn-primary:hover { filter: brightness(1.1); box-shadow: 0 6px 20px rgba(138,107,168,0.5); }
    .plan-btn-outline {
      background: transparent; border: 1.5px solid rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.85);
    }
    .plan-btn-outline:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.3); }

    .plan-features-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 9px; }
    .plan-features li { display: flex; align-items: flex-start; gap: 9px; font-size: 14px; color: rgba(255,255,255,0.75); }
    .plan-features i { color: var(--primary); font-size: 15px; flex-shrink: 0; margin-top: 1px; }

    .pricing-note {
      text-align: center; font-size: 13px; color: rgba(255,255,255,0.45);
      display: flex; align-items: center; justify-content: center; gap: 7px;
    }
    .pricing-note i { color: var(--primary); font-size: 15px; }

    @media (max-width: 900px)  { .plans-grid { grid-template-columns: 1fr; max-width: 480px; margin-inline: auto; } }
    @media (max-width: 480px)  { .pricing-section { padding: 64px 0; } .section-inner { padding: 0 16px; } }
  `],
})
export class PricingComponent {
  protected billing = signal<'monthly' | 'annual'>('monthly');
  protected plans   = PLANS;
}
