import { signal } from '@angular/core';
import type { TransitionRegistry } from '../registries/transition.registry';
import type { HookRegistry } from '../registries/hook.registry';
import type { EngineEvent, EngineState, EngineStore } from './engine.types';

export type { EngineStore } from './engine.types';

export function createEngineStore<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
>(
  initialState: TState,
  transitionRegistry: TransitionRegistry<TState, TStatus, TEvent>,
  hookRegistry: HookRegistry<TState, TStatus, TEvent>,
): EngineStore<TState, TStatus, TEvent> {
  const state = signal<TState>(initialState);

  const dispatch = (event: TEvent) => {
    const current = state();
    hookRegistry.runBefore(current, event);

    const transition = transitionRegistry.resolve(current, event);
    const nextState = transition ? transition(current, event) : current;

    state.set(nextState);
    hookRegistry.runAfter(nextState, event);
  };

  return {
    state,

    dispatch,

    dispatchMany(events) {
      for (const event of events) {
        dispatch(event);
      }
    },

    reset(nextState) {
      state.set(nextState ?? initialState);
    },
  };
}
