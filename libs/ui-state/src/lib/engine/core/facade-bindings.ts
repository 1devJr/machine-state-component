import type { Signal } from '@angular/core';
import type { ComposedEngineResult } from '../types/core';
import type {
  ActionCreatorRecord,
  CompositionWithConnections,
} from '../pluggables/pluggable.types';
import type { EngineState } from '../store/engine.types';

export function createFacadeBindings<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown>,
  TComposition extends CompositionWithConnections,
  TSelections extends Record<string, unknown>,
>(
  core: ComposedEngineResult<
    TState,
    TStatus,
    TActions,
    TServices,
    TComposition,
    TSelections
  >,
) {
  type BindingSelections = TSelections & {
    status: Signal<TStatus>;
    state: Signal<TState>;
  };

  const selections = {
    ...core.selections,
    status: core.facade.selections.status,
    state: core.facade.selections.state,
  } as BindingSelections;

  return {
    state: core.facade.state,
    actions: core.actions,
    selections,
    composition: core.composition,
    engineFacade: core.facade,
    destroy: core.destroy,
  };
}
