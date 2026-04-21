import { defineActionCatalog } from '@machine-state-component/ui-state';
import {
  LiveDocsFilter,
  LiveDocsLang,
  LiveDocsSaveMode,
  LiveDocsTask,
} from './live-docs.types';

export const liveDocsActionCatalog = defineActionCatalog({
  changeDraftTitle: {
    type: 'live-docs/changeDraftTitle',
    payload: (title: string) => ({ title }),
  },
  setFilter: {
    type: 'live-docs/setFilter',
    payload: (filter: LiveDocsFilter) => ({ filter }),
  },
  setNextSaveMode: {
    type: 'live-docs/setNextSaveMode',
    payload: (mode: LiveDocsSaveMode) => ({ mode }),
  },
  requestSave: {
    type: 'live-docs/requestSave',
  },
  saveSucceeded: {
    type: 'live-docs/saveSucceeded',
    payload: (task: LiveDocsTask, message: string) => ({ task, message }),
  },
  saveFailed: {
    type: 'live-docs/saveFailed',
    payload: (message: string) => ({ message }),
  },
  toggleTask: {
    type: 'live-docs/toggleTask',
    payload: (id: string) => ({ id }),
  },
  deleteTask: {
    type: 'live-docs/deleteTask',
    payload: (id: string) => ({ id }),
  },
  setLang: {
    type: 'live-docs/setLang',
    payload: (lang: LiveDocsLang) => ({ lang }),
  },
  reset: {
    type: 'live-docs/reset',
  },
});

export const liveDocsActions = liveDocsActionCatalog.creators;
export const liveDocsActionTypes = liveDocsActionCatalog.types;
