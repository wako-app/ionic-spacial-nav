import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/page-shell.routes'),
  },
  {
    path: '**',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
