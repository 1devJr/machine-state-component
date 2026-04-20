import type { Signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  createComposition,
  defineCompositionSchema,
  optionalSlot,
  requiredSlot,
} from '../pluggables';
import { defineActionCatalog } from '../store';
import type { ConnectionPort } from '../pluggables/pluggable.types';
import type { EngineState } from '../store/engine.types';
import {
  createCoreArtifact,
  createComposedEngine,
  defineCoreKernel,
  defineKernelEffects,
  defineKernelTransitions,
  defineSelections,
  defineServices,
  defineStore,
} from './index';

class InputPluggable {
  config?: { placeholder: string };
}

class ResultsPluggable {
  config?: { emptyMessage: string };
}

class BadgePluggable {
  config?: Record<string, never>;
}

type MovieSearchStatus = 'idle' | 'ready' | 'error';

interface MovieSearchState extends EngineState<MovieSearchStatus> {
  query: string;
  results: string[];
  selectedResult: string | null;
}

interface HistoryChildState {
  status: 'idle' | 'ready';
  totalSearches: number;
  recentTerms: string[];
}

const movieActions = defineActionCatalog({
  queryChanged: {
    type: 'movie/queryChanged',
    payload: (query: string) => ({ query }),
  },
  submit: {
    type: 'movie/submit',
  },
  success: {
    type: 'movie/success',
    payload: (results: string[]) => ({ results }),
  },
  selectResult: {
    type: 'movie/selectResult',
    payload: (name: string) => ({ name }),
  },
  historyRecorded: {
    type: 'movie/historyRecorded',
    payload: (term: string) => ({ term }),
  },
});

const historyActions = defineActionCatalog({
  ingestSearch: {
    type: 'history/ingestSearch',
    payload: (term: string) => ({ term }),
  },
});

interface MovieServices {
  searchApi: {
    search: (query: string) => string[];
  };
}

function createHistoryPort(): ConnectionPort<
  typeof historyActions.creators,
  typeof historyActions.creators,
  HistoryChildState
