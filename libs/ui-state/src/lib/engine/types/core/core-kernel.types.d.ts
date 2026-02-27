/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Signal } from '@angular/core';
import type {
  ActionCreatorRecord,
  CompositionState,
} from '../../pluggables/pluggable.types';
import type { EnginePluggableBase } from '../../pluggables/pluggable.base';
import type { EffectConfig, EngineState } from '../store';
import type {
  CoreStoreDefinition,
  CoreTransitions,
} from './core-artifact.types';

export type CoreEventFromActions<TActions extends ActionCreatorRecord> =
  ReturnType<TActions[keyof TActions]>;

export interface CoreKernel<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TSelections extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  store: CoreStoreDefinition<TState>;
  actions: TActions;
  transitions: CoreTransitions<TState, TStatus, CoreEventFromActions<TActions>>;
  effects: EffectConfig<
    TState,
    TStatus,
    CoreEventFromActions<TActions>,
    TServices
  >[];
  selections: (state: Signal<TState>) => TSelections;
  services?: TServices;
  PluggableBase: abstract new <
    TConfig = Record<string, unknown>,
  >() => EnginePluggableBase<
    TState,
    TStatus,
    CoreEventFromActions<TActions>,
    TConfig
  >;
}

export type KernelState<TKernel extends CoreKernel<any, any, any, any, any>> =
  TKernel['store']['initialState'];

export type KernelStatus<TKernel extends CoreKernel<any, any, any, any, any>> =
  KernelState<TKernel>['status'];

export type KernelActions<TKernel extends CoreKernel<any, any, any, any, any>> =
  TKernel['actions'];

export type KernelEvent<TKernel extends CoreKernel<any, any, any, any, any>> =
  CoreEventFromActions<KernelActions<TKernel>>;

export type KernelServices<
  TKernel extends CoreKernel<any, any, any, any, any>,
> =
  TKernel extends CoreKernel<any, any, any, infer TServices, any>
    ? TServices
    : Record<string, unknown>;

export type KernelSelections<
  TKernel extends CoreKernel<any, any, any, any, any>,
> =
  TKernel extends CoreKernel<any, any, any, any, infer TSelections>
    ? TSelections
    : Record<string, unknown>;

export type KernelComposedSelections<
  TKernel extends CoreKernel<any, any, any, any, any>,
  TComposedState extends object,
> = (state: Signal<TComposedState>) => KernelSelections<TKernel>;

export type KernelComposedState<
  TKernel extends CoreKernel<any, any, any, any, any>,
  TComposition extends { childConnections: object; slotSlices: object },
> = CompositionState<KernelState<TKernel>, TComposition>;
