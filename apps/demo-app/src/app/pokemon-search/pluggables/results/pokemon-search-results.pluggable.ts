import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { pokemonSearchActions } from '../../store/pokemon-search.actions';
import { PluggableBase } from '../../store/pokemon-search.kernel';
import { PokemonSearchResultsConfig } from '../../store/pokemon-search.types';

@Component({
  selector: 'app-pokemon-search-results-pluggable',
  standalone: true,
  templateUrl: './pokemon-search-results.pluggable.html',
  styleUrl: './pokemon-search-results.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSearchResultsPluggableComponent extends PluggableBase<PokemonSearchResultsConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({
    // Slot slice defaults are mounted from composition.withSlot(..., { sliceInitialState }).
  });

  readonly viewModel = computed(() => ({
    status: this.state()?.status ?? 'idle',
    results: this.state()?.results ?? [],
    errorMessage: this.state()?.errorMessage ?? null,
    selectedPokemonName: this.state()?.selectedPokemonName ?? null,
  }));

  protected override getDefaultConfig(): PokemonSearchResultsConfig {
    return {
      emptyMessage: 'Nenhum pokemon encontrado para o termo atual.',
    };
  }

  onSelect(name: string): void {
    this.dispatch(pokemonSearchActions.selectPokemon(name));
  }
}
