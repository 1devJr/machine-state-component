import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  definePluggableStoreArtifacts,
  EngineEvent,
  EnginePluggableBase,
  EngineState,
} from '@machine-state-component/ui-state';

export interface PrimaryActionButtonConfig {
  title: string;
  hint: string;
  buttonLabel: string;
  createEvent: () => EngineEvent;
  disabled?: boolean;
}

@Component({
  selector: 'app-primary-action-button-pluggable',
  standalone: true,
  templateUrl: './primary-action-button.pluggable.html',
  styleUrl: './primary-action-button.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryActionButtonPluggableComponent extends EnginePluggableBase<
  EngineState<string>,
  string,
  EngineEvent,
  PrimaryActionButtonConfig
> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({});

  protected override getDefaultConfig(): PrimaryActionButtonConfig {
    return {
      title: 'Primary action',
      hint: 'This pluggable stays the same while the core decides what the action means.',
      buttonLabel: 'Run',
      createEvent: () => ({ type: 'noop' }),
      disabled: false,
    };
  }

  run(): void {
    if (this.mergedConfig().disabled) {
      return;
    }

    this.dispatch(this.mergedConfig().createEvent());
  }
}
