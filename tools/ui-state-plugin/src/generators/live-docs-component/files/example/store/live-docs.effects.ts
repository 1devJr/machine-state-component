import { defineKernelEffects } from '@machine-state-component/ui-state';
import { liveDocsActions } from './live-docs.actions';
import { LiveDocsServices, LiveDocsState } from './live-docs.types';

export function createLiveDocsEffects() {
  return defineKernelEffects<LiveDocsState, LiveDocsServices>()(
    liveDocsActions,
    ({ on, actions }) => [
      on(actions.requestSave, {
        id: 'live-docs-request-save-effect',
        priority: 10,
        handler: async ({ state, dispatch, services }) => {
          const title = state.draftTitle.trim();

          if (!title) {
            dispatch(
              actions.saveFailed(
                services.demoApi.buildBlankDraftMessage(state.lang),
              ),
            );
            return;
          }

          try {
            const task = await services.demoApi.persistTask(
              title,
              state.nextSaveMode,
              state.lang,
            );

            dispatch(
              actions.saveSucceeded(
                task,
                services.demoApi.buildSuccessMessage(task.title, state.lang),
              ),
            );
          } catch {
            dispatch(
              actions.saveFailed(
                services.demoApi.buildErrorMessage(state.lang),
              ),
            );
          }
        },
      }),
    ],
  );
}
