import type {
  EngineEvent,
  EngineState,
  GlobalTransitions,
  TransitionTable,
} from '../store';

export interface EngineFacadeConfig<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> {
  initialState: TState;
  transitions?: TransitionTable<TState, TStatus, TEvent>;
  globalTransitions?: GlobalTransitions<TState, TStatus, TEvent>;
  services?: TServices;
  onEffectError?: (context: {
    effectId: string;
    eventType: TEvent['type'];
    error: unknown;
  }) => void;
}
