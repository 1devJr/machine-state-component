import type {
  EngineEvent,
  EngineState,
  EventType,
  GlobalTransitions,
  TransitionTable,
} from '../store/engine.types';
import type { TransitionRegistry } from '../types/registries';

export type { TransitionRegistry } from '../types/registries';

export function createTransitionRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
>(
  baseTransitions?: TransitionTable<TState, TStatus, TEvent>,
  baseGlobalTransitions?: GlobalTransitions<TState, TStatus, TEvent>,
): TransitionRegistry<TState, TStatus, TEvent> {
  let transitions: TransitionTable<TState, TStatus, TEvent> = {
    ...(baseTransitions ?? {}),
  };
  let globalTransitions: GlobalTransitions<TState, TStatus, TEvent> = {
    ...(baseGlobalTransitions ?? {}),
  };

  return {
    register(registration) {
      const previousTransitions = transitions;
      const previousGlobalTransitions = globalTransitions;

      if (registration.transitions) {
        const nextTransitions: TransitionTable<TState, TStatus, TEvent> = {
          ...transitions,
        };

        for (const [status, handlers] of Object.entries(
          registration.transitions,
        )) {
          const statusKey = status as TStatus;
          nextTransitions[statusKey] = {
            ...(nextTransitions[statusKey] ?? {}),
            ...(handlers ?? {}),
          };
        }

        transitions = nextTransitions;
      }

      if (registration.globalTransitions) {
        globalTransitions = {
          ...globalTransitions,
          ...registration.globalTransitions,
        };
      }

      return () => {
        transitions = previousTransitions;
        globalTransitions = previousGlobalTransitions;
      };
    },

    resolve(state, event) {
      const eventType = event.type as EventType<TEvent>;
      const statusHandler = transitions[state.status]?.[eventType] as
        | ((state: TState, event: TEvent) => TState)
        | undefined;
      if (statusHandler) {
        return statusHandler;
      }
      return globalTransitions[eventType] as
        | ((state: TState, event: TEvent) => TState)
        | undefined;
    },

    reset() {
      transitions = { ...(baseTransitions ?? {}) };
      globalTransitions = { ...(baseGlobalTransitions ?? {}) };
    },

    getTransitionTable() {
      return transitions;
    },

    getGlobalTransitions() {
      return globalTransitions;
    },
  };
}
