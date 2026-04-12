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
  const effectsByEvent = new Map<
    TEvent['type'],
    EffectConfig<TState, TStatus, TEvent, TServices>[]
  >();

  const rebuildEventIndex = () => {
    effectsByEvent.clear();

    for (const effect of effects) {
      const entries = effectsByEvent.get(effect.event) ?? [];
      entries.push(effect);
      effectsByEvent.set(effect.event, entries);
    }

    for (const [eventType, eventEffects] of effectsByEvent.entries()) {
      effectsByEvent.set(
        eventType,
        [...eventEffects].sort(
          (a, b) => (a.priority ?? 50) - (b.priority ?? 50),
        ),
      );
    }
  };

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
      rebuildEventIndex();

      return () => {
        for (const effect of normalized) {
          const idx = effects.indexOf(effect);
          if (idx >= 0) {
            effects.splice(idx, 1);
          }
        }
        rebuildEventIndex();
      };
    },

    list() {
      return [...effects];
    },

    listByEvent(eventType) {
      return effectsByEvent.get(eventType) ?? [];
    },

    clear() {
      effects.length = 0;
    },
  };
}
