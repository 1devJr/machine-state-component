import { defineActionCatalog } from '@machine-state-component/ui-state';

export const projectOverviewActionCatalog = defineActionCatalog({
  goToTaskCreationPage: {
    type: 'project-overview/goToTaskCreationPage',
  },
  navigationCompleted: {
    type: 'project-overview/navigationCompleted',
    payload: (target: string) => ({ target }),
  },
});

export const projectOverviewActions = projectOverviewActionCatalog.creators;
export const projectOverviewActionTypes = projectOverviewActionCatalog.types;
