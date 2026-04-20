import type { Signal } from '@angular/core';
import { defineSelections } from '@machine-state-component/ui-state';
import { LiveDocsState } from './live-docs.types';

export function createLiveDocsKernelSelections() {
  return defineSelections((state: Signal<LiveDocsState>) => ({
    currentStatus: () => state().status,
    currentFilter: () => state().filter,
    draftTitle: () => state().draftTitle,
    selectedSaveMode: () => state().nextSaveMode,
    lastActionType: () => state().lastUserActionType,
    feedbackMessage: () => state().feedbackMessage,
  }));
}
