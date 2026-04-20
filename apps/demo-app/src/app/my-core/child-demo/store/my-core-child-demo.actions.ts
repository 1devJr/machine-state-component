import { defineActionCatalog } from '@machine-state-component/ui-state';

export const myCoreChildDemoActionCatalog = defineActionCatalog({
  recordParentEvent: {
    type: 'my-core-child-demo/recordParentEvent',
    payload: (eventType: string, note: string) => ({ eventType, note }),
  },
  clear: {
    type: 'my-core-child-demo/clear',
  },
});

export const myCoreChildDemoActions = myCoreChildDemoActionCatalog.creators;
