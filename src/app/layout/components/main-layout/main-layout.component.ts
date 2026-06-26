import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent }  from '../topbar/topbar.component';
import { SidebarService }   from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NgClass, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  protected readonly sidebar = inject(SidebarService);
}
