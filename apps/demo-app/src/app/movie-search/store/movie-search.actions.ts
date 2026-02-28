import { defineActionCatalog } from '@machine-state-component/ui-state';
import { MovieDetails } from './movie-search.types';

export const movieSearchActionCatalog = defineActionCatalog({
  queryChanged: {
    type: 'movie/queryChanged',
    payload: (query: string) => ({ query }),
  },
  submit: {
    type: 'movie/submit',
  },
  loading: {
    type: 'movie/loading',
  },
  success: {
    type: 'movie/success',
    payload: (results: string[]) => ({ results }),
  },
  error: {
    type: 'movie/error',
    payload: (message: string) => ({ message }),
  },
  selectMovie: {
    type: 'movie/select',
    payload: (name: string) => ({ name }),
  },
  detailsLoading: {
    type: 'movie/detailsLoading',
    payload: (name: string) => ({ name }),
  },
  detailsSuccess: {
    type: 'movie/detailsSuccess',
    payload: (details: MovieDetails) => ({ details }),
  },
  detailsError: {
    type: 'movie/detailsError',
    payload: (message: string) => ({ message }),
  },
  historyRecorded: {
    type: 'history/recorded',
    payload: (term: string) => ({ term }),
  },
  reset: {
    type: 'movie/reset',
  },
});

export const movieSearchActions = movieSearchActionCatalog.creators;
export const movieSearchActionTypes = movieSearchActionCatalog.types;
