import { defineKernelEffects } from '@machine-state-component/ui-state';
import { myCoreActions } from './my-core.actions';
import { MyCoreServices, MyCoreState } from './my-core.types';

export function createMyCoreEffects() {
  return defineKernelEffects<MyCoreState, MyCoreServices>()(
    myCoreActions,
    ({ on, actions }) => [
      on(actions.runDemoAction, {
        id: 'my-core-run-demo-effect',
        priority: 10,
        handler: async ({ state, event, dispatch, services }) => {
          await services.demoApi.wait(220);
          dispatch(
            actions.demoCompleted(
              services.demoApi.buildCompletionMessage(event.label, state.lang),
            ),
          );
        },
      }),
      on(actions.simulateError, {
        id: 'my-core-simulate-error-effect',
        priority: 20,
        handler: ({ state, event, dispatch, services }) => {
          dispatch(
            actions.setDiagnosticMessage(
              services.demoApi.buildErrorMessage(event.severity, state.lang),
            ),
          );
        },
      }),
      on(actions.toggleScratchSlice, {
        id: 'my-core-scratch-slice-effect',
        priority: 30,
        handler: ({ services }) => {
          services.runtimeBridge.toggleScratchSlice();
        },
      }),
    ],
  );
}
