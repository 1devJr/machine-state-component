import { createLiveDocsEffects } from '../../example/store/live-docs.effects';
import { liveDocsActions } from '../../example/store/live-docs.actions';
import { createLiveDocsInitialState } from '../../example/store/live-docs.types';

describe('live-docs effects', () => {
  const saveEffect = createLiveDocsEffects().find(
    (effect) => effect.id === 'live-docs-request-save-effect',
  );

  it('dispatches saveSucceeded when the mock service resolves', async () => {
    const dispatch = jest.fn();

    await saveEffect?.handler(
      {
        ...createLiveDocsInitialState(),
        draftTitle: 'Document facade boundary',
        nextSaveMode: 'success',
      },
      liveDocsActions.requestSave(),
      {
        dispatch,
        services: {
          demoApi: {
            persistTask: jest.fn().mockResolvedValue({
              id: 'task-500',
              title: 'Document facade boundary',
              status: 'open',
            }),
            buildSuccessMessage: () => 'ok',
            buildErrorMessage: () => 'boom',
            buildBlankDraftMessage: () => 'empty',
          },
        },
        getState: createLiveDocsInitialState,
      },
    );

    expect(dispatch).toHaveBeenCalledWith(
      liveDocsActions.saveSucceeded(
        {
          id: 'task-500',
          title: 'Document facade boundary',
          status: 'open',
        },
        'ok',
      ),
    );
  });

  it('dispatches saveFailed when the mock service rejects', async () => {
    const dispatch = jest.fn();

    await saveEffect?.handler(
      {
        ...createLiveDocsInitialState(),
        draftTitle: 'Fail on purpose',
        nextSaveMode: 'error',
      },
      liveDocsActions.requestSave(),
      {
        dispatch,
        services: {
          demoApi: {
            persistTask: jest.fn().mockRejectedValue(new Error('boom')),
            buildSuccessMessage: () => 'ok',
            buildErrorMessage: () => 'boom',
            buildBlankDraftMessage: () => 'empty',
          },
        },
        getState: createLiveDocsInitialState,
      },
    );

    expect(dispatch).toHaveBeenCalledWith(liveDocsActions.saveFailed('boom'));
  });
});
