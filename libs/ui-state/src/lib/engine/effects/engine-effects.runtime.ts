import type { EffectRegistry } from '../registries/effect.registry';
import type {
  EffectContext,
  EngineEvent,
  EngineState,
  EventByType,
} from '../store/engine.types';

export interface EngineEffectErrorContext {
  effectId: string;
  eventType: string;
  error: unknown;
}

export interface EngineEffectsRuntimeConfig {
  onEffectError?: (context: EngineEffectErrorContext) => void;
}

export class EngineEffectsRuntime<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  #services: TServices;
  readonly #onEffectError: (context: EngineEffectErrorContext) => void;

  constructor(
    private readonly effectRegistry: EffectRegistry<
      TState,
      TStatus,
      TEvent,
      TServices
    >,
    services?: TServices,
    config?: EngineEffectsRuntimeConfig,
  ) {
    this.#services = services ?? ({} as TServices);
    this.#onEffectError =
      config?.onEffectError ??
      ((context) => {
        console.error(
          `[EngineEffectsRuntime] Effect "${context.effectId}" failed`,
          context.error,
        );
      });
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
      });

    const context: EffectContext<TState, TStatus, TEvent, TServices> = {
      dispatch,
      getState,
      services: this.#services,
    };

    for (const effect of effects) {
      try {
        const effectEvent = event as EventByType<TEvent, typeof effect.event>;
        const result = effect.handler(state, effectEvent, context);
        if (this.#isPromiseLike(result)) {
          void result.catch((error) => {
            this.#handleEffectError(effect.id, event.type, error);
          });
        }
      } catch (error) {
        this.#handleEffectError(effect.id, event.type, error);
      }
    }
  }

  #handleEffectError(
    effectId: string,
    eventType: TEvent['type'],
    error: unknown,
  ): void {
    this.#onEffectError({
      effectId,
      eventType,
      error,
    });
  }

  #isPromiseLike(value: void | Promise<void>): value is Promise<void> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'then' in value &&
      typeof value.then === 'function' &&
      'catch' in value &&
      typeof value.catch === 'function'
    );
  }
}
