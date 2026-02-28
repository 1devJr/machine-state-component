import {
  defineCoreKernel,
  defineKernelEffects,
  defineKernelTransitions,
  defineSelections,
  defineStore,
} from '@machine-state-component/ui-state';
import { HistoryState, HistoryStatus } from '../history-core.types';
import { historyActions } from './history.actions';

const MAX_RECENT_TERMS = 10;
const MAX_TOP_TERMS = 5;

function createInitialHistoryState(): HistoryState {
  return {
    status: 'idle',
    recentTerms: [],
    counts: {},
    topTerms: [],
    totalSearches: 0,
  };
}

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

function createTopTerms(
  counts: Record<string, number>,
): Array<{ term: string; count: number }> {
  return Object.entries(counts)
    .map(([term, count]) => ({ term, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.term.localeCompare(right.term),
    )
    .slice(0, MAX_TOP_TERMS);
}

export const historyKernel = defineCoreKernel({
  id: 'movie-history-core',
  store: defineStore<HistoryState>({
    initialState: createInitialHistoryState(),
  }),
  actions: historyActions,
  transitions: defineKernelTransitions<HistoryState>()(
    historyActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.ingestSearch, (state, event) => {
          const term = normalizeTerm(event.term);
          if (!term) {
            return state;
          }

          const nextCount = (state.counts[term] ?? 0) + 1;
          const counts = {
            ...state.counts,
            [term]: nextCount,
          };

          return {
            ...state,
            status: 'ready' as HistoryStatus,
            totalSearches: state.totalSearches + 1,
            recentTerms: [
              term,
              ...state.recentTerms.filter((item) => item !== term),
            ].slice(0, MAX_RECENT_TERMS),
            counts,
            topTerms: createTopTerms(counts),
          };
        })
        .globalOn(actions.clear, () => createInitialHistoryState())
        .done(),
  ),
  effects: defineKernelEffects<HistoryState>()(historyActions, () => []),
  selections: defineSelections((state) => ({
    recentTerms: () => state().recentTerms,
    topTerms: () => state().topTerms,
    totalSearches: () => state().totalSearches,
  })),
});

export const HistoryPluggableBase = historyKernel.PluggableBase;
