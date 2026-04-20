import { EngineState } from '@machine-state-component/ui-state';

export type ProjectOverviewStatus = 'idle' | 'ready';

export interface ProjectOverviewServices {
  [key: string]: unknown;
  navigation: {
    goToTaskCreationPage: () => Promise<boolean>;
  };
}

export interface ProjectOverviewState
  extends EngineState<ProjectOverviewStatus> {
  lastUserActionType: string | null;
  lastNavigationTarget: string | null;
}

export function createProjectOverviewInitialState(): ProjectOverviewState {
  return {
    status: 'ready',
    lastUserActionType: null,
    lastNavigationTarget: null,
  };
}
