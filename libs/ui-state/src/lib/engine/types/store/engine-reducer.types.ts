import type { WritableSignal } from '@angular/core';
import type { EngineEvent, EngineState } from './engine-store.types';

export interface EngineStore<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
> {
  readonly state: WritableSignal<TState>;
  dispatch: (event: TEvent) => void;
  dispatchMany: (events: TEvent[]) => void;
  reset: (nextState?: TState) => void;
}
