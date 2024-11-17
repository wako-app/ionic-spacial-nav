import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./movies.page'),
  },
  {
    path: ':id',
    loadComponent: () => import('./movie.page'),
  },
];

export default routes;
