import { defineKernelTransitions } from '@machine-state-component/ui-state';
import { taskBoardActions, taskBoardActionTypes } from './task-board.actions';
import { TaskBoardState } from './task-board.types';

export function createTaskBoardTransitions() {
  return defineKernelTransitions<TaskBoardState>()(
    taskBoardActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.openCreateTaskModal, (state) => ({
          ...state,
          status: 'ready',
          createTaskModalOpen: true,
          lastUserActionType: taskBoardActionTypes.openCreateTaskModal,
        }))
        .globalOn(actions.closeCreateTaskModal, (state) => ({
          ...state,
          status: 'ready',
          createTaskModalOpen: false,
          lastUserActionType: taskBoardActionTypes.closeCreateTaskModal,
        }))
        .done(),
  );
}
