import type { Signal } from '@angular/core';
import type {
  ActionCreatorRecord,
  CompositionWithConnections,
} from '../pluggables/pluggable.types';
import type {
  EffectConfig,
  EngineState,
  EventByType,
  EventType,
  GlobalTransitions,
  TransitionTable,
} from '../store/engine.types';
import { defineEffects } from '../effects/define-effects';
import type {
  AnyCoreKernel,
  CoreArtifactFromKernel,
  CoreEventFromActions,
  CoreStoreDefinition,
  CoreTransitions,
  CoreTransitionDefinition,
  CreateCoreArtifactInput,
  KernelState,
  TransitionChain,
} from '../types/core';

export type * from '../types/core';

class TransitionChainRuntime<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
> implements TransitionChain<TState, TStatus, TActions>
{
  readonly #transitions: TransitionTable<
    TState,
    TStatus,
    CoreEventFromActions<TActions>
  > = {};

  readonly #globalTransitions: GlobalTransitions<
    TState,
    TStatus,
    CoreEventFromActions<TActions>
  > = {};

  on<TAction extends TActions[keyof TActions]>(
    status: TStatus,
    action: TAction,
    transition: (state: TState, event: ReturnType<TAction>) => TState,
  ): TransitionChain<TState, TStatus, TActions> {
    const eventType = action.actionType as EventType<
      CoreEventFromActions<TActions>
    >;

    this.#transitions[status] = {
      ...(this.#transitions[status] ?? {}),
      [eventType]: transition as (
        state: TState,
        event: EventByType<CoreEventFromActions<TActions>, typeof eventType>,
      ) => TState,
    };

    return this;
  }

  globalOn<TAction extends TActions[keyof TActions]>(
    action: TAction,
    transition: (state: TState, event: ReturnType<TAction>) => TState,
  ): TransitionChain<TState, TStatus, TActions> {
    const eventType = action.actionType as EventType<
      CoreEventFromActions<TActions>
    >;

    this.#globalTransitions[eventType] = transition as (
      state: TState,
      event: EventByType<CoreEventFromActions<TActions>, typeof eventType>,
    ) => TState;

    return this;
  }

  done(): CoreTransitionDefinition<
    TState,
    TStatus,
    CoreEventFromActions<TActions>
  > {
    return {
      transitions: { ...this.#transitions },
      globalTransitions: { ...this.#globalTransitions },
    };
  }
}

export function chainTransitions<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
>(actions: TActions): TransitionChain<TState, TStatus, TActions> {
  void actions;
  return new TransitionChainRuntime<TState, TStatus, TActions>();
}

export function defineKernelTransitions<TState extends EngineState<string>>() {
  return <TActions extends ActionCreatorRecord>(
    actions: TActions,
    define: (factory: {
      chain: () => TransitionChain<TState, TState['status'], TActions>;
      actions: TActions;
    }) => CoreTransitions<
      TState,
      TState['status'],
      CoreEventFromActions<TActions>
    >,
  ): CoreTransitions<
    TState,
    TState['status'],
    CoreEventFromActions<TActions>
  > =>
    define({
      chain: () =>
        chainTransitions<TState, TState['status'], TActions>(actions),
      actions,
    });
}

type KernelEffectsBuilder<
  TState extends EngineState<string>,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown>,
> = {
  on: <TAction extends TActions[keyof TActions]>(
    action: TAction,
    config: {
      id: string;
      priority?: number;
      when?: (state: TState) => boolean;
      handler: (context: {
        state: TState;
        event: ReturnType<TAction>;
        services: TServices;
        dispatch: (event: CoreEventFromActions<TActions>) => void;
      }) => void | Promise<void>;
    },
  ) => EffectConfig<
    TState,
    TState['status'],
    CoreEventFromActions<TActions>,
    TServices
  >;
  actions: TActions;
};

export function defineKernelEffects<
  TState extends EngineState<string>,
  TServices extends Record<string, unknown> = Record<string, unknown>,
>() {
  return <TActions extends ActionCreatorRecord>(
    actions: TActions,
    define: (
      builder: KernelEffectsBuilder<TState, TActions, TServices>,
    ) => EffectConfig<
      TState,
      TState['status'],
      CoreEventFromActions<TActions>,
      TServices
    >[],
  ): EffectConfig<
    TState,
    TState['status'],
    CoreEventFromActions<TActions>,
    TServices
  >[] => {
    const on: KernelEffectsBuilder<TState, TActions, TServices>['on'] = (
      action,
      config,
    ) => ({
      id: config.id,
      event: action.actionType,
      priority: config.priority,
      when: config.when,
      handler: (
        state: TState,
        event: CoreEventFromActions<TActions>,
        context: {
          dispatch: (event: CoreEventFromActions<TActions>) => void;
          getState: () => TState;
          services: TServices;
        },
      ) =>
        config.handler({
          state,
          event: event as ReturnType<typeof action>,
          services: context.services,
          dispatch: context.dispatch,
        }),
    });

    return defineEffects<
      TState,
      TState['status'],
      CoreEventFromActions<TActions>,
      TServices
    >()(define({ on, actions }));
  };
}

export function createCoreArtifact<
  TKernel extends AnyCoreKernel,
  TComposition extends CompositionWithConnections,
>(
  kernel: TKernel,
  input: CreateCoreArtifactInput<TKernel, TComposition>,
): CoreArtifactFromKernel<TKernel, TComposition> {
  const selections = (input.selections ??
    ((state) =>
      kernel.selections(
        state as unknown as Signal<KernelState<TKernel>>,
      ))) as CoreArtifactFromKernel<TKernel, TComposition>['selections'];

  return {
    id: kernel.id,
    store: kernel.store as CoreStoreDefinition<KernelState<TKernel>>,
    actions: kernel.actions,
    transitions: kernel.transitions,
    effects: kernel.effects,
    selections,
    composition: input.composition,
    services: (input.services ??
      kernel.services ??
      {}) as CoreArtifactFromKernel<TKernel, TComposition>['services'],
  };
}
