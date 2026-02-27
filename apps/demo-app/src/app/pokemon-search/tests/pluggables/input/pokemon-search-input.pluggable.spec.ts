import { Injector, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ENGINE_PLUGGABLE_CONTEXT } from '@machine-state-component/ui-state';
import { PokemonSearchInputPluggableComponent } from '../../../pluggables/input/pokemon-search-input.pluggable';
import { pokemonSearchActions } from '../../../store/pokemon-search.actions';
import { createPokemonSearchInitialState } from '../../../store/pokemon-search.types';

describe('PokemonSearchInputPluggableComponent', () => {
  let fixture: ComponentFixture<PokemonSearchInputPluggableComponent>;

  const state = signal(createPokemonSearchInitialState());
  const dispatch = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    state.set(createPokemonSearchInitialState());

    await TestBed.configureTestingModule({
      imports: [PokemonSearchInputPluggableComponent],
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
              placeholder: 'Digite o nome do pokemon',
              buttonLabel: 'Buscar',
            },
            slotId: 'input',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonSearchInputPluggableComponent);
    fixture.detectChanges();
  });

  it('renders config placeholder', () => {
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    expect(input.placeholder).toContain('pokemon');
  });

  it('dispatches queryChanged and submit events', () => {
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    input.value = 'pikachu';
    input.dispatchEvent(new Event('input'));
    button.click();

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      pokemonSearchActions.queryChanged('pikachu'),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      pokemonSearchActions.queryChanged('pikachu'),
    );
    expect(dispatch).toHaveBeenNthCalledWith(3, pokemonSearchActions.submit());
  });
});
