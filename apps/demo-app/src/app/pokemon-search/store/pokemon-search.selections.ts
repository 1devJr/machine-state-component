import type { Signal } from '@angular/core';
import { defineSelections } from '@machine-state-component/ui-state';
import { PokemonSearchState } from './pokemon-search.types';

export function createPokemonSearchCoreSelections() {
  return defineSelections((state: Signal<PokemonSearchState>) => ({
    query: () => state().query,
    results: () => state().results,
    selectedPokemonName: () => state().selectedPokemonName,
    selectedPokemonDetails: () => state().selectedPokemonDetails,
    errorMessage: () => state().errorMessage,
    detailsStatus: () => state().detailsStatus,
    detailsErrorMessage: () => state().detailsErrorMessage,
  }));
}
