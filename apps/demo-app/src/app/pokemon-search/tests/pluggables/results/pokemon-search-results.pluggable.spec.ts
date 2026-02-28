import { Injector, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ENGINE_PLUGGABLE_CONTEXT } from '@machine-state-component/ui-state';
import { PokemonSearchResultsPluggableComponent } from '../../../pluggables/results/pokemon-search-results.pluggable';
import { pokemonSearchActions } from '../../../store/pokemon-search.actions';
import { createPokemonSearchInitialState } from '../../../store/pokemon-search.types';

describe('PokemonSearchResultsPluggableComponent', () => {
  let fixture: ComponentFixture<PokemonSearchResultsPluggableComponent>;

  const state = signal({
    ...createPokemonSearchInitialState(),
    status: 'ready' as const,
    results: ['charmander', 'charizard'],
  });
  const dispatch = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    state.set({
      ...createPokemonSearchInitialState(),
      status: 'ready',
      results: ['charmander', 'charizard'],
      selectedPokemonName: null,
    });

    await TestBed.configureTestingModule({
      imports: [PokemonSearchResultsPluggableComponent],
      providers: [
        {
          provide: ENGINE_PLUGGABLE_CONTEXT,
          useValue: {
            commands: {
              dispatch,
              dispatchMany: jest.fn(),
            },
            state,
            injector: Injector.NULL,
            config: {
              emptyMessage: 'Nenhum pokemon encontrado',
            },
            slotId: 'results',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonSearchResultsPluggableComponent);
    fixture.detectChanges();
  });

  it('renders results list and dispatches select on click', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button.results__item'),
    ) as HTMLButtonElement[];

    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent?.toLowerCase()).toContain('charmander');

    buttons[0].click();
    expect(dispatch).toHaveBeenCalledWith(
      pokemonSearchActions.selectPokemon('charmander'),
    );
  });

  it('shows empty hint when there are no results', () => {
    state.set({
      ...createPokemonSearchInitialState(),
      status: 'ready',
      results: [],
    });
    fixture.detectChanges();

    const hint = fixture.nativeElement.querySelector(
      '.results__hint',
    ) as HTMLParagraphElement;
    expect(hint.textContent).toContain('Nenhum pokemon encontrado');
  });
});
