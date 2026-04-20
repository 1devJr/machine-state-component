import type { Signal } from '@angular/core';
import { defineSelections } from '@machine-state-component/ui-state';
import { ProjectOverviewState } from './project-overview.types';

export function createProjectOverviewSelections() {
  return defineSelections((state: Signal<ProjectOverviewState>) => ({
    currentStatus: () => state().status,
    lastActionType: () => state().lastUserActionType,
    lastNavigationTarget: () => state().lastNavigationTarget,
  }));
}
