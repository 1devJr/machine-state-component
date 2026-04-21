import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pokemon-search',
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
    path: 'core',
    loadComponent: () =>
      import('./my-core/my-core-core.component').then(
        (module) => module.MyCoreCoreComponent,
      ),
  },
  {
    path: 'task-board',
    loadComponent: () =>
      import('./task-board/task-board-core.component').then(
        (module) => module.TaskBoardCoreComponent,
      ),
  },
  {
    path: 'project-overview',
    loadComponent: () =>
      import('./project-overview/project-overview-core.component').then(
        (module) => module.ProjectOverviewCoreComponent,
      ),
  },
  {
    path: 'project-overview/new-task',
    loadComponent: () =>
      import('./project-overview/project-overview-task-page.component').then(
        (module) => module.ProjectOverviewTaskPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'pokemon-search',
  },
];
