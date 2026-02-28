import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  OnInit,
  Signal,
} from '@angular/core';
import {
  ENGINE_PLUGGABLE_CONTEXT,
  PluggableContext,
  SlotId,
} from './pluggable.types';
import { EngineEvent, EngineState } from '../store/engine.types';

@Directive()
export abstract class EnginePluggableBase<
    TState extends EngineState<TStatus>,
    TStatus extends string,
    TEvent extends EngineEvent,
    TConfig = Record<string, unknown>,
  >
  implements OnInit, OnDestroy
{
  protected readonly context = inject<PluggableContext<
    TState,
    TStatus,
    TEvent,
    TConfig
  > | null>(ENGINE_PLUGGABLE_CONTEXT, {
    optional: true,
  });

  readonly config = input<TConfig | undefined>();

  readonly mergedConfig: Signal<TConfig> = computed(() => {
    const defaults = this.getDefaultConfig();
    const contextConfig = (this.context?.config ?? {}) as Partial<TConfig>;
    const inputConfig = (this.config() ?? {}) as Partial<TConfig>;

    return {
      ...defaults,
      ...contextConfig,
      ...inputConfig,
    } as TConfig;
  });

  readonly state: Signal<TState | undefined> = computed(() =>
    this.context?.state(),
  );
  readonly slotId: Signal<SlotId | undefined> = computed(
    () => this.context?.slotId,
  );

  protected dispatch(event: TEvent): void {
    this.context?.commands.dispatch(event);
  }

  protected dispatchMany(events: TEvent[]): void {
    this.context?.commands.dispatchMany(events);
  }

  protected getDefaultConfig(): TConfig {
    return {} as TConfig;
  }

  protected onInit?(): void;

  protected onDestroy?(): void;

  ngOnInit(): void {
    this.onInit?.();
  }

  ngOnDestroy(): void {
    this.onDestroy?.();
  }
}
