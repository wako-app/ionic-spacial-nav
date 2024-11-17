import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./page-shell.component'),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home.page'),
      },
      {
        path: 'movies',
        loadChildren: () => import('./movies/movies.routes'),
      },
      {
        path: 'buttons',
        loadComponent: () => import('./buttons.page'),
      },
      {
        path: 'overlays',
        loadComponent: () => import('./overlays.page'),
      },
      {
        path: 'lists',
        loadComponent: () => import('./lists.page'),
      },
    ],
  },

  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];

export default routes;
