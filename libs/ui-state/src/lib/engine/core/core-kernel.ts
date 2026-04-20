import type { Signal } from '@angular/core';
import { EnginePluggableBase } from '../pluggables/pluggable.base';
import type { ActionCreatorRecord } from '../pluggables/pluggable.types';
import type { EffectConfig, EngineState } from '../store/engine.types';
import type {
  CoreEventFromActions,
  CoreKernel,
  CoreStoreDefinition,
  CoreTransitions,
} from '../types/core';

export function defineStore<TState extends object>(
  store: CoreStoreDefinition<TState>,
): CoreStoreDefinition<TState> {
  return store;
}

export function defineSelections<
  TState extends object,
  TSelections extends Record<string, unknown>,
>(
  selections: (state: Signal<TState>) => TSelections,
): (state: Signal<TState>) => TSelections {
  return selections;
}

export function defineServices<TServices extends Record<string, unknown>>(
  services: TServices,
): TServices {
  return services;
}

export function defineCoreKernel<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TSelections extends Record<string, unknown> = Record<string, unknown>,
>(input: {
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
}): CoreKernel<TState, TStatus, TActions, TServices, TSelections> {
  abstract class KernelPluggableBase<
    TConfig = Record<string, unknown>,
  > extends EnginePluggableBase<
    TState,
    TStatus,
    CoreEventFromActions<TActions>,
    TConfig
  > {}

  return {
    ...input,
    PluggableBase: KernelPluggableBase,
  };
}
