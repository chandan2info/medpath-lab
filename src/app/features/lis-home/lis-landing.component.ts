import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserSessionService } from '../../core/services/user-session.service';

@Component({
  selector: 'app-lis-landing',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Navbar -->
    <nav class="lp-nav" role="navigation" aria-label="Site navigation">
      <div class="lp-nav-brand">
        <div class="lp-brand-icon" aria-hidden="true"><i class="ti ti-flask"></i></div>
        <div>
          <div class="lp-brand-name">MedPath Diagnostics</div>
          <div class="lp-brand-tag">Accurate Results. Better Health.</div>
        </div>
      </div>
      <div class="lp-nav-links" role="list">
        <a class="lp-link lp-link--active" href="#" role="listitem">Home</a>
        <a class="lp-link" href="#" role="listitem">About us</a>
        <a class="lp-link" href="#" role="listitem">Tests</a>
        <a class="lp-link" href="#" role="listitem">Our process</a>
        <a class="lp-link" href="#" role="listitem">Reports</a>
        <a class="lp-link" href="#" role="listitem">Contact us</a>
      </div>
      <div class="lp-nav-cta">
        <button class="lp-btn-outline" type="button">View reports</button>
        <button class="lp-btn-solid" type="button" (click)="scrollToLogin()">
          <i class="ti ti-calendar" aria-hidden="true"></i> Book a test
        </button>
      </div>
    </nav>

    <!-- Hero -->
    <section class="lp-hero" aria-label="Lab introduction">
      <div class="lp-hero-left">
        <div class="lp-eyebrow">
          <i class="ti ti-certificate" aria-hidden="true"></i> NABL Accredited Laboratory
        </div>
        <h1 class="lp-h1">Your health,<br>our priority.</h1>
        <p class="lp-sub">
          Advanced diagnostics with accurate results and personalised care you can trust —
          all from a single, streamlined system.
        </p>
        <div class="lp-trust" aria-label="Key qualities">
          <div class="lp-trust-item"><i class="ti ti-shield-check" aria-hidden="true"></i> Accurate results</div>
          <div class="lp-trust-item"><i class="ti ti-clock" aria-hidden="true"></i> Timely reports</div>
          <div class="lp-trust-item"><i class="ti ti-headset" aria-hidden="true"></i> Expert support</div>
        </div>
        <div class="lp-hero-btns">
          <button class="lp-btn-solid" type="button" (click)="scrollToLogin()">
            <i class="ti ti-calendar" aria-hidden="true"></i> Book a test
          </button>
          <button class="lp-btn-ghost" type="button">
            <i class="ti ti-file-text" aria-hidden="true"></i> View reports
          </button>
        </div>
      </div>

      <!-- Login card -->
      <div class="lp-hero-right">
        <div class="lp-login-card" id="login-card" role="region" aria-label="Operator login">
          <div class="lp-lc-head">
            <div class="lp-lc-icon" aria-hidden="true"><i class="ti ti-lock"></i></div>
            <div class="lp-lc-title">Operator login</div>
            <div class="lp-lc-sub">Sign in to access the lab system</div>
          </div>

          @if (loginError()) {
            <div class="lp-err-box" role="alert">
              <i class="ti ti-alert-circle" aria-hidden="true"></i>
              Invalid username or password.
            </div>
          }

          <div class="lp-field">
            <label for="lp-user">Username</label>
            <input id="lp-user" type="text" [(ngModel)]="username" placeholder="Enter your username" autocomplete="username" />
          </div>
          <div class="lp-field">
            <label for="lp-pass">Password</label>
            <div class="lp-pw-wrap">
              <input id="lp-pass" [type]="showPw() ? 'text' : 'password'" [(ngModel)]="password"
                placeholder="Enter password" autocomplete="current-password" />
              <button type="button" class="lp-pw-eye"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="showPw() ? 'Hide password' : 'Show password'"
              >
                <i [class]="showPw() ? 'ti ti-eye-off' : 'ti ti-eye'" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="lp-remember-row">
            <label class="lp-check">
              <input type="checkbox" [(ngModel)]="remember" /> Remember me
            </label>
            <a href="#" class="lp-forgot">Forgot password?</a>
          </div>
          <button type="button" class="lp-signin-btn" (click)="login()">
            <i class="ti ti-login" aria-hidden="true"></i> Sign in to dashboard
          </button>
          <div class="lp-secure-row">
            <i class="ti ti-shield-check" aria-hidden="true"></i>
            Secured · Single-user · MedPath LIS v2.4
          </div>
        </div>
      </div>
    </section>

    <!-- Test categories -->
    <section class="lp-section lp-section--alt" aria-label="Test categories">
      <div class="lp-section-title">Popular test categories</div>
      <div class="lp-section-sub">Comprehensive pathology testing across all major disciplines</div>
      <div class="lp-cat-grid">
        @for (cat of testCats; track cat.name) {
          <div class="lp-cat-card">
            <div class="lp-cat-icon" aria-hidden="true"><i [class]="'ti ti-' + cat.icon"></i></div>
            <div class="lp-cat-name">{{ cat.name }}</div>
            <div class="lp-cat-desc">{{ cat.desc }}</div>
          </div>
        }
      </div>
    </section>

    <!-- Stats band -->
    <div class="lp-stats-band" role="region" aria-label="Lab statistics">
      @for (s of stats; track s.label) {
        <div class="lp-stat">
          <div class="lp-stat-val">{{ s.value }}</div>
          <div class="lp-stat-lbl">{{ s.label }}</div>
        </div>
      }
    </div>

    <!-- Why choose -->
    <section class="lp-section" aria-label="Why choose MedPath">
      <div class="lp-section-title">Why choose MedPath?</div>
      <div class="lp-section-sub">Built for precision, designed for trust</div>
      <div class="lp-why-grid">
        @for (w of whyCards; track w.title) {
          <div class="lp-why-card">
            <div class="lp-why-icon" aria-hidden="true"><i [class]="'ti ti-' + w.icon"></i></div>
            <div class="lp-why-title">{{ w.title }}</div>
            <div class="lp-why-desc">{{ w.desc }}</div>
          </div>
        }
      </div>
    </section>

    <!-- CTA band -->
    <div class="lp-cta-band">
      <div class="lp-cta-icon" aria-hidden="true"><i class="ti ti-flask"></i></div>
      <div>
        <div class="lp-cta-title">Your health is our commitment.</div>
        <div class="lp-cta-sub">Book your test today and take a step towards a healthier you.</div>
      </div>
      <button class="lp-cta-btn" type="button">
        <i class="ti ti-calendar" aria-hidden="true"></i> Book a test now
      </button>
    </div>

    <!-- Footer -->
    <footer class="lp-footer" role="contentinfo">
      <div class="lp-footer-grid">
        <div>
          <div class="lp-footer-name">MedPath Diagnostics</div>
          <div class="lp-footer-tag">Accurate Results. Better Health.</div>
          <div class="lp-footer-socials" aria-label="Social media">
            @for (s of ['brand-facebook','brand-twitter','brand-instagram','brand-linkedin']; track s) {
              <div class="lp-social-btn" [attr.aria-label]="s.replace('brand-','')"><i [class]="'ti ti-' + s" aria-hidden="true"></i></div>
            }
          </div>
        </div>
        <div>
          <div class="lp-fc-title">Quick links</div>
          @for (l of ['Home','About us','Tests','Our process','Contact us']; track l) {
            <a class="lp-fc-link" href="#">{{ l }}</a>
          }
        </div>
        <div>
          <div class="lp-fc-title">Useful links</div>
          @for (l of ['Book a test','View reports','Test packages','Health tips','FAQ']; track l) {
            <a class="lp-fc-link" href="#">{{ l }}</a>
          }
        </div>
        <div>
          <div class="lp-fc-title">Contact us</div>
          <div class="lp-fc-contact"><i class="ti ti-map-pin" aria-hidden="true"></i> 123, Health Street, Medical Area, Bengaluru — 560001</div>
          <div class="lp-fc-contact"><i class="ti ti-phone" aria-hidden="true"></i> +91 98765 43210</div>
          <div class="lp-fc-contact"><i class="ti ti-mail" aria-hidden="true"></i> info&#64;medpath.in</div>
        </div>
        <div>
          <div class="lp-fc-title">Working hours</div>
          <div class="lp-fc-contact"><i class="ti ti-clock" aria-hidden="true"></i> Mon–Sat: 7:00 AM – 8:00 PM</div>
          <div class="lp-fc-contact"><i class="ti ti-clock" aria-hidden="true"></i> Sunday: 7:00 AM – 2:00 PM</div>
          <div class="lp-open-badge"><span class="lp-open-dot" aria-hidden="true"></span> Lab open now</div>
        </div>
      </div>
      <div class="lp-footer-bottom">
        <span>© 2026 MedPath Diagnostics. All rights reserved.</span>
        <div class="lp-footer-policy">
          <a href="#">Privacy policy</a>
          <a href="#">Terms &amp; conditions</a>
        </div>
      </div>
    </footer>
  `,
  styles:[`
    :host { display:block; font-family:var(--font-family,'DM Sans',sans-serif); background:var(--card-bg); }

    /* Nav */
    .lp-nav { display:flex; align-items:center; padding:0 28px; height:56px; background:var(--card-bg); border-bottom:0.5px solid var(--border-color); position:sticky; top:0; z-index:100; }
    .lp-nav-brand { display:flex; align-items:center; gap:9px; }
    .lp-brand-icon { width:34px; height:34px; background:#1D9E75; border-radius:9px; display:flex; align-items:center; justify-content:center; i { color:#fff; font-size:18px; } }
    .lp-brand-name { font-size:13px; font-weight:500; color:var(--text-primary); line-height:1.2; }
    .lp-brand-tag  { font-size:10px; color:var(--text-secondary); }
    .lp-nav-links  { display:flex; align-items:center; gap:0; margin:0 auto; }
    .lp-link { padding:0 14px; font-size:13px; color:var(--text-secondary); cursor:pointer; height:56px; display:flex; align-items:center; border-bottom:2px solid transparent; text-decoration:none; }
    .lp-link--active { color:#1D9E75; border-bottom-color:#1D9E75; font-weight:500; }
    .lp-link:hover { color:var(--text-primary); }
    .lp-nav-cta { display:flex; align-items:center; gap:8px; }
    .lp-btn-outline { padding:6px 14px; border:1.5px solid #1D9E75; border-radius:8px; font-size:12px; color:#1D9E75; cursor:pointer; background:transparent; font-weight:500; font-family:inherit; }
    .lp-btn-solid  { padding:6px 14px; border:1.5px solid #1D9E75; border-radius:8px; font-size:12px; color:#fff; cursor:pointer; background:#1D9E75; font-weight:500; display:inline-flex; align-items:center; gap:5px; font-family:inherit; i { font-size:13px; } }
    .lp-btn-ghost  { padding:8px 18px; background:transparent; color:#085041; border:1.5px solid #5DCAA5; border-radius:9px; font-size:13px; font-weight:500; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-family:inherit; i { font-size:14px; } }

    /* Hero */
    .lp-hero { display:grid; grid-template-columns:1fr 380px; min-height:320px; background:#F0FAF6; }
    @media (max-width:900px) { .lp-hero { grid-template-columns:1fr; } }
    .lp-hero-left { padding:36px 32px 32px; display:flex; flex-direction:column; justify-content:center; }
    .lp-eyebrow { display:inline-flex; align-items:center; gap:6px; font-size:11px; color:#085041; font-weight:500; background:#D8F2E8; padding:4px 10px; border-radius:20px; margin-bottom:12px; width:fit-content; i { font-size:12px; } }
    .lp-h1  { font-size:28px; font-weight:500; color:#04342C; line-height:1.25; margin:0 0 10px; }
    .lp-sub { font-size:13px; color:#0F6E56; line-height:1.6; margin:0 0 18px; max-width:360px; }
    .lp-trust { display:flex; gap:18px; margin-bottom:22px; flex-wrap:wrap; }
    .lp-trust-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#085041; i { font-size:14px; color:#1D9E75; } }
    .lp-hero-btns { display:flex; gap:10px; flex-wrap:wrap; }
    .lp-hero-right { display:flex; align-items:center; justify-content:center; background:#E1F5EE; padding:24px; position:relative; overflow:hidden; }

    /* Login card */
    .lp-login-card { background:var(--card-bg); border:0.5px solid #9FE1CB; border-radius:14px; padding:22px; width:100%; max-width:295px; box-shadow:0 4px 24px rgba(29,158,117,0.08); }
    .lp-lc-head   { text-align:center; margin-bottom:18px; }
    .lp-lc-icon   { width:42px; height:42px; background:#E1F5EE; border-radius:11px; display:flex; align-items:center; justify-content:center; margin:0 auto 9px; i { color:#1D9E75; font-size:21px; } }
    .lp-lc-title  { font-size:14px; font-weight:500; color:var(--text-primary); }
    .lp-lc-sub    { font-size:11px; color:var(--text-secondary); margin-top:2px; }
    .lp-err-box   { background:#FCEBEB; border-radius:7px; padding:8px 10px; font-size:11px; color:#791F1F; display:flex; align-items:center; gap:6px; margin-bottom:12px; i { font-size:14px; } }
    .lp-field     { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; label { font-size:11px; color:var(--text-secondary); font-weight:500; } input { height:34px; border:0.5px solid var(--border-color); border-radius:8px; padding:0 10px; font-size:12px; color:var(--text-primary); background:var(--card-bg); outline:none; width:100%; font-family:inherit; &:focus { border-color:#1D9E75; } } }
    .lp-pw-wrap   { position:relative; display:flex; align-items:center; input { flex:1; padding-right:34px; } }
    .lp-pw-eye    { position:absolute; right:9px; background:none; border:none; cursor:pointer; color:var(--text-secondary); font-size:15px; }
    .lp-remember-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:13px; }
    .lp-check { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-secondary); cursor:pointer; input { width:auto; height:auto; margin:0; } }
    .lp-forgot { font-size:11px; color:#1D9E75; text-decoration:none; }
    .lp-signin-btn { width:100%; padding:9px; background:#1D9E75; color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:500; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; font-family:inherit; &:hover { filter:brightness(1.07); } i { font-size:14px; } }
    .lp-secure-row { display:flex; align-items:center; justify-content:center; gap:5px; margin-top:10px; font-size:10px; color:#085041; i { font-size:12px; } }

    /* Sections */
    .lp-section    { padding:34px 28px; }
    .lp-section--alt { background:var(--body-bg); }
    .lp-section-title { text-align:center; font-size:18px; font-weight:500; color:var(--text-primary); margin-bottom:5px; }
    .lp-section-sub   { text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:22px; }

    /* Test categories */
    .lp-cat-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
    @media (max-width:1100px) { .lp-cat-grid { grid-template-columns:repeat(3,1fr); } }
    @media (max-width:600px)  { .lp-cat-grid { grid-template-columns:repeat(2,1fr); } }
    .lp-cat-card { background:var(--card-bg); border:0.5px solid var(--border-color); border-radius:10px; padding:14px 10px; text-align:center; cursor:pointer; transition:border-color 0.15s; &:hover { border-color:#5DCAA5; } }
    .lp-cat-icon { width:38px; height:38px; background:#E1F5EE; border-radius:9px; display:flex; align-items:center; justify-content:center; margin:0 auto 9px; i { font-size:19px; color:#1D9E75; } }
    .lp-cat-name { font-size:12px; font-weight:500; color:var(--text-primary); margin-bottom:3px; }
    .lp-cat-desc { font-size:10px; color:var(--text-secondary); line-height:1.4; }

    /* Stats band */
    .lp-stats-band { background:#085041; padding:20px 28px; display:grid; grid-template-columns:repeat(4,1fr); gap:0; }
    @media (max-width:700px) { .lp-stats-band { grid-template-columns:repeat(2,1fr); gap:12px; } }
    .lp-stat { text-align:center; padding:0 14px; border-right:1px solid rgba(255,255,255,0.12); &:last-child { border-right:none; } }
    .lp-stat-val { font-size:20px; font-weight:500; color:#fff; }
    .lp-stat-lbl { font-size:11px; color:#9FE1CB; margin-top:3px; }

    /* Why choose */
    .lp-why-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    @media (max-width:900px) { .lp-why-grid { grid-template-columns:repeat(2,1fr); } }
    .lp-why-card { background:var(--body-bg); border-radius:10px; padding:15px; display:flex; flex-direction:column; gap:7px; }
    .lp-why-icon { width:35px; height:35px; background:#E1F5EE; border-radius:9px; display:flex; align-items:center; justify-content:center; i { font-size:18px; color:#1D9E75; } }
    .lp-why-title { font-size:13px; font-weight:500; color:var(--text-primary); }
    .lp-why-desc  { font-size:11px; color:var(--text-secondary); line-height:1.5; }

    /* CTA band */
    .lp-cta-band { background:#1D9E75; padding:22px 28px; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
    .lp-cta-icon { width:46px; height:46px; background:rgba(255,255,255,0.15); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; i { font-size:21px; color:#fff; } }
    .lp-cta-title { font-size:14px; font-weight:500; color:#fff; flex:1; }
    .lp-cta-sub   { font-size:12px; color:#9FE1CB; margin-top:2px; }
    .lp-cta-btn   { padding:8px 18px; background:#fff; color:#085041; border:none; border-radius:9px; font-size:12px; font-weight:500; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:5px; font-family:inherit; i { font-size:13px; } }

    /* Footer */
    .lp-footer { background:#04342C; padding:26px 28px 14px; }
    .lp-footer-grid { display:grid; grid-template-columns:1.6fr 1fr 1fr 1.2fr 1.1fr; gap:20px; margin-bottom:20px; }
    @media (max-width:900px) { .lp-footer-grid { grid-template-columns:repeat(2,1fr); } }
    .lp-footer-name  { font-size:13px; font-weight:500; color:#fff; margin-bottom:3px; }
    .lp-footer-tag   { font-size:11px; color:#5DCAA5; margin-bottom:10px; }
    .lp-footer-socials { display:flex; gap:7px; }
    .lp-social-btn { width:27px; height:27px; border-radius:6px; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; cursor:pointer; i { font-size:13px; color:#9FE1CB; } }
    .lp-fc-title { font-size:12px; font-weight:500; color:#fff; margin-bottom:9px; }
    .lp-fc-link  { display:block; font-size:11px; color:#9FE1CB; margin-bottom:5px; text-decoration:none; &:hover { color:#fff; } }
    .lp-fc-contact { display:flex; align-items:flex-start; gap:6px; font-size:11px; color:#9FE1CB; margin-bottom:6px; line-height:1.4; i { font-size:12px; flex-shrink:0; margin-top:1px; color:#5DCAA5; } }
    .lp-open-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(29,158,117,0.2); padding:3px 9px; border-radius:20px; font-size:11px; color:#9FE1CB; margin-top:8px; }
    .lp-open-dot { width:7px; height:7px; border-radius:50%; background:#5DCAA5; }
    .lp-footer-bottom { border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; font-size:11px; color:#5DCAA5; }
    .lp-footer-policy { display:flex; gap:14px; a { font-size:11px; color:#5DCAA5; text-decoration:none; &:hover { color:#fff; } } }
  `]
})
export class LisLandingComponent {
  username = 'ravi.anand';
  password = '';
  remember = true;
  showPw   = signal(false);
  loginError = signal(false);

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
