import { Routes } from '@angular/router';

const routes: Routes = [
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
    ],
  },

  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];

export default routes;
