import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { EngineSlotDirective } from '@machine-state-component/ui-state';
import { HistoryCoreComponent } from './history-core/history-core.component';
import { MovieSearchFacadeService } from './facade/movie-search-facade.service';

@Component({
  selector: 'app-movie-search-core',
  standalone: true,
  imports: [EngineSlotDirective, HistoryCoreComponent],
  providers: [MovieSearchFacadeService],
  templateUrl: './movie-search-core.component.html',
  styleUrl: './movie-search-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieSearchCoreComponent {
  readonly facade = inject(MovieSearchFacadeService);
  readonly historyModalOpen = signal(false);

  readonly state = this.facade.state;
  readonly status = this.facade.status;
  readonly selections = this.facade.selections;
  readonly composition = this.facade.composition;

  readonly historyProjection = computed(() => this.state().historyProjection);
  readonly historySummary = computed(() => {
    const projection = this.historyProjection();
    if (!projection) {
      return 'Historico indisponivel';
    }

    const latest = projection.latestTerm ?? '-';
    return `Buscas: ${projection.totalSearches} | Ultimo termo: ${latest}`;
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

  reset(): void {
    this.facade.actions.reset();
  }

  openHistory(): void {
    this.historyModalOpen.set(true);
  }

  closeHistory(): void {
    this.historyModalOpen.set(false);
  }
}
