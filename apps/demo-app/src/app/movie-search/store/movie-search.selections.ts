import type { Signal } from '@angular/core';
import { defineSelections } from '@machine-state-component/ui-state';
import { MovieSearchState } from './movie-search.types';

export function createMovieSearchCoreSelections() {
  return defineSelections((state: Signal<MovieSearchState>) => ({
    query: () => state().query,
    results: () => state().results,
    selectedMovieName: () => state().selectedMovieName,
    selectedMovieDetails: () => state().selectedMovieDetails,
    errorMessage: () => state().errorMessage,
    detailsStatus: () => state().detailsStatus,
    detailsErrorMessage: () => state().detailsErrorMessage,
  }));
}
