import { Injector, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ENGINE_PLUGGABLE_CONTEXT } from '@machine-state-component/ui-state';
import { PokemonSearchDetailsPluggableComponent } from '../../../pluggables/details/pokemon-search-details.pluggable';
import { pokemonSearchActions } from '../../../store/pokemon-search.actions';
import { createPokemonSearchInitialState } from '../../../store/pokemon-search.types';

describe('PokemonSearchDetailsPluggableComponent', () => {
  let fixture: ComponentFixture<PokemonSearchDetailsPluggableComponent>;

  const state = signal(createPokemonSearchInitialState());
  const dispatch = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [PokemonSearchDetailsPluggableComponent],
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
              emptyMessage: 'Selecione um pokemon na lista',
            },
            slotId: 'details',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonSearchDetailsPluggableComponent);
  });

  it('shows empty message when no pokemon is selected', () => {
    state.set(createPokemonSearchInitialState());
    fixture.detectChanges();

    const hint = fixture.nativeElement.querySelector(
      '.details__hint',
    ) as HTMLParagraphElement;
    expect(hint.textContent).toContain('Selecione um pokemon na lista');
  });

  it('renders evolution chips and dispatches select when clicked', () => {
    state.set({
      ...createPokemonSearchInitialState(),
      selectedPokemonName: 'charmander',
      detailsStatus: 'ready',
      selectedPokemonDetails: {
        id: 4,
        name: 'charmander',
        spriteUrl: null,
        types: ['fire'],
        abilities: ['blaze'],
        heightDecimeters: 6,
        weightHectograms: 85,
        stats: [{ name: 'speed', value: 65 }],
        evolutions: ['charmeleon', 'charizard'],
      },
    });
    fixture.detectChanges();

    const evolutionButtons = Array.from(
      fixture.nativeElement.querySelectorAll('button.chip--evolution'),
    ) as HTMLButtonElement[];

    expect(evolutionButtons).toHaveLength(2);
    expect(evolutionButtons[0].textContent?.toLowerCase()).toContain(
      'charmeleon',
    );

    evolutionButtons[0].click();
    expect(dispatch).toHaveBeenCalledWith(
      pokemonSearchActions.selectPokemon('charmeleon'),
    );
  });
});
