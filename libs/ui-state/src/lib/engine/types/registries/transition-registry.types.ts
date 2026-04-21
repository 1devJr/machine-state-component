import type {
  EngineEvent,
  EngineState,
  GlobalTransitions,
  TransitionRegistration,
  TransitionTable,
} from '../store';

export interface TransitionRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
> {
  register: (
    registration: TransitionRegistration<TState, TStatus, TEvent>,
  ) => () => void;
  resolve: (
    state: TState,
    event: TEvent,
  ) => ((state: TState, event: TEvent) => TState) | undefined;
  reset: () => void;
  getTransitionTable: () => TransitionTable<TState, TStatus, TEvent>;
  getGlobalTransitions: () => GlobalTransitions<TState, TStatus, TEvent>;
}
