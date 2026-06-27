import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { SidebarComponent }  from '../sidebar/sidebar.component';
import { TopbarComponent }   from '../topbar/topbar.component';
import { SidebarService }    from '../../../core/services/sidebar.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NgClass, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  protected readonly sidebar = inject(SidebarService);
  private readonly nav = inject(NavigationService);

  ngOnInit(): void {
    // Seed initial badge counts from the data layer (replace with HTTP in production)
    this.nav.syncFromSnapshot({ billing: 3, reports: 5, tracking: 8 });
  }
}
