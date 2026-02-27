import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { movieSearchActions } from '../../store/movie-search.actions';
import { PluggableBase } from '../../store/movie-search.kernel';
import { MovieSearchInputConfig } from '../../store/movie-search.types';

@Component({
  selector: 'app-movie-search-input-pluggable',
  standalone: true,
  templateUrl: './movie-search-input.pluggable.html',
  styleUrl: './movie-search-input.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieSearchInputPluggableComponent extends PluggableBase<MovieSearchInputConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({
    // Slot slice defaults are mounted from composition.withSlot(..., { sliceInitialState }).
  });

  readonly localQuery = signal('');

  protected override getDefaultConfig(): MovieSearchInputConfig {
    return {
      placeholder: 'Procure filmes',
      buttonLabel: 'Buscar',
    };
  }

  updateQuery(value: string): void {
    this.localQuery.set(value);
    this.dispatch(movieSearchActions.queryChanged(value));
  }

  submit(): void {
    const query = this.localQuery().trim();
    this.dispatch(movieSearchActions.queryChanged(query));
    this.dispatch(movieSearchActions.submit());
  }
}
