import { defineActionCatalog } from '@machine-state-component/ui-state';

export const liveDocsChildDemoActionCatalog = defineActionCatalog({
  recordParentEvent: {
    type: 'live-docs-child-demo/recordParentEvent',
    payload: (eventType: string, note: string) => ({ eventType, note }),
  },
  clear: {
    type: 'live-docs-child-demo/clear',
  },
});

export const liveDocsChildDemoActions = liveDocsChildDemoActionCatalog.creators;
