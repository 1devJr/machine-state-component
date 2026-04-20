import type { Signal } from '@angular/core';
import {
  defineCoreKernel,
  defineKernelEffects,
  defineKernelTransitions,
  defineSelections,
  defineStore,
} from '@machine-state-component/ui-state';
import {
  createLiveDocsChildDemoInitialState,
  LiveDocsChildDemoState,
} from '../live-docs-child-demo.types';
import { liveDocsChildDemoActions } from './live-docs-child-demo.actions';

export const liveDocsChildDemoKernel = defineCoreKernel({
  id: 'live-docs-child-demo',
  store: defineStore<LiveDocsChildDemoState>({
    initialState: createLiveDocsChildDemoInitialState(),
  }),
  actions: liveDocsChildDemoActions,
  transitions: defineKernelTransitions<LiveDocsChildDemoState>()(
    liveDocsChildDemoActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.recordParentEvent, (state, event) => ({
          ...state,
          status: 'ready',
          eventCount: state.eventCount + 1,
          lastEventType: event.eventType,
          notes: [event.note, ...state.notes].slice(0, 4),
        }))
        .globalOn(actions.clear, () => createLiveDocsChildDemoInitialState())
        .done(),
  ),
  effects: defineKernelEffects<LiveDocsChildDemoState>()(
    liveDocsChildDemoActions,
    () => [],
  ),
  selections: defineSelections((state: Signal<LiveDocsChildDemoState>) => ({
    eventCount: () => state().eventCount,
    lastEventType: () => state().lastEventType,
    notes: () => state().notes,
  })),
});
