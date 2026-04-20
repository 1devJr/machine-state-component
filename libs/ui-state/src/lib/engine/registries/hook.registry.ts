import type {
  EngineEvent,
  EngineState,
  ReducerHook,
} from '../store/engine.types';
import type { HookRegistry } from '../types/registries';

export type { HookRegistry } from '../types/registries';

export function createHookRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
>(): HookRegistry<TState, TStatus, TEvent> {
  const hooks: ReducerHook<TState, TStatus, TEvent>[] = [];

  return {
    register(hook) {
      hooks.push(hook);
      return () => {
        const idx = hooks.indexOf(hook);
        if (idx >= 0) {
          hooks.splice(idx, 1);
        }
      };
    },

    runBefore(state, event) {
      for (const hook of [...hooks]) {
        hook.onBeforeTransition?.(state, event);
      }
    },

    runAfter(state, event) {
      for (const hook of [...hooks]) {
        hook.onAfterTransition?.(state, event);
      }
    },

    clear() {
      hooks.length = 0;
    },
  };
}
