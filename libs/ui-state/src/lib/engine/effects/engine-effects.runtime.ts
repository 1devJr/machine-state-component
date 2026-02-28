import type { EffectRegistry } from '../registries/effect.registry';
import type {
  EffectContext,
  EngineEvent,
  EngineState,
  EventByType,
} from '../store/engine.types';

export class EngineEffectsRuntime<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  #services: TServices;

  constructor(
    private readonly effectRegistry: EffectRegistry<
      TState,
      TStatus,
      TEvent,
      TServices
    >,
    services?: TServices,
  ) {
    this.#services = services ?? ({} as TServices);
  }

  setServices(services: TServices): void {
    this.#services = services;
  }

  registerService<TKey extends keyof TServices>(
    name: TKey,
    service: TServices[TKey],
  ): void {
    this.#services = {
      ...this.#services,
      [name]: service,
    };
  }

  execute(
    state: TState,
    event: TEvent,
    dispatch: (event: TEvent) => void,
    getState: () => TState,
  ): void {
    const effects = this.effectRegistry
      .listByEvent(event.type)
      .filter((effect) => {
        const effectEvent = event as EventByType<TEvent, typeof effect.event>;
        return !effect.when || effect.when(state, effectEvent);
      })
      .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

    const context: EffectContext<TState, TStatus, TEvent, TServices> = {
      dispatch,
      getState,
      services: this.#services,
    };

    for (const effect of effects) {
      try {
        const effectEvent = event as EventByType<TEvent, typeof effect.event>;
        const result = effect.handler(state, effectEvent, context);
        if (result instanceof Promise) {
          void result.catch((error) => {
            console.error(
              `[EngineEffectsRuntime] Effect "${effect.id}" failed`,
              error,
            );
          });
        }
      } catch (error) {
        console.error(
          `[EngineEffectsRuntime] Effect "${effect.id}" failed`,
          error,
        );
      }
    }
  }
}
