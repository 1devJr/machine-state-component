import { EngineFacade } from '@machine-state-component/ui-state';
import { pokemonSearchActions } from '../../store/pokemon-search.actions';
import { pokemonSearchKernel } from '../../store/pokemon-search.kernel';
import {
  createPokemonSearchInitialState,
  PokemonDetails,
  PokemonSearchState,
  PokemonSearchStatus,
} from '../../store/pokemon-search.types';

type PokemonSearchEvent = ReturnType<
  (typeof pokemonSearchActions)[keyof typeof pokemonSearchActions]
>;

describe('pokemon-search transitions', () => {
  function createFacade() {
    const registration = pokemonSearchKernel.transitions as {
      transitions: Record<string, unknown>;
      globalTransitions: Record<string, unknown>;
    };

    return new EngineFacade<
      PokemonSearchState,
      PokemonSearchStatus,
      PokemonSearchEvent
    >({
      initialState: createPokemonSearchInitialState(),
      transitions: registration.transitions as never,
      globalTransitions: registration.globalTransitions as never,
      services: {},
    });
  }

  it('updates query and status lifecycle', () => {
    const facade = createFacade();

    facade.commands.dispatch(pokemonSearchActions.queryChanged('char'));
    expect(facade.state().query).toBe('char');
    expect(facade.state().status).toBe('idle');

    facade.commands.dispatch(pokemonSearchActions.loading());
    expect(facade.state().status).toBe('loading');

    facade.commands.dispatch(pokemonSearchActions.success(['charmander']));
    expect(facade.state().status).toBe('ready');
    expect(facade.state().results).toEqual(['charmander']);
  });

  it('updates details state and resets cleanly', () => {
    const facade = createFacade();
    const details: PokemonDetails = {
      id: 4,
      name: 'charmander',
      spriteUrl: null,
      types: ['fire'],
      abilities: ['blaze'],
      heightDecimeters: 6,
      weightHectograms: 85,
      stats: [{ name: 'speed', value: 65 }],
      evolutions: ['charmeleon', 'charizard'],
    };

    facade.commands.dispatch(pokemonSearchActions.selectPokemon('charmander'));
    expect(facade.state().selectedPokemonName).toBe('charmander');
    expect(facade.state().detailsStatus).toBe('loading');

    facade.commands.dispatch(pokemonSearchActions.detailsSuccess(details));
    expect(facade.state().detailsStatus).toBe('ready');
    expect(facade.state().selectedPokemonDetails?.name).toBe('charmander');

    facade.commands.dispatch(pokemonSearchActions.reset());
    expect(facade.state().status).toBe('idle');
    expect(facade.state().query).toBe('');
    expect(facade.state().results).toEqual([]);
    expect(facade.state().selectedPokemonName).toBeNull();
    expect(facade.state().detailsStatus).toBe('idle');
  });
});
