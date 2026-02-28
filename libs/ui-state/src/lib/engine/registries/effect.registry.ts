import type {
  EffectConfig,
  EngineEvent,
  EngineState,
} from '../store/engine.types';
import type { EffectRegistry } from '../types/registries';

export type { EffectRegistry } from '../types/registries';

export function createEffectRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
>(): EffectRegistry<TState, TStatus, TEvent, TServices> {
  const effects: EffectConfig<TState, TStatus, TEvent, TServices>[] = [];

  return {
    register(nextEffects) {
      const existingIds = new Set(effects.map((effect) => effect.id));
      const normalized = nextEffects
        .filter((effect) => !existingIds.has(effect.id))
        .map((effect) => ({
          ...effect,
          priority: effect.priority ?? 50,
        }));

      effects.push(...normalized);

      return () => {
        for (const effect of normalized) {
          const idx = effects.indexOf(effect);
          if (idx >= 0) {
            effects.splice(idx, 1);
          }
        }
      };
    },

    list() {
      return [...effects];
    },

    listByEvent(eventType) {
      return effects.filter((effect) => effect.event === eventType);
    },

    clear() {
      effects.length = 0;
    },
  };
}
