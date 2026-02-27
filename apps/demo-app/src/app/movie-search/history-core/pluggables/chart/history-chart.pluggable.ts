import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { HistoryChartConfig } from '../../history-core.types';
import { HistoryPluggableBase } from '../../store/history.kernel';

@Component({
  selector: 'app-history-chart-pluggable',
  standalone: true,
  templateUrl: './history-chart.pluggable.html',
  styleUrl: './history-chart.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryChartPluggableComponent extends HistoryPluggableBase<HistoryChartConfig> {
  readonly bars = computed(() => {
    const maxBars = this.mergedConfig().maxBars;
    return (this.state()?.topTerms ?? []).slice(0, maxBars);
  });

  readonly maxCount = computed(() => {
    const values = this.bars().map((item) => item.count);
    return values.length ? Math.max(...values) : 1;
  });

  protected override getDefaultConfig(): HistoryChartConfig {
    return {
      title: 'Top termos',
      emptyMessage: 'Sem dados',
      maxBars: 5,
    };
  }
}
