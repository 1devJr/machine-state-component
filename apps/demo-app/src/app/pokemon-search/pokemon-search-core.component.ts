import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { EngineSlotDirective } from '@machine-state-component/ui-state';
import { HistoryCoreComponent } from './history-core/history-core.component';
import { PokemonSearchFacadeService } from './facade/pokemon-search-facade.service';

@Component({
  selector: 'app-pokemon-search-core',
  standalone: true,
  imports: [EngineSlotDirective, HistoryCoreComponent],
  providers: [PokemonSearchFacadeService],
  templateUrl: './pokemon-search-core.component.html',
  styleUrl: './pokemon-search-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSearchCoreComponent {
  readonly facade = inject(PokemonSearchFacadeService);
  readonly historyModalOpen = signal(false);

  readonly state = this.facade.state;
  readonly status = this.facade.status;
  readonly selections = this.facade.selections;
  readonly composition = this.facade.composition;

  readonly querySummary = computed(() => {
    const query = this.selections.query().trim();
    if (!query) {
      return 'Nenhum termo pesquisado ainda.';
    }
    return `Ultima pesquisa: ${query}`;
  });

  readonly historyProjection = computed(() => this.state().historyProjection);
  readonly historyProjectionSummary = computed(() => {
    const projection = this.historyProjection();
    if (!projection) {
      return 'Historico: sem dados';
    }
    return `Historico: ${projection.totalSearches} buscas`;
  });

  readonly sliceSummary = computed(() => ({
    input: {
      lastSubmittedTerm: this.state().input?.lastSubmittedTerm ?? null,
      submitCount: this.state().input?.submitCount ?? 0,
      placeholderSnapshot: this.state().input?.placeholderSnapshot ?? '',
    },
    results: {
      highlighted: this.state().results?.highlighted ?? null,
      renderMode: this.state().results?.renderMode ?? 'list',
      totalRendered: this.state().results?.totalRendered ?? 0,
    },
    details: {
      activeTab: this.state().details?.activeTab ?? 'overview',
      showMetadata: this.state().details?.showMetadata ?? false,
      density: this.state().details?.density ?? 'comfortable',
    },
  }));

  readonly sliceSummaryText = computed(() =>
    JSON.stringify(this.sliceSummary()),
  );

  resetSearch(): void {
    this.facade.actions.reset();
  }

  openHistoryModal(): void {
    this.historyModalOpen.set(true);
  }

  closeHistoryModal(): void {
    this.historyModalOpen.set(false);
  }
}
