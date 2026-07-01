import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserSessionService } from '../../core/services/user-session.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-lis-landing',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './lis-landing.component.html',
    styleUrl: './lis-landing.component.css',
})
export class LisLandingComponent {
  private readonly themeService = inject(ThemeService);

  username = '';
  password = '';
  remember = false;
  showPw   = signal(false);
  loginError = signal(false);
  mobileMenuOpen = signal(false);

  /** Drives the sun/moon icon and a11y labels on the theme toggle. */
  protected readonly isDark = computed(() => this.themeService.theme() === 'dark');

  protected readonly testCats = [
    { name:'Blood tests',    icon:'droplet',           desc:'CBC, Sugar, Lipid profile & more',       bg:'#DCEAFE', fg:'#3B82F6' },
    { name:'Thyroid tests',  icon:'activity',          desc:'T3, T4, TSH & advanced panels',          bg:'#F1E4FB', fg:'#8B5CF6' },
    { name:'Liver function', icon:'heart-rate-monitor',desc:'LFT, liver enzymes & more',              bg:'#FDECD5', fg:'#F59E0B' },
    { name:'Diabetes tests', icon:'needle',            desc:'FBS, PPBS, HbA1c & more',                bg:'#FCE1E4', fg:'#EF4444' },
    { name:'Kidney function',icon:'lungs',             desc:'KFT, Creatinine, Urea & more',           bg:'#D8F2E8', fg:'#14B8A6' },
    { name:'Vitamin tests',  icon:'pill',              desc:'Vitamin D, B12 & more',                  bg:'#FDF1D6', fg:'#F0B429' },
  ];
  protected readonly stats = [
    { value:'10,000+',   label:'Happy patients',   icon:'users',        fg:'#1D9E75' },
    { value:'1,50,000+', label:'Tests conducted',  icon:'flask',        fg:'#3B82F6' },
    { value:'98.6%',     label:'Accurate results', icon:'target-arrow', fg:'#8B5CF6' },
    { value:'24–48 hrs', label:'Report delivery',  icon:'clock',        fg:'#F59E0B' },
  ];
  protected readonly whyCards = [
    { icon:'certificate',  title:'Certified lab',         desc:'NABL certified laboratory with the highest quality standards and accreditation.', bg:'#D8F2E8', fg:'#1D9E75' },
    { icon:'cpu',          title:'Advanced technology',   desc:'State-of-the-art diagnostic equipment for precise, reliable results every time.', bg:'#E0E7FF', fg:'#6366F1' },
    { icon:'stethoscope',  title:'Expert professionals',  desc:'Experienced pathologists and lab technicians overseeing every test.',              bg:'#FDECD5', fg:'#F59E0B' },
    { icon:'headset',      title:'Patient support',       desc:'We are here to help you at every step — from booking to report collection.',       bg:'#FCE1E4', fg:'#F43F5E' },
  ];

  constructor(
    private router: Router,
    private session: UserSessionService
  ) {}

  scrollToLogin(): void {
    document.getElementById('login-card')?.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  togglePasswordVisibility(): void {
    this.showPw.set(!this.showPw());
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  login(): void {
    if (this.session.login(this.username, this.password)) {
      this.loginError.set(false);
      this.router.navigate(['/dashboard/home']);
    } else {
      this.loginError.set(true);
    }
  }
}
