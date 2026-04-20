import { defineKernelTransitions } from '@machine-state-component/ui-state';
import {
  projectOverviewActions,
  projectOverviewActionTypes,
} from './project-overview.actions';
import { ProjectOverviewState } from './project-overview.types';

export function createProjectOverviewTransitions() {
  return defineKernelTransitions<ProjectOverviewState>()(
    projectOverviewActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.goToTaskCreationPage, (state) => ({
          ...state,
          status: 'ready',
          lastUserActionType: projectOverviewActionTypes.goToTaskCreationPage,
        }))
        .globalOn(actions.navigationCompleted, (state, event) => ({
          ...state,
          status: 'ready',
          lastNavigationTarget: event.target,
        }))
        .done(),
  );
}
