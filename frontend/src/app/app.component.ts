import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './components/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  template: `
    <div class="nav">
      <div class="brand">CovenantOps</div>
      <div>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
          >Dashboard</a
        >
        <a routerLink="/import" routerLinkActive="active">Import</a>
        <a routerLink="/demo" routerLinkActive="active">Demo Data</a>
        <a routerLink="/settings" routerLinkActive="active">Settings</a>
      </div>
    </div>
    <div class="container">
      <router-outlet />
    </div>
    <app-toast-container></app-toast-container>
  `,
})
export class AppComponent {}

