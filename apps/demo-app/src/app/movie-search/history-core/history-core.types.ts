import { EngineState } from '@machine-state-component/ui-state';

export type HistoryStatus = 'idle' | 'ready';

export interface HistoryState extends EngineState<HistoryStatus> {
  recentTerms: string[];
  counts: Record<string, number>;
  topTerms: Array<{ term: string; count: number }>;
  totalSearches: number;
}

export interface HistoryListConfig {
  title: string;
  emptyMessage: string;
}

export interface HistoryChartConfig {
  title: string;
  emptyMessage: string;
  maxBars: number;
}

export interface HistoryProjectionState {
  totalSearches: number;
  latestTerm: string | null;
}
