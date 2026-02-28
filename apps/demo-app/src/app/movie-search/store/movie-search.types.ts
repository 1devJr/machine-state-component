import { EngineState } from '@machine-state-component/ui-state';

export type MovieSearchStatus = 'idle' | 'loading' | 'ready' | 'error';

export type MovieDetailsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface MovieDetails {
  id: string;
  title: string;
  year: number;
  synopsis: string;
  genres: string[];
  rating: number;
  cast: string[];
}

export interface MovieSearchState extends EngineState<MovieSearchStatus> {
  query: string;
  results: string[];
  errorMessage: string | null;
  selectedMovieName: string | null;
  selectedMovieDetails: MovieDetails | null;
  detailsStatus: MovieDetailsStatus;
  detailsErrorMessage: string | null;
}

export interface MovieSearchInputConfig {
  placeholder: string;
  buttonLabel: string;
}

export interface MovieSearchResultsConfig {
  emptyMessage: string;
}

export interface MovieSearchDetailsConfig {
  emptyMessage: string;
}

export interface MovieSearchServices {
  [key: string]: unknown;
  movieApi: {
    search: (query: string) => string[];
    getDetails: (title: string) => MovieDetails | null;
  };
}

export function createMovieSearchInitialState(): MovieSearchState {
  return {
    status: 'idle',
    query: '',
    results: [],
    errorMessage: null,
    selectedMovieName: null,
    selectedMovieDetails: null,
    detailsStatus: 'idle',
    detailsErrorMessage: null,
  };
}
