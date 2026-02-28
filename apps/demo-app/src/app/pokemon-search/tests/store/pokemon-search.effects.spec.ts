import { of, throwError } from 'rxjs';
import { createPokemonSearchEffects } from '../../store/pokemon-search.effects';
import { pokemonSearchActions } from '../../store/pokemon-search.actions';
import {
  createPokemonSearchInitialState,
  PokemonDetails,
} from '../../store/pokemon-search.types';

type PokemonSearchEvent = ReturnType<
  (typeof pokemonSearchActions)[keyof typeof pokemonSearchActions]
>;

describe('pokemon-search effects', () => {
  const submitEffect = createPokemonSearchEffects().find(
    (effect) => effect.id === 'pokemon-search-submit-effect',
  );
  const selectEffect = createPokemonSearchEffects().find(
    (effect) => effect.id === 'pokemon-select-details-effect',
  );

  it('dispatches loading and success when submit returns matches', async () => {
    const dispatch = jest.fn<void, [PokemonSearchEvent]>();
    const searchByName = jest.fn().mockReturnValue(of(['charmander']));

    await submitEffect?.handler(
      {
        ...createPokemonSearchInitialState(),
        query: 'char',
      },
      pokemonSearchActions.submit(),
      {
        dispatch,
        getState: createPokemonSearchInitialState,
        services: {
          pokemonApi: {
            searchByName,
            getPokemonDetails: jest.fn(),
          },
        },
      },
    );

    expect(searchByName).toHaveBeenCalledWith('char');
    expect(dispatch).toHaveBeenNthCalledWith(1, pokemonSearchActions.loading());
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      pokemonSearchActions.success(['charmander']),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      3,
      pokemonSearchActions.historyRecorded('char'),
    );
  });

  it('dispatches empty success when submit term is blank', async () => {
    const dispatch = jest.fn<void, [PokemonSearchEvent]>();
    const searchByName = jest.fn();

    await submitEffect?.handler(
      {
        ...createPokemonSearchInitialState(),
        query: '  ',
      },
      pokemonSearchActions.submit(),
      {
        dispatch,
        getState: createPokemonSearchInitialState,
        services: {
          pokemonApi: {
            searchByName,
            getPokemonDetails: jest.fn(),
          },
        },
      },
    );

    expect(searchByName).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(pokemonSearchActions.success([]));
  });

  it('dispatches error when submit request fails', async () => {
    const dispatch = jest.fn<void, [PokemonSearchEvent]>();
    const searchByName = jest
      .fn()
      .mockReturnValue(throwError(() => new Error('network error')));

    await submitEffect?.handler(
      {
        ...createPokemonSearchInitialState(),
        query: 'char',
      },
      pokemonSearchActions.submit(),
      {
        dispatch,
        getState: createPokemonSearchInitialState,
        services: {
          pokemonApi: {
            searchByName,
            getPokemonDetails: jest.fn(),
          },
        },
      },
    );

    expect(dispatch).toHaveBeenNthCalledWith(1, pokemonSearchActions.loading());
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      pokemonSearchActions.error(
        'Nao foi possivel carregar a lista de pokemons.',
      ),
    );
  });

  it('dispatches detailsSuccess when pokemon details are fetched', async () => {
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
    const dispatch = jest.fn<void, [PokemonSearchEvent]>();
    const getPokemonDetails = jest.fn().mockReturnValue(of(details));

    await selectEffect?.handler(
      createPokemonSearchInitialState(),
      pokemonSearchActions.selectPokemon('Charmander'),
      {
        dispatch,
        getState: createPokemonSearchInitialState,
        services: {
          pokemonApi: {
            searchByName: jest.fn(),
            getPokemonDetails,
          },
        },
      },
    );

    expect(getPokemonDetails).toHaveBeenCalledWith('charmander');
    expect(dispatch).toHaveBeenCalledWith(
      pokemonSearchActions.detailsSuccess(details),
    );
  });

  it('dispatches detailsError when pokemon details request fails', async () => {
    const dispatch = jest.fn<void, [PokemonSearchEvent]>();
    const getPokemonDetails = jest
      .fn()
      .mockReturnValue(throwError(() => new Error('boom')));

    await selectEffect?.handler(
      createPokemonSearchInitialState(),
      pokemonSearchActions.selectPokemon('charmander'),
      {
        dispatch,
        getState: createPokemonSearchInitialState,
        services: {
          pokemonApi: {
            searchByName: jest.fn(),
            getPokemonDetails,
          },
        },
      },
    );

    expect(dispatch).toHaveBeenCalledWith(
      pokemonSearchActions.detailsError(
        'Nao foi possivel carregar os detalhes do pokemon.',
      ),
    );
  });
});
