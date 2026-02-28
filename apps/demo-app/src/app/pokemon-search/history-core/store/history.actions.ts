import { defineActionCatalog } from '@machine-state-component/ui-state';

export const historyActionCatalog = defineActionCatalog({
  ingestSearch: {
    type: 'history/ingestSearch',
    payload: (term: string) => ({ term }),
  },
  clear: {
    type: 'history/clear',
  },
});

export const historyActions = historyActionCatalog.creators;
export const historyActionTypes = historyActionCatalog.types;
