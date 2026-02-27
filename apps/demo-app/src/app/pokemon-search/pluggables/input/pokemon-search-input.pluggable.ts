import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { pokemonSearchActions } from '../../store/pokemon-search.actions';
import { PluggableBase } from '../../store/pokemon-search.kernel';
import { PokemonSearchInputConfig } from '../../store/pokemon-search.types';

@Component({
  selector: 'app-pokemon-search-input-pluggable',
  standalone: true,
  templateUrl: './pokemon-search-input.pluggable.html',
  styleUrl: './pokemon-search-input.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSearchInputPluggableComponent extends PluggableBase<PokemonSearchInputConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({
    // Slot slice defaults are mounted from composition.withSlot(..., { sliceInitialState }).
  });

  readonly localQuery = signal('');

  protected override getDefaultConfig(): PokemonSearchInputConfig {
    return {
      placeholder: 'Digite o nome do pokemon',
      buttonLabel: 'Buscar',
    };
  }

  updateQuery(value: string): void {
    this.localQuery.set(value);
    this.dispatch(pokemonSearchActions.queryChanged(value));
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.updateQuery(input?.value ?? '');
  }

  submit(): void {
    const query = this.localQuery().trim();
    this.dispatch(pokemonSearchActions.queryChanged(query));
    this.dispatch(pokemonSearchActions.submit());
  }
}