> {
  let state: HistoryChildState = {
    status: 'idle',
    totalSearches: 0,
    recentTerms: [],
  };

  const listeners = new Set<
    (event: { type: string; [key: string]: unknown }) => void
  >();

  return {
    actions: historyActions.creators,
    events: historyActions.creators,
    dispatch: (event) => {
      if (event.type === historyActions.types.ingestSearch) {
        const term = String(event.term ?? '').trim();
        if (term) {
          state = {
            status: 'ready',
            totalSearches: state.totalSearches + 1,
            recentTerms: [term, ...state.recentTerms].slice(0, 5),
          };
        }
      }

      for (const listener of listeners) {
        listener(event);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState: () => state,
  };
}

const compositionSchema = defineCompositionSchema({
  input: requiredSlot<{ placeholder: string }>(),
  results: requiredSlot<{ emptyMessage: string }>(),
  badge: optionalSlot<Record<string, never>>(),
  history: optionalSlot<Record<string, never>>(),
});

describe('createComposedEngine', () => {
  it('compoe state global + projection automaticamente e remove no destroy', () => {
    const historyPort = createHistoryPort();

    const kernel = defineCoreKernel({
      id: 'movie-search-core-test',
      store: defineStore<MovieSearchState>({
        initialState: {
          status: 'idle',
          query: '',
          results: [],
          selectedResult: null,
        },
      }),
      actions: movieActions.creators,
      transitions: defineKernelTransitions<MovieSearchState>()(
        movieActions.creators,
        ({ chain, actions }) =>
          chain()
            .globalOn(actions.queryChanged, (state, event) => ({
              ...state,
              query: event.query,
            }))
            .globalOn(actions.success, (state, event) => ({
              ...state,
              status: 'ready',
              results: event.results,
            }))
            .globalOn(actions.selectResult, (state, event) => ({
              ...state,
              selectedResult: event.name,
            }))
            .done(),
      ),
      effects: defineKernelEffects<MovieSearchState, MovieServices>()(
        movieActions.creators,
        ({ on, actions }) => [
          on(actions.submit, {
            id: 'movie-submit-effect',
            handler: ({ state, services, dispatch }) => {
              const query = state.query.trim();
              if (!query) {
                return;
              }

              const results = services.searchApi.search(query);
              dispatch(actions.success(results));
              dispatch(actions.historyRecorded(query));
            },
          }),
        ],
      ),
      selections: defineSelections((state: Signal<MovieSearchState>) => ({
        query: () => state().query,
        results: () => state().results,
      })),
      services: defineServices<MovieServices>({
        searchApi: {
          search: () => ['resultado1', 'resultado2', 'resultado3'],
        },
      }),
    });

    const artifact = createCoreArtifact(kernel, {
      composition: (ctx) =>
        createComposition(compositionSchema, {
          parentPort: ctx.parentPort,
        })
          .withSlot('input', InputPluggable, {
            placeholder: 'Buscar filme',
          })
          .withSlot('results', ResultsPluggable, {
            emptyMessage: 'Sem resultados',
          })
          .withSlot('badge', BadgePluggable)
          .withChildCore('history', historyPort)
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

    const core = createComposedEngine(artifact);

    core.actions.queryChanged('matrix');
    core.actions.submit();

    expect(core.facade.state().results).toEqual([
      'resultado1',
      'resultado2',
      'resultado3',
    ]);
    expect(core.facade.state().historyProjection?.totalSearches).toBe(1);
    expect(core.facade.state().historyProjection?.latestTerm).toBe('matrix');

    core.destroy();

    expect('historyProjection' in core.baseFacade.state()).toBe(false);
  });

  it('lanca erro hard para sliceKey duplicada em projections', () => {
    const sharedSliceKey = 'duplicatedProjection';

    const schema = defineCompositionSchema({
      historyA: optionalSlot<Record<string, never>>(),
      historyB: optionalSlot<Record<string, never>>(),
    });

    const kernel = defineCoreKernel({
      id: 'movie-search-duplicate-slice',
      store: defineStore<MovieSearchState>({
        initialState: {
          status: 'idle',
          query: '',
          results: [],
          selectedResult: null,
        },
      }),
      actions: movieActions.creators,
      transitions: defineKernelTransitions<MovieSearchState>()(
        movieActions.creators,
        ({ chain }) => chain().done(),
      ),
      effects: defineKernelEffects<MovieSearchState, MovieServices>()(
        movieActions.creators,
        () => [],
      ),
      selections: defineSelections((state: Signal<MovieSearchState>) => ({
        status: () => state().status,
      })),
      services: defineServices<MovieServices>({
        searchApi: {
          search: () => ['resultado1', 'resultado2', 'resultado3'],
        },
      }),
    });

    const artifact = createCoreArtifact(kernel, {
      composition: (ctx) =>
        createComposition(schema, { parentPort: ctx.parentPort })
          .withChildCore('historyA', createHistoryPort())
          .withChildCore('historyB', createHistoryPort())
          .connectChild('historyA', ({ parent, child, link }) => ({
            parentToChild: [
              link(parent.actions.historyRecorded, child.actions.ingestSearch),
            ],
            projection: {
              sliceKey: sharedSliceKey,
              initialState: { totalSearches: 0 },
              select: (childState) => ({
                totalSearches: childState.totalSearches,
              }),
            },
          }))
          .connectChild('historyB', ({ parent, child, link }) => ({
            parentToChild: [
              link(parent.actions.historyRecorded, child.actions.ingestSearch),
            ],
            projection: {
              sliceKey: sharedSliceKey,
              initialState: { totalSearches: 0 },
              select: (childState) => ({
                totalSearches: childState.totalSearches,
              }),
            },
          }))
          .build(),
    });

    expect(() => createComposedEngine(artifact)).toThrowError(
      `Slice "${sharedSliceKey}" is already registered.`,
    );
  });
});
