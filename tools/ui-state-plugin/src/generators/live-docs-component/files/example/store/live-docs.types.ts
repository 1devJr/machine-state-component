import { EngineState } from '@machine-state-component/ui-state';

export type LiveDocsStatus = 'idle' | 'saving' | 'ready' | 'error';
export type LiveDocsFilter = 'all' | 'open' | 'done';
export type LiveDocsSaveMode = 'success' | 'error';
export type LiveDocsLang = 'pt-br' | 'en';
export type LiveDocsTaskStatus = 'open' | 'done' | 'deleted';

export interface LiveDocsTask {
  id: string;
  title: string;
  status: LiveDocsTaskStatus;
}

export interface LiveDocsChildProjection {
  status: string;
  eventCount: number;
  lastEventType: string | null;
}

export interface LiveDocsServices {
  [key: string]: unknown;
  demoApi: {
    persistTask: (
      title: string,
      mode: LiveDocsSaveMode,
      lang: LiveDocsLang,
    ) => Promise<LiveDocsTask>;
    buildSuccessMessage: (title: string, lang: LiveDocsLang) => string;
    buildErrorMessage: (lang: LiveDocsLang) => string;
    buildBlankDraftMessage: (lang: LiveDocsLang) => string;
  };
}

export interface LiveDocsState extends EngineState<LiveDocsStatus> {
  lang: LiveDocsLang;
  draftTitle: string;
  filter: LiveDocsFilter;
  tasks: LiveDocsTask[];
  nextSaveMode: LiveDocsSaveMode;
  lastUserActionType: string | null;
  lastTransitionLabel: string;
  lastChangedFields: string[];
  feedbackMessage: string;
  errorMessage: string | null;
  lastSavedTaskTitle: string | null;
}

export function createLiveDocsInitialTasks(): LiveDocsTask[] {
  return [
    {
      id: 'task-1',
      title: 'Map action intent',
      status: 'open',
    },
    {
      id: 'task-2',
      title: 'Keep transitions pure',
      status: 'done',
    },
    {
      id: 'task-3',
      title: 'Inspect Devtools overlay',
      status: 'open',
    },
  ];
}

export function createLiveDocsInitialState(
  lang: LiveDocsLang = 'pt-br',
): LiveDocsState {
  return {
    status: 'ready',
    lang,
    draftTitle: '',
    filter: 'all',
    tasks: createLiveDocsInitialTasks(),
    nextSaveMode: 'success',
    lastUserActionType: null,
    lastTransitionLabel:
      lang === 'pt-br'
        ? 'Estado inicial do exemplo Task Manager.'
        : 'Initial Task Manager example state.',
    lastChangedFields: [],
    feedbackMessage:
      lang === 'pt-br'
        ? 'Escreva uma tarefa, salve, conclua ou exclua itens e observe a engine reagir.'
        : 'Type a task, save it, complete or delete items and watch the engine react.',
    errorMessage: null,
    lastSavedTaskTitle: null,
  };
}
