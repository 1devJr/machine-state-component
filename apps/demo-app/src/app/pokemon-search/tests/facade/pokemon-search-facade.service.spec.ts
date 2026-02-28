import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PokemonSearchFacadeService } from '../../facade/pokemon-search-facade.service';
import { PokemonSearchApiService } from '../../services/pokemon-search-api.service';
import { PokemonDetails } from '../../store/pokemon-search.types';

describe('PokemonSearchFacadeService', () => {
  const mockApi = {
    searchByName: jest.fn(),
    getPokemonDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.searchByName.mockReset();
    mockApi.getPokemonDetails.mockReset();

    TestBed.configureTestingModule({
      providers: [
        PokemonSearchFacadeService,
        {
          provide: PokemonSearchApiService,
          useValue: mockApi,
        },
      ],
    });
  });

  it('updates query and resolves submit with results', async () => {
    mockApi.searchByName.mockReturnValue(of(['charmander']));
    const facade = TestBed.inject(PokemonSearchFacadeService);

    facade.actions.queryChanged('char');
    facade.actions.submit();
    await Promise.resolve();

    expect(facade.state().query).toBe('char');
    expect(facade.state().status).toBe('ready');
    expect(facade.state().results).toEqual(['charmander']);
  });

  it('sets error status when submit request fails', async () => {
    mockApi.searchByName.mockReturnValue(
      throwError(() => new Error('network fail')),
    );
    const facade = TestBed.inject(PokemonSearchFacadeService);

    facade.actions.queryChanged('char');
    facade.actions.submit();
    await Promise.resolve();

    expect(facade.state().status).toBe('error');
    expect(facade.state().errorMessage).toBe(
      'Nao foi possivel carregar a lista de pokemons.',
    );
  });

  it('loads details on select', async () => {
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

    mockApi.getPokemonDetails.mockReturnValue(of(details));
    const facade = TestBed.inject(PokemonSearchFacadeService);

    facade.actions.selectPokemon('charmander');
    await Promise.resolve();

    expect(facade.state().detailsStatus).toBe('ready');
    expect(facade.state().selectedPokemonDetails?.name).toBe('charmander');
  });
});
