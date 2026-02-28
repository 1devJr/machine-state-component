import { Component, computed } from '@angular/core';
import { HistoryListConfig } from '../../history-core.types';
import { HistoryPluggableBase } from '../../store/history.kernel';

@Component({
  selector: 'app-history-list-pluggable',
  standalone: true,
  templateUrl: './history-list.pluggable.html',
  styleUrl: './history-list.pluggable.scss',
})
export class HistoryListPluggableComponent extends HistoryPluggableBase<HistoryListConfig> {
  protected override getDefaultConfig(): HistoryListConfig {
    return {
      title: 'Historico Recente',
      emptyMessage: 'Nenhuma busca registrada ainda.',
    };
  }

  readonly rows = computed(() => {
    const state = this.state();
    if (!state) {
      return [];
    }

    return state.recentTerms.map((term) => ({
      term,
      count: state.counts[term] ?? 0,
    }));
  });
}
