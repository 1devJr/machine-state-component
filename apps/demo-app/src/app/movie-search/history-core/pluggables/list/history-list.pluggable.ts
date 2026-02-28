import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { HistoryListConfig } from '../../history-core.types';
import { HistoryPluggableBase } from '../../store/history.kernel';

@Component({
  selector: 'app-history-list-pluggable',
  standalone: true,
  templateUrl: './history-list.pluggable.html',
  styleUrl: './history-list.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryListPluggableComponent extends HistoryPluggableBase<HistoryListConfig> {
  readonly terms = computed(() => this.state()?.recentTerms ?? []);

  protected override getDefaultConfig(): HistoryListConfig {
    return {
      title: 'Historico',
      emptyMessage: 'Sem dados',
    };
  }
}
