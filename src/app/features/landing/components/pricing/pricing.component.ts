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
    templateUrl: './pricing.component.html',
    styleUrl: './pricing.component.css',
})
export class PricingComponent {
  protected billing = signal<'monthly' | 'annual'>('monthly');
  protected plans   = PLANS;
}
