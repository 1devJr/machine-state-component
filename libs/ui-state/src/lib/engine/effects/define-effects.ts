import type { EngineEvent, EngineState } from '../store/engine.types';
import type { DefineEffectsInput, DefineEffectsOutput } from '../types/effects';

export function defineEffects<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
>() {
  return <
    const TEffects extends DefineEffectsInput<
      TState,
      TStatus,
      TEvent,
      TServices
    >,
  >(
    effects: TEffects,
  ): DefineEffectsOutput<TState, TStatus, TEvent, TServices> => {
    return [...effects] as DefineEffectsOutput<
      TState,
      TStatus,
      TEvent,
      TServices
    >;
  };
}
