import {
  createChildComposedEngine,
  createComposition,
  defineCompositionSchema,
  requiredSlot,
} from '@machine-state-component/ui-state';
import { HistoryChartConfig, HistoryListConfig } from './history-core.types';
import { HistoryChartPluggableComponent } from './pluggables/chart/history-chart.pluggable';
import { HistoryListPluggableComponent } from './pluggables/list/history-list.pluggable';
import { historyKernel } from './store/history.kernel';

const historySchema = defineCompositionSchema({
  list: requiredSlot<HistoryListConfig>(),
  chart: requiredSlot<HistoryChartConfig>(),
});

export function createHistoryCore() {
  return createChildComposedEngine(historyKernel, {
    composition: () =>
      createComposition(historySchema)
        .withSlot('list', HistoryListPluggableComponent, {
          title: 'Ultimas Pesquisas',
          emptyMessage: 'Ainda nao existe historico de buscas.',
        })
        .withSlot('chart', HistoryChartPluggableComponent, {
          title: 'Top Pesquisas',
          emptyMessage: 'Pesquise um pokemon para gerar o grafico.',
          maxBars: 5,
        })
        .build(),
  });
}

export type HistoryCore = ReturnType<typeof createHistoryCore>;
