import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'import',
    loadComponent: () => import('./pages/import.page').then((m) => m.ImportPage),
  },
  {
    path: 'demo',
    loadComponent: () => import('./pages/demo.page').then((m) => m.DemoPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'loans/:loanId/obligations/:obligationId',
    loadComponent: () =>
      import('./pages/obligation-detail.page').then(
        (m) => m.ObligationDetailPage,
      ),
  },
  {
    path: 'loans/:loanId/obligations/:obligationId/evidence',
    loadComponent: () =>
      import('./pages/evidence.page').then((m) => m.EvidencePage),
  },
  { path: '**', redirectTo: '' },
];

