import { defineKernelEffects } from '@machine-state-component/ui-state';
import { firstValueFrom } from 'rxjs';
import { pokemonSearchActions } from './pokemon-search.actions';
import {
  PokemonSearchServices,
  PokemonSearchState,
} from './pokemon-search.types';

export function createPokemonSearchEffects() {
  return defineKernelEffects<PokemonSearchState, PokemonSearchServices>()(
    pokemonSearchActions,
    ({ on, actions }) => [
      on(actions.submit, {
        id: 'pokemon-search-submit-effect',
        priority: 10,
        handler: async ({ state, dispatch, services }) => {
          const term = state.query.trim();
          if (!term) {
            dispatch(actions.success([]));
            return;
          }

          dispatch(actions.loading());

          try {
            const matches = await firstValueFrom(
              services.pokemonApi.searchByName(term),
            );
            dispatch(actions.success(matches));
            dispatch(actions.historyRecorded(term));
          } catch {
            dispatch(
              actions.error('Nao foi possivel carregar a lista de pokemons.'),
            );
          }
        },
      }),
      on(actions.selectPokemon, {
        id: 'pokemon-select-details-effect',
        priority: 20,
        handler: async ({ state, event, dispatch, services }) => {
          const selectedName = event.name.trim().toLowerCase();
          if (!selectedName) {
            return;
          }

          if (
            state.selectedPokemonDetails &&
            state.selectedPokemonDetails.name.toLowerCase() === selectedName
          ) {
            dispatch(actions.detailsSuccess(state.selectedPokemonDetails));
            return;
          }

          try {
            const details = await firstValueFrom(
              services.pokemonApi.getPokemonDetails(selectedName),
            );
            dispatch(actions.detailsSuccess(details));
          } catch {
            dispatch(
              actions.detailsError(
                'Nao foi possivel carregar os detalhes do pokemon.',
              ),
            );
          }
        },
      }),
    ],
  );
}
