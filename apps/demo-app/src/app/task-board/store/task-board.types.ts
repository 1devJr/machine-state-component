import { EngineState } from '@machine-state-component/ui-state';

export type TaskBoardStatus = 'idle' | 'ready';

export interface TaskBoardState extends EngineState<TaskBoardStatus> {
  createTaskModalOpen: boolean;
  lastUserActionType: string | null;
}

export function createTaskBoardInitialState(): TaskBoardState {
  return {
    status: 'ready',
    createTaskModalOpen: false,
    lastUserActionType: null,
  };
}
