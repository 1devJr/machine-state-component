import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { EngineSlotDirective } from '@machine-state-component/ui-state';
import { HistoryCore } from './history-core.artifact';
import { historyActions } from './store/history.actions';

@Component({
  selector: 'app-history-core',
  standalone: true,
  imports: [EngineSlotDirective],
  templateUrl: './history-core.component.html',
  styleUrl: './history-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryCoreComponent {
  readonly core = input.required<HistoryCore>();

  readonly totalSearches = computed(
    () => this.core().facade.state().totalSearches,
  );

  clear(): void {
    this.core().actions.clear();
  }

  protected readonly historyActions = historyActions;
}
