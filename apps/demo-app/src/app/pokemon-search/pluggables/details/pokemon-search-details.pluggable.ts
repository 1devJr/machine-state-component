import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { pokemonSearchActions } from '../../store/pokemon-search.actions';
import { PluggableBase } from '../../store/pokemon-search.kernel';
import { PokemonSearchDetailsConfig } from '../../store/pokemon-search.types';

@Component({
  selector: 'app-pokemon-search-details-pluggable',
  standalone: true,
  templateUrl: './pokemon-search-details.pluggable.html',
  styleUrl: './pokemon-search-details.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSearchDetailsPluggableComponent extends PluggableBase<PokemonSearchDetailsConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({
    // Slot slice defaults are mounted from composition.withSlot(..., { sliceInitialState }).
  });

  readonly vm = computed(() => ({
    selectedPokemonName: this.state()?.selectedPokemonName ?? null,
    detailsStatus: this.state()?.detailsStatus ?? 'idle',
    detailsErrorMessage: this.state()?.detailsErrorMessage ?? null,
    details: this.state()?.selectedPokemonDetails ?? null,
  }));

  protected override getDefaultConfig(): PokemonSearchDetailsConfig {
    return {
      emptyMessage: 'Selecione um pokemon na lista para ver os detalhes.',
    };
  }

  onSelect(name: string): void {
    this.dispatch(pokemonSearchActions.selectPokemon(name));
  }
}
