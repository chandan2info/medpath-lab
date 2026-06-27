import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserSessionService } from '../../core/services/user-session.service';

@Component({
  selector: 'app-lis-landing',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './lis-landing.component.html',
    styleUrl: './lis-landing.component.css',
})
export class LisLandingComponent {
  username = '';
  password = '';
  remember = false;
  showPw   = signal(false);
  loginError = signal(false);
  mobileMenuOpen = signal(false);

  protected readonly testCats = [
    { name:'Blood tests',    icon:'droplet',           desc:'CBC, Sugar, Lipid profile & more' },
    { name:'Thyroid tests',  icon:'activity',          desc:'T3, T4, TSH & advanced panels' },
    { name:'Liver function', icon:'heart-rate-monitor',desc:'LFT, liver enzymes & more' },
    { name:'Diabetes tests', icon:'needle',            desc:'FBS, PPBS, HbA1c & more' },
    { name:'Kidney function',icon:'lungs',             desc:'KFT, Creatinine, Urea & more' },
    { name:'Vitamin tests',  icon:'pill',              desc:'Vitamin D, B12 & more' },
  ];
  protected readonly stats = [
    { value:'10,000+',   label:'Happy patients' },
    { value:'1,50,000+', label:'Tests conducted' },
    { value:'98.6%',     label:'Accurate results' },
    { value:'24–48 hrs', label:'Report delivery' },
  ];
  protected readonly whyCards = [
    { icon:'certificate',  title:'Certified lab',         desc:'NABL certified laboratory with the highest quality standards and accreditation.' },
    { icon:'cpu',          title:'Advanced technology',   desc:'State-of-the-art diagnostic equipment for precise, reliable results every time.' },
    { icon:'stethoscope',  title:'Expert professionals',  desc:'Experienced pathologists and lab technicians overseeing every test.' },
    { icon:'headset',      title:'Patient support',       desc:'We are here to help you at every step — from booking to report collection.' },
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

  login(): void {
    if (this.session.login(this.username, this.password)) {
      this.loginError.set(false);
      this.router.navigate(['/dashboard/home']);
    } else {
      this.loginError.set(true);
    }
  }
}
