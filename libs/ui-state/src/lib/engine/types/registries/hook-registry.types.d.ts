import type { EngineEvent, EngineState, ReducerHook } from '../store';

export interface HookRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
> {
  register: (hook: ReducerHook<TState, TStatus, TEvent>) => () => void;
  runBefore: (state: TState, event: TEvent) => void;
  runAfter: (state: TState, event: TEvent) => void;
  clear: () => void;
}
