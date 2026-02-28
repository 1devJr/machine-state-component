import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { movieSearchActions } from '../../store/movie-search.actions';
import { PluggableBase } from '../../store/movie-search.kernel';
import { MovieSearchResultsConfig } from '../../store/movie-search.types';

@Component({
  selector: 'app-movie-search-results-pluggable',
  standalone: true,
  templateUrl: './movie-search-results.pluggable.html',
  styleUrl: './movie-search-results.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieSearchResultsPluggableComponent extends PluggableBase<MovieSearchResultsConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({
    // Slot slice defaults are mounted from composition.withSlot(..., { sliceInitialState }).
  });

  readonly results = computed(() => this.state()?.results ?? []);
  readonly selectedMovie = computed(
    () => this.state()?.selectedMovieName ?? null,
  );

  protected override getDefaultConfig(): MovieSearchResultsConfig {
    return {
      emptyMessage: 'Digite um termo e busque.',
    };
  }

  selectMovie(name: string): void {
    this.dispatch(movieSearchActions.selectMovie(name));
  }
}
