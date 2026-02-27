import {
  defineCoreKernel,
  defineStore,
} from '@machine-state-component/ui-state';
import { movieSearchActions } from './movie-search.actions';
import { createMovieSearchEffects } from './movie-search.effects';
import { createMovieSearchCoreSelections } from './movie-search.selections';
import { createMovieSearchTransitions } from './movie-search.transitions';
import {
  createMovieSearchInitialState,
  MovieSearchState,
} from './movie-search.types';

export const movieSearchKernel = defineCoreKernel({
  id: 'movie-search-core',
  store: defineStore<MovieSearchState>({
    initialState: createMovieSearchInitialState(),
  }),
  actions: movieSearchActions,
  transitions: createMovieSearchTransitions(),
  effects: createMovieSearchEffects(),
  selections: createMovieSearchCoreSelections(),
});

export const PluggableBase = movieSearchKernel.PluggableBase;
