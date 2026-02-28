import { defineKernelTransitions } from '@machine-state-component/ui-state';
import { movieSearchActions } from './movie-search.actions';
import {
  createMovieSearchInitialState,
  MovieSearchState,
} from './movie-search.types';

export function createMovieSearchTransitions() {
  return defineKernelTransitions<MovieSearchState>()(
    movieSearchActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.queryChanged, (state, event) => ({
          ...state,
          query: event.query,
          errorMessage: null,
        }))
        .globalOn(actions.submit, (state) => ({
          ...state,
          status: 'loading',
          errorMessage: null,
        }))
        .globalOn(actions.loading, (state) => ({
          ...state,
          status: 'loading',
          errorMessage: null,
        }))
        .globalOn(actions.success, (state, event) => ({
          ...state,
          status: 'ready',
          results: event.results,
          errorMessage: null,
        }))
        .globalOn(actions.error, (state, event) => ({
          ...state,
          status: 'error',
          results: [],
          errorMessage: event.message,
        }))
        .globalOn(actions.selectMovie, (state, event) => ({
          ...state,
          selectedMovieName: event.name,
          detailsStatus: 'loading',
          detailsErrorMessage: null,
        }))
        .globalOn(actions.detailsLoading, (state, event) => ({
          ...state,
          selectedMovieName: event.name,
          detailsStatus: 'loading',
          detailsErrorMessage: null,
        }))
        .globalOn(actions.detailsSuccess, (state, event) => ({
          ...state,
          detailsStatus: 'ready',
          selectedMovieDetails: event.details,
          detailsErrorMessage: null,
        }))
        .globalOn(actions.detailsError, (state, event) => ({
          ...state,
          detailsStatus: 'error',
          selectedMovieDetails: null,
          detailsErrorMessage: event.message,
        }))
        .globalOn(actions.reset, () => createMovieSearchInitialState())
        .done(),
  );
}
