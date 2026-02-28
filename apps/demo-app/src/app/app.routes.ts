import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'movie-search',
  },
  {
    path: 'movie-search',
    loadComponent: () =>
      import('./movie-search/movie-search-core.component').then(
        (module) => module.MovieSearchCoreComponent,
      ),
  },
  {
    path: 'pokemon-search',
    loadComponent: () =>
      import('./pokemon-search/pokemon-search-core.component').then(
        (module) => module.PokemonSearchCoreComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'movie-search',
  },
];
