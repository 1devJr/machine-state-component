import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  createComposedEngine,
  createFacadeBindings,
} from '@machine-state-component/ui-state';
import { createHistoryCore } from '../history-core/history-core.artifact';
import { MovieSearchMockService } from '../services/movie-search.mock.service';
import { createMovieSearchArtifact } from '../store/movie-search.artifact';

@Injectable()
export class MovieSearchFacadeService implements OnDestroy {
  readonly #movieApi = inject(MovieSearchMockService);

  readonly historyCore = createHistoryCore();
  readonly core = createComposedEngine(
    createMovieSearchArtifact(this.#movieApi, this.historyCore),
  );

  readonly bindings = createFacadeBindings(this.core);
  readonly state = this.bindings.state;
  readonly status = this.bindings.selections.status;
  readonly actions = this.bindings.actions;
  readonly selections = this.bindings.selections;
  readonly composition = this.bindings.composition;
  readonly engineFacade = this.bindings.engineFacade;

  ngOnDestroy(): void {
    this.bindings.destroy();
    this.historyCore.destroy();
  }
}
