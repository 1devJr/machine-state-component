import { defineSelections } from '@machine-state-component/ui-state';

export function createMovieSearchCoreSelections() {
  return defineSelections((state) => ({
    query: () => state().query,
    results: () => state().results,
    selectedMovieName: () => state().selectedMovieName,
    selectedMovieDetails: () => state().selectedMovieDetails,
    errorMessage: () => state().errorMessage,
    detailsStatus: () => state().detailsStatus,
    detailsErrorMessage: () => state().detailsErrorMessage,
  }));
}
