// =========================================================
// Landing Page Data Models
// Sourced from Cryptoflow component props & data files
// =========================================================

export interface HeroStat {
  value: string;
  label: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Feature {
  icon: string;        // lucide icon name → mapped to Angular equivalent
  title: string;
  description: string;
}

export interface PricingPlan {
  name: string;
  price: { monthly: string; annual: string };
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}
