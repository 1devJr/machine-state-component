import { defineKernelTransitions } from '@machine-state-component/ui-state';
import { pokemonSearchActions } from './pokemon-search.actions';
import {
  createPokemonSearchInitialState,
  PokemonSearchState,
} from './pokemon-search.types';

export function createPokemonSearchTransitions() {
  return defineKernelTransitions<PokemonSearchState>()(
    pokemonSearchActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.queryChanged, (state, event) => ({
          ...state,
          query: event.query,
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
          errorMessage: event.message,
          results: [],
        }))
        .globalOn(actions.selectPokemon, (state, event) => ({
          ...state,
          selectedPokemonName: event.name,
          selectedPokemonDetails: null,
          detailsStatus: 'loading',
          detailsErrorMessage: null,
        }))
        .globalOn(actions.detailsLoading, (state, event) => ({
          ...state,
          selectedPokemonName: event.name,
          selectedPokemonDetails: null,
          detailsStatus: 'loading',
          detailsErrorMessage: null,
        }))
        .globalOn(actions.detailsSuccess, (state, event) => ({
          ...state,
          selectedPokemonName: event.details.name,
          selectedPokemonDetails: event.details,
          detailsStatus: 'ready',
          detailsErrorMessage: null,
        }))
        .globalOn(actions.detailsError, (state, event) => ({
          ...state,
          selectedPokemonDetails: null,
          detailsStatus: 'error',
          detailsErrorMessage: event.message,
        }))
        .globalOn(actions.reset, () => createPokemonSearchInitialState())
        .done(),
  );
}
