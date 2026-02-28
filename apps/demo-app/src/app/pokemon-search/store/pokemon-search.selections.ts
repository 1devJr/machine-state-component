import { defineSelections } from '@machine-state-component/ui-state';

export function createPokemonSearchCoreSelections() {
  return defineSelections((state) => ({
    query: () => state().query,
    results: () => state().results,
    selectedPokemonName: () => state().selectedPokemonName,
    selectedPokemonDetails: () => state().selectedPokemonDetails,
    errorMessage: () => state().errorMessage,
    detailsStatus: () => state().detailsStatus,
    detailsErrorMessage: () => state().detailsErrorMessage,
  }));
}
