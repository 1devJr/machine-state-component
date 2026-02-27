import { defineActionCatalog } from '@machine-state-component/ui-state';
import { PokemonDetails } from './pokemon-search.types';

export const pokemonSearchActionCatalog = defineActionCatalog({
  queryChanged: {
    type: 'search/queryChanged',
    payload: (query: string) => ({ query }),
  },
  submit: {
    type: 'search/submit',
  },
  loading: {
    type: 'search/loading',
  },
  success: {
    type: 'search/success',
    payload: (results: string[]) => ({ results }),
  },
  error: {
    type: 'search/error',
    payload: (message: string) => ({ message }),
  },
  selectPokemon: {
    type: 'pokemon/select',
    payload: (name: string) => ({ name }),
  },
  detailsLoading: {
    type: 'pokemon/detailsLoading',
    payload: (name: string) => ({ name }),
  },
  detailsSuccess: {
    type: 'pokemon/detailsSuccess',
    payload: (details: PokemonDetails) => ({ details }),
  },
  detailsError: {
    type: 'pokemon/detailsError',
    payload: (message: string) => ({ message }),
  },
  historyRecorded: {
    type: 'history/recorded',
    payload: (term: string) => ({ term }),
  },
  reset: {
    type: 'search/reset',
  },
});

export const pokemonSearchActionTypes = pokemonSearchActionCatalog.types;
export const pokemonSearchActions = pokemonSearchActionCatalog.creators;
