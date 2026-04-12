import { defineKernelEffects } from '@machine-state-component/ui-state';
import { projectOverviewActions } from './project-overview.actions';
import {
  ProjectOverviewServices,
  ProjectOverviewState,
} from './project-overview.types';

export function createProjectOverviewEffects() {
  return defineKernelEffects<ProjectOverviewState, ProjectOverviewServices>()(
    projectOverviewActions,
    ({ on, actions }) => [
      on(actions.goToTaskCreationPage, {
        id: 'project-overview-navigate-effect',
        priority: 10,
        handler: async ({ dispatch, services }) => {
          await services.navigation.goToTaskCreationPage();
          dispatch(actions.navigationCompleted('/project-overview/new-task'));
        },
      }),
    ],
  );
}
