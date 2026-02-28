import { Component, computed } from '@angular/core';
import { HistoryChartConfig } from '../../history-core.types';
import { HistoryPluggableBase } from '../../store/history.kernel';

@Component({
  selector: 'app-history-chart-pluggable',
  standalone: true,
  templateUrl: './history-chart.pluggable.html',
  styleUrl: './history-chart.pluggable.scss',
})
export class HistoryChartPluggableComponent extends HistoryPluggableBase<HistoryChartConfig> {
  protected override getDefaultConfig(): HistoryChartConfig {
    return {
      title: 'Mais Pesquisados',
      emptyMessage: 'Sem volume de busca para gerar grafico.',
      maxBars: 5,
    };
  }

  readonly bars = computed(() => {
    const state = this.state();
    if (!state) {
      return [];
    }

    const limited = state.topTerms.slice(0, this.mergedConfig().maxBars);
    const max = limited[0]?.count ?? 1;

    return limited.map((entry) => ({
      ...entry,
      width: Math.max(20, Math.round((entry.count / max) * 100)),
    }));
  });
}
