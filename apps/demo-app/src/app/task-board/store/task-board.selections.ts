import type { Signal } from '@angular/core';
import { defineSelections } from '@machine-state-component/ui-state';
import { TaskBoardState } from './task-board.types';

export function createTaskBoardSelections() {
  return defineSelections((state: Signal<TaskBoardState>) => ({
    currentStatus: () => state().status,
    modalOpen: () => state().createTaskModalOpen,
    lastActionType: () => state().lastUserActionType,
  }));
}
