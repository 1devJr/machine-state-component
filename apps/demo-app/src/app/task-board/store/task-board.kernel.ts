import {
  defineCoreKernel,
  defineStore,
} from '@machine-state-component/ui-state';
import { taskBoardActions } from './task-board.actions';
import { createTaskBoardSelections } from './task-board.selections';
import { createTaskBoardTransitions } from './task-board.transitions';
import {
  createTaskBoardInitialState,
  TaskBoardState,
} from './task-board.types';

export const taskBoardKernel = defineCoreKernel({
  id: 'task-board-core',
  store: defineStore<TaskBoardState>({
    initialState: createTaskBoardInitialState(),
  }),
  actions: taskBoardActions,
  transitions: createTaskBoardTransitions(),
  effects: [],
  selections: createTaskBoardSelections(),
});
