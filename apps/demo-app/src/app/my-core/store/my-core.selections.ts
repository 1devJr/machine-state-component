import type { Signal } from '@angular/core';
import { defineSelections } from '@machine-state-component/ui-state';
import { MyCoreState } from './my-core.types';

export function createMyCoreSelections() {
  return defineSelections((state: Signal<MyCoreState>) => ({
    currentStatus: () => state().status,
    lastActionType: () => state().lastUserActionType,
    actionCountEntries: () =>
      Object.entries(state().actionCountByType).map(([type, count]) => ({
        type,
        count,
      })),
    learningMode: () => state().learningMode,
    showRawRuntimeData: () => state().showRawRuntimeData,
    diagnosticMessage: () => state().diagnosticMessage,
  }));
}
