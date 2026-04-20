import { EngineFacade } from '@machine-state-component/ui-state';
import { liveDocsActions } from '../../example/store/live-docs.actions';
import { liveDocsKernel } from '../../example/store/live-docs.kernel';
import {
  createLiveDocsInitialState,
  LiveDocsState,
  LiveDocsStatus,
} from '../../example/store/live-docs.types';

type LiveDocsEvent = ReturnType<
  (typeof liveDocsActions)[keyof typeof liveDocsActions]
>;

describe('live-docs transitions', () => {
  function createFacade() {
    const registration = liveDocsKernel.transitions as {
      transitions: Record<string, unknown>;
      globalTransitions: Record<string, unknown>;
    };

    return new EngineFacade<LiveDocsState, LiveDocsStatus, LiveDocsEvent>({
      initialState: createLiveDocsInitialState(),
      transitions: registration.transitions as never,
      globalTransitions: registration.globalTransitions as never,
      services: {},
    });
  }

  it('moves to saving and prepends a task on success', () => {
    const facade = createFacade();

    facade.commands.dispatch(
      liveDocsActions.changeDraftTitle('Document facade'),
    );
    facade.commands.dispatch(liveDocsActions.requestSave());

    expect(facade.state().status).toBe('saving');

    facade.commands.dispatch(
      liveDocsActions.saveSucceeded(
        {
          id: 'task-200',
          title: 'Document facade',
          status: 'open',
        },
        'Task saved.',
      ),
    );

    expect(facade.state().status).toBe('ready');
    expect(facade.state().draftTitle).toBe('');
    expect(facade.state().tasks.at(0)?.title).toBe('Document facade');
  });

  it('updates filter, toggles a task and resets while preserving language', () => {
    const facade = createFacade();

    facade.commands.dispatch(liveDocsActions.setFilter('done'));
    expect(facade.state().filter).toBe('done');

    facade.commands.dispatch(liveDocsActions.toggleTask('task-1'));
    expect(
      facade.state().tasks.find((task) => task.id === 'task-1')?.status,
    ).toBe('done');

    facade.commands.dispatch(liveDocsActions.deleteTask('task-3'));
    expect(
      facade.state().tasks.find((task) => task.id === 'task-3')?.status,
    ).toBe('deleted');

    facade.commands.dispatch(liveDocsActions.setLang('en'));
    facade.commands.dispatch(liveDocsActions.reset());

    expect(facade.state().lang).toBe('en');
    expect(facade.state().status).toBe('ready');
    expect(facade.state().filter).toBe('all');
    expect(facade.state().draftTitle).toBe('');
  });
});
