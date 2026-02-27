import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  createComposedEngine,
  createFacadeBindings,
} from '@machine-state-component/ui-state';
import { createHistoryCore } from '../history-core/history-core.artifact';
import { PokemonSearchApiService } from '../services/pokemon-search-api.service';
import { createPokemonSearchArtifact } from '../store/pokemon-search.artifact';

@Injectable()
export class PokemonSearchFacadeService implements OnDestroy {
  readonly #pokemonApi = inject(PokemonSearchApiService);

  readonly historyCore = createHistoryCore();
  readonly core = createComposedEngine(
    createPokemonSearchArtifact(this.#pokemonApi, this.historyCore),
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
