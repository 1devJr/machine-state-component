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
import { PokemonSearchDetailsPluggableComponent } from '../pluggables/details/pokemon-search-details.pluggable';
import { PokemonSearchInputPluggableComponent } from '../pluggables/input/pokemon-search-input.pluggable';
import { PokemonSearchResultsPluggableComponent } from '../pluggables/results/pokemon-search-results.pluggable';
import {
  PokemonSearchDetailsConfig,
  PokemonSearchInputConfig,
  PokemonSearchResultsConfig,
  PokemonSearchServices,
} from './pokemon-search.types';
import { pokemonSearchKernel } from './pokemon-search.kernel';

export const pokemonSearchCompositionSchema = defineCompositionSchema({
  input: requiredSlot<PokemonSearchInputConfig>(),
  results: requiredSlot<PokemonSearchResultsConfig>(),
  details: requiredSlot<PokemonSearchDetailsConfig>(),
  history: optionalSlot<Record<string, never>>(),
});

export function createPokemonSearchArtifact(
  pokemonApi: PokemonSearchServices['pokemonApi'],
  historyCore: HistoryCore = createHistoryCore(),
) {
  return createCoreArtifact(pokemonSearchKernel, {
    services: {
      pokemonApi,
    },
    composition: (ctx) =>
      createComposition(pokemonSearchCompositionSchema, {
        parentPort: ctx.parentPort,
      })
        .withSlot(
          'input',
          PokemonSearchInputPluggableComponent,
          {
            placeholder: 'Procure por pokemons (ex: pika, char, bulba)',
            buttonLabel: 'Buscar',
          },
          {
            sliceInitialState: {
              lastSubmittedTerm: null as string | null,
              submitCount: 0,
              placeholderSnapshot: 'Procure por pokemons',
            },
          },
        )
        .withSlot(
          'results',
          PokemonSearchResultsPluggableComponent,
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
          PokemonSearchDetailsPluggableComponent,
          {
            emptyMessage:
              'Selecione um pokemon na lista para carregar detalhes e evolucoes.',
          },
          {
            sliceInitialState: {
              activeTab: 'overview' as 'overview' | 'stats' | 'evolutions',
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

export type PokemonSearchArtifact = ReturnType<
  typeof createPokemonSearchArtifact
>;
