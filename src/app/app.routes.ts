import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home.page'),
  },
  {
    path: 'buttons',
    loadComponent: () => import('./buttons.page'),
  },
];
