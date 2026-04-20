import type { Signal } from '@angular/core';
import {
  defineCoreKernel,
  defineKernelEffects,
  defineKernelTransitions,
  defineSelections,
  defineStore,
} from '@machine-state-component/ui-state';
import {
  createMyCoreChildDemoInitialState,
  MyCoreChildDemoState,
} from '../my-core-child-demo.types';
import { myCoreChildDemoActions } from './my-core-child-demo.actions';

export const myCoreChildDemoKernel = defineCoreKernel({
  id: 'my-core-child-demo',
  store: defineStore<MyCoreChildDemoState>({
    initialState: createMyCoreChildDemoInitialState(),
  }),
  actions: myCoreChildDemoActions,
  transitions: defineKernelTransitions<MyCoreChildDemoState>()(
    myCoreChildDemoActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.recordParentEvent, (state, event) => ({
          ...state,
          status: 'ready',
          eventCount: state.eventCount + 1,
          lastEventType: event.eventType,
          notes: [event.note, ...state.notes].slice(0, 4),
        }))
        .globalOn(actions.clear, () => createMyCoreChildDemoInitialState())
        .done(),
  ),
  effects: defineKernelEffects<MyCoreChildDemoState>()(
    myCoreChildDemoActions,
    () => [],
  ),
  selections: defineSelections((state: Signal<MyCoreChildDemoState>) => ({
    eventCount: () => state().eventCount,
    lastEventType: () => state().lastEventType,
    notes: () => state().notes,
  })),
});
