import type {
  EffectByEvent,
  EffectConfig,
  EngineEvent,
  EngineState,
} from '../store/engine-store.types';

export type DefineEffectsInput<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> = readonly EffectByEvent<TState, TStatus, TEvent, TServices>[];

export type DefineEffectsOutput<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> = EffectConfig<TState, TStatus, TEvent, TServices>[];
