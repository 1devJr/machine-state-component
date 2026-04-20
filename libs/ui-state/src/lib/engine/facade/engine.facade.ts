import { computed, Signal } from '@angular/core';
import { EngineEffectsRuntime } from '../effects/engine-effects.runtime';
import type {
  ActionCreatorRecord,
  ConnectionPort,
} from '../pluggables/pluggable.types';
import { createEffectRegistry } from '../registries/effect.registry';
import type { EffectRegistry } from '../registries/effect.registry';
import { createHookRegistry } from '../registries/hook.registry';
import type { HookRegistry } from '../registries/hook.registry';
import { createSliceRegistry } from '../registries/slice.registry';
import type { SliceRegistry } from '../registries/slice.registry';
import { createTransitionRegistry } from '../registries/transition.registry';
import type { TransitionRegistry } from '../registries/transition.registry';
import { createEngineStore } from '../store/engine.reducer';
import type { EngineStore } from '../store/engine.reducer';
import type { EngineFacadeConfig } from '../types/facade';
import type {
  EffectConfig,
  EngineEvent,
  EngineState,
  FacadeCommands,
  FacadeSelections,
  ReducerHook,
  TransitionRegistration,
} from '../store/engine.types';

export type { EngineFacadeConfig } from '../types/facade';

export class EngineFacade<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly #transitionRegistry: TransitionRegistry<TState, TStatus, TEvent>;
  readonly #effectRegistry: EffectRegistry<TState, TStatus, TEvent, TServices>;
  readonly #hookRegistry: HookRegistry<TState, TStatus, TEvent>;
  readonly #sliceRegistry: SliceRegistry<TState, TStatus>;
  readonly #store: EngineStore<TState, TStatus, TEvent>;
  readonly #effectsRuntime: EngineEffectsRuntime<
    TState,
    TStatus,
    TEvent,
    TServices
  >;
  readonly #eventSubscribers = new Set<(event: TEvent) => void>();
  readonly #slicePorts: Record<
    string,
    {
      actions: Record<string, (...args: unknown[]) => void>;
      selections: Record<string, Signal<unknown>>;
    }
  > = {};

  readonly commands: FacadeCommands<TState, TStatus, TEvent>;
  readonly selections: FacadeSelections<TState, TStatus>;
  readonly slices = this.#slicePorts;

  constructor(config: EngineFacadeConfig<TState, TStatus, TEvent, TServices>) {
    this.#transitionRegistry = createTransitionRegistry(
      config.transitions,
      config.globalTransitions,
    );
    this.#effectRegistry = createEffectRegistry();
    this.#hookRegistry = createHookRegistry();
    this.#sliceRegistry = createSliceRegistry();

    this.#store = createEngineStore(
      config.initialState,
      this.#transitionRegistry,
      this.#hookRegistry,
    );

    this.#effectsRuntime = new EngineEffectsRuntime(
      this.#effectRegistry,
      config.services,
      {
        onEffectError: config.onEffectError,
      },
    );

    this.#hookRegistry.register({
      onAfterTransition: (state, event) => {
        this.#effectsRuntime.execute(state, event, this.#store.dispatch, () =>
          this.#store.state(),
        );
        for (const subscriber of this.#eventSubscribers) {
          subscriber(event);
        }
      },
    });

    this.commands = {
      dispatch: (event) => {
        const nextState = this.#sliceRegistry.apply(this.#store.state());
        if (nextState !== this.#store.state()) {
          this.#store.reset(nextState);
        }
        this.#store.dispatch(event);
      },
      dispatchMany: (events) => {
        for (const event of events) {
          this.commands.dispatch(event);
        }
      },
      getStateSnapshot: () => {
        const currentState = this.#store.state();
        if (typeof structuredClone === 'function') {
          return structuredClone(currentState);
        }

        return JSON.parse(JSON.stringify(currentState)) as TState;
      },
    };

    this.selections = {
      state: this.#store.state.asReadonly(),
      status: computed(() => this.#store.state().status),
    };
  }

  registerTransitions(
    registration: TransitionRegistration<TState, TStatus, TEvent>,
  ): () => void {
    return this.#transitionRegistry.register(registration);
  }

  registerEffects(
    effects: EffectConfig<TState, TStatus, TEvent, TServices>[],
  ): () => void {
    return this.#effectRegistry.register(effects);
  }

  registerHook(hook: ReducerHook<TState, TStatus, TEvent>): () => void {
    return this.#hookRegistry.register(hook);
  }

  registerSlice(sliceKey: string, initialState: Record<string, unknown>): void {
    this.#sliceRegistry.register({ key: sliceKey, initialState });
    const nextState = this.#sliceRegistry.apply(this.#store.state());
    this.#store.reset(nextState);
  }

  unregisterSlice(sliceKey: string): void {
    const removed = this.#sliceRegistry.unregister(sliceKey);
    if (!removed) {
      return;
    }

    const current = this.#store.state();
    const currentRecord = current as Record<string, unknown>;
    if (currentRecord[sliceKey] === undefined) {
      return;
    }

    const nextState = { ...currentRecord };
    delete nextState[sliceKey];
    this.#store.reset(nextState as TState);
  }

  setSliceState(sliceKey: string, nextState: Record<string, unknown>): void {
    const current = this.#store.state();
    const currentRecord = current as Record<string, unknown>;

    if (Object.is(currentRecord[sliceKey], nextState)) {
      return;
    }

    this.#store.reset({
      ...current,
      [sliceKey]: nextState,
    } as TState);
  }

  registerSliceModule<TSliceActions extends ActionCreatorRecord>(
    sliceKey: string,
    module: {
      actions?: TSliceActions;
      selections?: (state: Signal<TState>) => Record<string, Signal<unknown>>;
    },
  ): () => void {
    if (this.#slicePorts[sliceKey]) {
      throw new Error(`Slice module "${sliceKey}" is already registered.`);
    }

    const actions = {} as Record<string, (...args: unknown[]) => void>;
    if (module.actions) {
      for (const [name, creator] of Object.entries(module.actions)) {
        actions[name] = (...args: unknown[]) => {
          this.commands.dispatch(creator(...args) as TEvent);
        };
      }
    }

    const selections = module.selections ? module.selections(this.state) : {};

    this.#slicePorts[sliceKey] = {
      actions,
      selections,
    };

    return () => {
      delete this.#slicePorts[sliceKey];
    };
  }

  registerService<TKey extends keyof TServices>(
    name: TKey,
    service: TServices[TKey],
  ): void {
    this.#effectsRuntime.registerService(name, service);
  }

  subscribeEvents(listener: (event: TEvent) => void): () => void {
    this.#eventSubscribers.add(listener);
    return () => {
      this.#eventSubscribers.delete(listener);
    };
  }

  createConnectionPort<
    TActions extends ActionCreatorRecord,
    TEvents extends ActionCreatorRecord = TActions,
  >(
    actions: TActions,
    events?: TEvents,
  ): ConnectionPort<TActions, TEvents, TState> {
    const eventCatalog = (events ?? actions) as TEvents;

    return {
      actions,
      events: eventCatalog,
      dispatch: (event) => {
        this.commands.dispatch(event as TEvent);
      },
      subscribe: (listener) =>
        this.subscribeEvents((event) =>
          listener(event as ReturnType<TEvents[keyof TEvents]>),
        ),
      getState: () => this.commands.getStateSnapshot(),
      registerSlice: (sliceKey, initialState) =>
        this.registerSlice(sliceKey, initialState),
      unregisterSlice: (sliceKey) => this.unregisterSlice(sliceKey),
      setSliceState: (sliceKey, nextState) =>
        this.setSliceState(sliceKey, nextState),
    };
  }

  listEffects(): ReadonlyArray<
    EffectConfig<TState, TStatus, TEvent, TServices>
  > {
    return this.#effectRegistry.list();
  }

  listEffectsForEvent(
    eventType: TEvent['type'],
  ): ReadonlyArray<EffectConfig<TState, TStatus, TEvent, TServices>> {
    return this.#effectRegistry.listByEvent(eventType);
  }

  destroy(): void {
    this.#effectRegistry.clear();
    this.#hookRegistry.clear();
    this.#sliceRegistry.clear();
    this.#eventSubscribers.clear();
    for (const key of Object.keys(this.#slicePorts)) {
      delete this.#slicePorts[key];
    }
    this.#transitionRegistry.reset();
  }

  get state(): Signal<TState> {
    return this.selections.state;
  }
}
