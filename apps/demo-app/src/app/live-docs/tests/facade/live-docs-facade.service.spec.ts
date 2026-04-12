import { TestBed } from '@angular/core/testing';
import { EngineDevtoolsManagerService } from '@machine-state-component/ui-state';
import { LiveDocsFacadeService } from '../../example/facade/live-docs-facade.service';
import { LiveDocsMockService } from '../../example/services/live-docs.mock.service';

describe('LiveDocsFacadeService', () => {
  const mockInspector = {
    toggle: jest.fn(),
    destroy: jest.fn(),
  };

  const mockDevtoolsManager = {
    bind: jest.fn(() => mockInspector),
  };

  const mockApi = {
    persistTask: jest.fn(),
    buildSuccessMessage: jest.fn(() => 'ok'),
    buildErrorMessage: jest.fn(() => 'boom'),
    buildBlankDraftMessage: jest.fn(() => 'empty'),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockApi.persistTask.mockReset();
    mockApi.persistTask.mockImplementation(() => new Promise(() => undefined));

    TestBed.configureTestingModule({
      providers: [
        LiveDocsFacadeService,
        {
          provide: LiveDocsMockService,
          useValue: mockApi,
        },
        {
          provide: EngineDevtoolsManagerService,
          useValue: mockDevtoolsManager,
        },
      ],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debounces rapid draft updates into one action dispatch', () => {
    const facade = TestBed.inject(LiveDocsFacadeService);
    const changeDraftSpy = jest.spyOn(facade.actions, 'changeDraftTitle');

    facade.updateDraftTitle('D');
    facade.updateDraftTitle('Do');
    facade.updateDraftTitle('Doc');

    expect(changeDraftSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(399);
    expect(changeDraftSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(changeDraftSpy).toHaveBeenCalledTimes(1);
    expect(changeDraftSpy).toHaveBeenCalledWith('Doc');
    expect(facade.state().draftTitle).toBe('Doc');
  });

  it('flushes the latest draft before saving', () => {
    const facade = TestBed.inject(LiveDocsFacadeService);
    const changeDraftSpy = jest.spyOn(facade.actions, 'changeDraftTitle');
    const requestSaveSpy = jest.spyOn(facade.actions, 'requestSave');

    facade.updateDraftTitle('Write docs');
    facade.saveTask('Write docs');

    expect(changeDraftSpy).toHaveBeenCalledTimes(1);
    expect(changeDraftSpy).toHaveBeenCalledWith('Write docs');
    expect(requestSaveSpy).toHaveBeenCalledTimes(1);
    expect(facade.state().draftTitle).toBe('Write docs');
    expect(facade.state().status).toBe('saving');

    jest.advanceTimersByTime(500);
    expect(changeDraftSpy).toHaveBeenCalledTimes(1);
  });

  it('starts a new changeDraftTitle counter after another action breaks the sequence', () => {
    const facade = TestBed.inject(LiveDocsFacadeService);

    facade.updateDraftTitle('A');
    jest.advanceTimersByTime(400);

    facade.actions.requestSave();

    facade.updateDraftTitle('B');
    jest.advanceTimersByTime(400);

    const changeDraftEntries = facade
      .eventTimeline()
      .filter(
        (entry) =>
          entry.kind === 'action' &&
          entry.title === 'live-docs/changeDraftTitle',
      );

    expect(changeDraftEntries).toHaveLength(2);
    expect(changeDraftEntries[0]?.count).toBe(1);
    expect(changeDraftEntries[1]?.count).toBe(1);
  });
});
