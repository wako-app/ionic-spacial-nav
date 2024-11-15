import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'movies',
    pathMatch: 'full',
  },
  {
    path: 'movies',
    loadComponent: () => import('./movies.page'),
  },
  {
    path: 'buttons',
    loadComponent: () => import('./buttons.page'),
  },
  {
    path: 'overlays',
    loadComponent: () => import('./overlays.page'),
  },
];
