import { defineActionCatalog } from '@machine-state-component/ui-state';

export const taskBoardActionCatalog = defineActionCatalog({
  openCreateTaskModal: {
    type: 'task-board/openCreateTaskModal',
  },
  closeCreateTaskModal: {
    type: 'task-board/closeCreateTaskModal',
  },
});

export const taskBoardActions = taskBoardActionCatalog.creators;
export const taskBoardActionTypes = taskBoardActionCatalog.types;
