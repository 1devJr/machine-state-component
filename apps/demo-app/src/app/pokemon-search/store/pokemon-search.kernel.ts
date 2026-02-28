import {
  defineCoreKernel,
  defineStore,
} from '@machine-state-component/ui-state';
import { pokemonSearchActions } from './pokemon-search.actions';
import { createPokemonSearchEffects } from './pokemon-search.effects';
import { createPokemonSearchCoreSelections } from './pokemon-search.selections';
import { createPokemonSearchTransitions } from './pokemon-search.transitions';
import {
  createPokemonSearchInitialState,
  PokemonSearchState,
} from './pokemon-search.types';

export const pokemonSearchKernel = defineCoreKernel({
  id: 'pokemon-search-core',
  store: defineStore<PokemonSearchState>({
    initialState: createPokemonSearchInitialState(),
  }),
  actions: pokemonSearchActions,
  transitions: createPokemonSearchTransitions(),
  effects: createPokemonSearchEffects(),
  selections: createPokemonSearchCoreSelections(),
});

export const PluggableBase = pokemonSearchKernel.PluggableBase;
