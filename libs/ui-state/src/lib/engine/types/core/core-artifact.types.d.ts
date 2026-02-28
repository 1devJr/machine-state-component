/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Signal } from '@angular/core';
import type {
  EffectConfig,
  EngineEvent,
  EngineState,
  GlobalTransitions,
  TransitionRegistration,
  TransitionTable,
} from '../store';
import type {
  ActionCreatorRecord,
  CompositionState,
  CompositionWithConnections,
  ConnectionPort,
} from '../../pluggables/pluggable.types';
import type { EngineFacade } from '../../facade/engine.facade';
import type {
  CoreKernel,
  KernelActions,
  KernelComposedSelections,
  KernelComposedState,
  KernelEvent,
  KernelSelections,
  KernelServices,
  KernelState,
  KernelStatus,
} from './core-kernel.types';

export interface CoreStoreDefinition<TState extends object> {
  initialState: TState;
}

export type EventFromActions<TActions extends ActionCreatorRecord> = ReturnType<
  TActions[keyof TActions]
>;

export type CoreTransitionDefinition<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
> = {
  transitions?: TransitionTable<TState, TStatus, TEvent>;
  globalTransitions?: GlobalTransitions<TState, TStatus, TEvent>;
};

export type CoreTransitions<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
> =
  | CoreTransitionDefinition<TState, TStatus, TEvent>
  | TransitionRegistration<TState, TStatus, TEvent>;

export interface CoreArtifactContext<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown>,
> {
  facade: EngineFacade<TState, TStatus, EventFromActions<TActions>, TServices>;
  parentPort: ConnectionPort<TActions, TActions, TState>;
  actions: TActions;
  services: TServices;
}

export interface CoreArtifact<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TComposition extends CompositionWithConnections = CompositionWithConnections,
  TSelections extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  store: CoreStoreDefinition<TState>;
  actions: TActions;
  transitions: CoreTransitions<TState, TStatus, EventFromActions<TActions>>;
  effects: EffectConfig<
    TState,
    TStatus,
    EventFromActions<TActions>,
    TServices
  >[];
  selections: (
    state: Signal<CompositionState<TState, TComposition>>,
  ) => TSelections;
  composition: (
    context: CoreArtifactContext<TState, TStatus, TActions, TServices>,
  ) => TComposition;
  services?: TServices;
}

export type AnyCoreKernel = CoreKernel<any, any, any, any, any>;

export type CoreArtifactFromKernel<
  TKernel extends AnyCoreKernel,
  TComposition extends CompositionWithConnections,
> = CoreArtifact<
  KernelState<TKernel>,
  KernelStatus<TKernel>,
  KernelActions<TKernel>,
  KernelServices<TKernel>,
  TComposition,
  KernelSelections<TKernel>
>;

export interface CreateCoreArtifactInput<
  TKernel extends AnyCoreKernel,
  TComposition extends CompositionWithConnections,
> {
  composition: (
    context: CoreArtifactContext<
      KernelState<TKernel>,
      KernelStatus<TKernel>,
      KernelActions<TKernel>,
      KernelServices<TKernel>
    >,
  ) => TComposition;
  services?: KernelServices<TKernel>;
  selections?: KernelComposedSelections<
    TKernel,
    KernelComposedState<TKernel, TComposition>
  >;
}

export type BoundActionPort<TActions extends ActionCreatorRecord> = {
  [K in keyof TActions]: (...args: Parameters<TActions[K]>) => void;
};

export type InferComposedState<
  TState extends object,
  TComposition extends CompositionWithConnections,
> = CompositionState<TState, TComposition>;

export interface ComposedEngineResult<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown>,
  TComposition extends CompositionWithConnections,
  TSelections extends Record<string, unknown>,
> {
  id: string;
  artifact: CoreArtifact<
    TState,
    TStatus,
    TActions,
    TServices,
    TComposition,
    TSelections
  >;
  facade: EngineFacade<
    CompositionState<TState, TComposition>,
    TStatus,
    EventFromActions<TActions>,
    TServices
  >;
  baseFacade: EngineFacade<
    TState,
    TStatus,
    EventFromActions<TActions>,
    TServices
  >;
  actions: BoundActionPort<TActions>;
  selections: TSelections;
  composition: TComposition;
  connectionPort: ConnectionPort<TActions, TActions, TState>;
  destroy: () => void;
}

export type ComposedEngineFromKernel<
  TKernel extends AnyCoreKernel,
  TComposition extends CompositionWithConnections,
> = ComposedEngineResult<
  KernelState<TKernel>,
  KernelStatus<TKernel>,
  KernelActions<TKernel>,
  KernelServices<TKernel>,
  TComposition,
  KernelSelections<TKernel>
>;

export interface TransitionChain<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
> {
  on: <TAction extends TActions[keyof TActions]>(
    status: TStatus,
    action: TAction,
    transition: (state: TState, event: ReturnType<TAction>) => TState,
  ) => TransitionChain<TState, TStatus, TActions>;
  globalOn: <TAction extends TActions[keyof TActions]>(
    action: TAction,
    transition: (state: TState, event: ReturnType<TAction>) => TState,
  ) => TransitionChain<TState, TStatus, TActions>;
  done: () => CoreTransitionDefinition<
    TState,
    TStatus,
    EventFromActions<TActions>
  >;
}

export type KernelTransitionChain<
  TKernel extends CoreKernel<any, any, any, any, any>,
> = TransitionChain<
  KernelState<TKernel>,
  KernelStatus<TKernel>,
  KernelActions<TKernel>
>;

export interface KernelTransitionChainFactory<
  TKernel extends CoreKernel<any, any, any, any, any>,
> {
  chain: () => KernelTransitionChain<TKernel>;
  actions: KernelActions<TKernel>;
}

export type KernelTransitionsFactory<
  TKernel extends CoreKernel<any, any, any, any, any>,
> = (
  factory: KernelTransitionChainFactory<TKernel>,
) => CoreTransitions<
  KernelState<TKernel>,
  KernelStatus<TKernel>,
  KernelEvent<TKernel>
>;

export type KernelEffectFactoryContext<
  TKernel extends CoreKernel<any, any, any, any, any>,
> = {
  state: KernelState<TKernel>;
  services: KernelServices<TKernel>;
  dispatch: (event: KernelEvent<TKernel>) => void;
};

export interface KernelEffectBuilder<
  TKernel extends CoreKernel<any, any, any, any, any>,
> {
  on: <TAction extends KernelActions<TKernel>[keyof KernelActions<TKernel>]>(
    action: TAction,
    config: {
      id: string;
      priority?: number;
      when?: (state: KernelState<TKernel>) => boolean;
      handler: (
        context: KernelEffectFactoryContext<TKernel> & {
          event: ReturnType<TAction>;
        },
      ) => void | Promise<void>;
    },
  ) => EffectConfig<
    KernelState<TKernel>,
    KernelStatus<TKernel>,
    KernelEvent<TKernel>,
    KernelServices<TKernel>
  >;
  actions: KernelActions<TKernel>;
}
