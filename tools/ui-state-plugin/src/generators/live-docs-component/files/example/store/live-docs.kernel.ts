import {
  defineCoreKernel,
  defineStore,
} from '@machine-state-component/ui-state';
import { liveDocsActions } from './live-docs.actions';
import { createLiveDocsEffects } from './live-docs.effects';
import { createLiveDocsKernelSelections } from './live-docs.selections';
import { createLiveDocsTransitions } from './live-docs.transitions';
import { createLiveDocsInitialState, LiveDocsState } from './live-docs.types';

export const liveDocsKernel = defineCoreKernel({
  id: 'live-docs-task-manager',
  store: defineStore<LiveDocsState>({
    initialState: createLiveDocsInitialState(),
  }),
  actions: liveDocsActions,
  transitions: createLiveDocsTransitions(),
  effects: createLiveDocsEffects(),
  selections: createLiveDocsKernelSelections(),
});
