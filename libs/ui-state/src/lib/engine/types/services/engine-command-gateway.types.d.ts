import type { EngineEvent, EngineState } from '../store';

export interface EngineCommandGateway<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
> {
  dispatch(event: TEvent): void;
  getState(): TState;
}
