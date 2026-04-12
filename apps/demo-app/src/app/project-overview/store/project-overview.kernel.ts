import {
  defineCoreKernel,
  defineStore,
} from '@machine-state-component/ui-state';
import { projectOverviewActions } from './project-overview.actions';
import { createProjectOverviewEffects } from './project-overview.effects';
import { createProjectOverviewSelections } from './project-overview.selections';
import { createProjectOverviewTransitions } from './project-overview.transitions';
import {
  createProjectOverviewInitialState,
  ProjectOverviewServices,
  ProjectOverviewState,
} from './project-overview.types';

export const projectOverviewKernel = defineCoreKernel<
  ProjectOverviewState,
  ProjectOverviewState['status'],
  typeof projectOverviewActions,
  ProjectOverviewServices
>({
  id: 'project-overview-core',
  store: defineStore<ProjectOverviewState>({
    initialState: createProjectOverviewInitialState(),
  }),
  actions: projectOverviewActions,
  transitions: createProjectOverviewTransitions(),
  effects: createProjectOverviewEffects(),
  selections: createProjectOverviewSelections(),
});
