import type { EffectConfig, EngineEvent, EngineState } from '../store';

export interface EffectRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> {
  register: (
    effects: EffectConfig<TState, TStatus, TEvent, TServices>[],
  ) => () => void;
  list: () => ReadonlyArray<EffectConfig<TState, TStatus, TEvent, TServices>>;
  listByEvent: (
    eventType: TEvent['type'],
  ) => ReadonlyArray<EffectConfig<TState, TStatus, TEvent, TServices>>;
  clear: () => void;
}
