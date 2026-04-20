import {
  defineCoreKernel,
  defineStore,
} from '@machine-state-component/ui-state';
import { myCoreActions } from './my-core.actions';
import { createMyCoreEffects } from './my-core.effects';
import { createMyCoreSelections } from './my-core.selections';
import { createMyCoreTransitions } from './my-core.transitions';
import { createMyCoreInitialState, MyCoreState } from './my-core.types';

export const myCoreKernel = defineCoreKernel({
  id: 'my-core-core',
  store: defineStore<MyCoreState>({
    initialState: createMyCoreInitialState(),
  }),
  actions: myCoreActions,
  transitions: createMyCoreTransitions(),
  effects: createMyCoreEffects(),
  selections: createMyCoreSelections(),
});

export const PluggableBase = myCoreKernel.PluggableBase;
