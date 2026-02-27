import {
  createComposition,
  createCoreArtifact,
  defineCompositionSchema,
  optionalSlot,
  requiredSlot,
} from '@machine-state-component/ui-state';
import {
  HistoryCore,
  createHistoryCore,
} from '../history-core/history-core.artifact';
import { MovieSearchDetailsPluggableComponent } from '../pluggables/details/movie-search-details.pluggable';
import { MovieSearchInputPluggableComponent } from '../pluggables/input/movie-search-input.pluggable';
import { MovieSearchResultsPluggableComponent } from '../pluggables/results/movie-search-results.pluggable';
import {
  MovieSearchDetailsConfig,
  MovieSearchInputConfig,
  MovieSearchResultsConfig,
  MovieSearchServices,
} from './movie-search.types';
import { movieSearchKernel } from './movie-search.kernel';

export const movieSearchCompositionSchema = defineCompositionSchema({
  input: requiredSlot<MovieSearchInputConfig>(),
  results: requiredSlot<MovieSearchResultsConfig>(),
  details: requiredSlot<MovieSearchDetailsConfig>(),
  history: optionalSlot<Record<string, never>>(),
});

export function createMovieSearchArtifact(
  movieApi: MovieSearchServices['movieApi'],
  historyCore: HistoryCore = createHistoryCore(),
) {
  return createCoreArtifact(movieSearchKernel, {
    services: {
      movieApi,
    },
    composition: (ctx) =>
      createComposition(movieSearchCompositionSchema, {
        parentPort: ctx.parentPort,
      })
        .withSlot(
          'input',
          MovieSearchInputPluggableComponent,
          {
            placeholder: 'Procure filmes (ex: resultado1, resultado2)',
            buttonLabel: 'Buscar',
          },
          {
            sliceInitialState: {
              lastSubmittedTerm: null as string | null,
              submitCount: 0,
              placeholderSnapshot: 'Procure filmes',
            },
          },
        )
        .withSlot(
          'results',
          MovieSearchResultsPluggableComponent,
          {
            emptyMessage: 'Digite um termo e pressione buscar.',
          },
          {
            sliceInitialState: {
              highlighted: null as string | null,
              renderMode: 'list' as 'list' | 'grid',
              totalRendered: 0,
            },
          },
        )
        .withSlot(
          'details',
          MovieSearchDetailsPluggableComponent,
          {
            emptyMessage: 'Selecione um filme na lista para carregar detalhes.',
          },
          {
            sliceInitialState: {
              activeTab: 'overview' as 'overview' | 'cast' | 'meta',
              showMetadata: true,
              density: 'comfortable' as 'comfortable' | 'compact',
            },
          },
        )
        .withChildCore('history', historyCore.connectionPort)
        .connectChild('history', ({ parent, child, link }) => ({
          parentToChild: [
            link(parent.actions.historyRecorded, child.actions.ingestSearch),
          ],
          projection: {
            initialState: {
              totalSearches: 0,
              latestTerm: null as string | null,
            },
            select: (childState) => ({
              totalSearches: childState.totalSearches,
              latestTerm: childState.recentTerms[0] ?? null,
            }),
          },
        }))
        .build(),
  });
}

export type MovieSearchArtifact = ReturnType<typeof createMovieSearchArtifact>;
