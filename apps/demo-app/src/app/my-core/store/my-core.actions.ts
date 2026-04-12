import { defineActionCatalog } from '@machine-state-component/ui-state';
import { MyCoreLearningMode } from './my-core.types';

export const myCoreActionCatalog = defineActionCatalog({
  setLearningMode: {
    type: 'my-core/setLearningMode',
    payload: (mode: MyCoreLearningMode) => ({ mode }),
  },
  runDemoAction: {
    type: 'my-core/runDemoAction',
    payload: (label: string) => ({ label }),
  },
  demoCompleted: {
    type: 'my-core/demoCompleted',
    payload: (message: string) => ({ message }),
  },
  simulateError: {
    type: 'my-core/simulateError',
    payload: (severity: 'soft' | 'hard') => ({ severity }),
  },
  toggleScratchSlice: {
    type: 'my-core/toggleScratchSlice',
  },
  toggleChildDemo: {
    type: 'my-core/toggleChildDemo',
  },
  toggleRawRuntimeData: {
    type: 'my-core/toggleRawRuntimeData',
  },
  setDiagnosticMessage: {
    type: 'my-core/setDiagnosticMessage',
    payload: (message: string) => ({ message }),
  },
  toggleLang: {
    type: 'my-core/toggleLang',
  },
  reset: {
    type: 'my-core/reset',
  },
});

export const myCoreActions = myCoreActionCatalog.creators;
export const myCoreActionTypes = myCoreActionCatalog.types;
