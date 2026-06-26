import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <!-- Skip-to-content for screen-reader users -->
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <router-outlet />
  `,
  styles: [`
    .skip-link {
      position: absolute; top: -40px; left: 0;
      background: #1D9E75; color: #fff;
      padding: 8px 16px; border-radius: 0 0 8px 0;
      text-decoration: none; font-size: 13px; z-index: 9999;
      transition: top 0.1s;
      &:focus { top: 0; }
    }
  `],
})
export class AppComponent {}
