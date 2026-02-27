import type { EngineState } from '../store/engine.types';
import type { SliceRegistry } from '../types/registries';

export type { SliceRegistration, SliceRegistry } from '../types/registries';

export function createSliceRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
>(): SliceRegistry<TState, TStatus> {
  const registrations = new Map<string, Record<string, unknown>>();

  return {
    register(slice) {
      if (registrations.has(slice.key)) {
        throw new Error(`Slice "${slice.key}" is already registered.`);
      }
      registrations.set(slice.key, slice.initialState);
    },

    unregister(sliceKey) {
      return registrations.delete(sliceKey);
    },

    has(sliceKey) {
      return registrations.has(sliceKey);
    },

    apply(state) {
      let nextState = state;
      const currentStateRecord = nextState as Record<string, unknown>;
      for (const [key, initialState] of registrations.entries()) {
        if (currentStateRecord[key] === undefined) {
          nextState = {
            ...nextState,
            [key]: initialState,
          } as TState;
        }
      }
      return nextState;
    },

    clear() {
      registrations.clear();
    },
  };
}
