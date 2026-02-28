import { EngineState } from '@machine-state-component/ui-state';
import { Observable } from 'rxjs';

export type PokemonSearchStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PokemonDetailsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PokemonDetails {
  id: number;
  name: string;
  spriteUrl: string | null;
  types: string[];
  abilities: string[];
  heightDecimeters: number;
  weightHectograms: number;
  stats: Array<{
    name: string;
    value: number;
  }>;
  evolutions: string[];
}

export interface PokemonSearchState extends EngineState<PokemonSearchStatus> {
  query: string;
  results: string[];
  errorMessage: string | null;
  selectedPokemonName: string | null;
  selectedPokemonDetails: PokemonDetails | null;
  detailsStatus: PokemonDetailsStatus;
  detailsErrorMessage: string | null;
}

export interface PokemonSearchServices extends Record<string, unknown> {
  pokemonApi: {
    searchByName: (term: string) => Observable<string[]>;
    getPokemonDetails: (name: string) => Observable<PokemonDetails>;
  };
}

export interface PokemonSearchInputConfig {
  placeholder: string;
  buttonLabel: string;
}

export interface PokemonSearchResultsConfig {
  emptyMessage: string;
}

export interface PokemonSearchDetailsConfig {
  emptyMessage: string;
}

export function createPokemonSearchInitialState(): PokemonSearchState {
  return {
    status: 'idle',
    query: '',
    results: [],
    errorMessage: null,
    selectedPokemonName: null,
    selectedPokemonDetails: null,
    detailsStatus: 'idle',
    detailsErrorMessage: null,
  };
}
