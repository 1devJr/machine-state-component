import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { PluggableBase } from '../../store/movie-search.kernel';
import { MovieSearchDetailsConfig } from '../../store/movie-search.types';

@Component({
  selector: 'app-movie-search-details-pluggable',
  standalone: true,
  templateUrl: './movie-search-details.pluggable.html',
  styleUrl: './movie-search-details.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieSearchDetailsPluggableComponent extends PluggableBase<MovieSearchDetailsConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({
    // Slot slice defaults are mounted from composition.withSlot(..., { sliceInitialState }).
  });

  readonly details = computed(() => this.state()?.selectedMovieDetails ?? null);
  readonly detailsStatus = computed(
    () => this.state()?.detailsStatus ?? 'idle',
  );
  readonly detailsErrorMessage = computed(
    () => this.state()?.detailsErrorMessage ?? null,
  );

  protected override getDefaultConfig(): MovieSearchDetailsConfig {
    return {
      emptyMessage: 'Selecione um resultado para abrir os detalhes.',
    };
  }
}
