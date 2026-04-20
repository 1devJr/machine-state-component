import { LiveDocsLang } from './example/store/live-docs.types';

export type LiveDocsSectionId =
  | 'overview'
  | 'actions'
  | 'transitions'
  | 'effects'
  | 'selections'
  | 'facade'
  | 'pluggables'
  | 'composition'
  | 'testing'
  | 'devtools';

export interface LiveDocsCodeTab {
  id: string;
  label: string;
  fileName: string;
  note: string;
  code: string;
  walkthrough?: LiveDocsCodeWalkthrough[];
}

export interface LiveDocsQuestionCard {
  title: string;
  body: string;
}

export interface LiveDocsCodeWalkthrough {
  title: string;
  body: string;
  snippet?: string;
  hint?: string;
}

export interface LiveDocsLinkCard {
  label: string;
  to: string;
  hint: string;
}

export interface LiveDocsSectionContent {
  id: LiveDocsSectionId;
  label: string;
  title: string;
  lede: string;
  exampleNote: string;
  cards: LiveDocsQuestionCard[];
  sourceTabs: LiveDocsCodeTab[];
  diagram?: string;
  diagramNodeLinks?: Partial<Record<string, LiveDocsSectionId>>;
  links?: LiveDocsLinkCard[];
}

const flowDiagram = `flowchart LR
  facade["Facade"] --> action["Action"]
  action --> transition["Transition"]
  transition --> state["State"]
  action --> effect["Effect"]
  effect --> action
  state --> selection["Selection"]
  selection --> ui["UI"]
`;

const compositionDiagram = `flowchart LR
  parent["Parent Core"] --> link["Linked action"]
  link --> child["Child Core"]
  child --> projection["Projection Slice"]
  projection --> parent
  parent --> ui["Parent UI"]
`;

const devtoolsDiagram = `flowchart LR
  ui["UI interaction"] --> facade["Engine Facade"]
  facade --> transition["Transition log"]
  facade --> effects["Effects log"]
  facade --> selections["Selections snapshot"]
  transition --> overlay["Devtools Overlay"]
  effects --> overlay
  selections --> overlay
`;

const actionsSnippet = `import { defineActionCatalog } from '@machine-state-component/ui-state';
import { LiveDocsFilter, LiveDocsLang, LiveDocsSaveMode, LiveDocsTask } from './live-docs.types';

export const liveDocsActionCatalog = defineActionCatalog({
  changeDraftTitle: {
    type: 'live-docs/changeDraftTitle',
    payload: (title: string) => ({ title }),
  },
  setFilter: {
    type: 'live-docs/setFilter',
    payload: (filter: LiveDocsFilter) => ({ filter }),
  },
  setNextSaveMode: {
    type: 'live-docs/setNextSaveMode',
    payload: (mode: LiveDocsSaveMode) => ({ mode }),
  },
  requestSave: {
    type: 'live-docs/requestSave',
  },
  saveSucceeded: {
    type: 'live-docs/saveSucceeded',
    payload: (task: LiveDocsTask, message: string) => ({ task, message }),
  },
  saveFailed: {
    type: 'live-docs/saveFailed',
    payload: (message: string) => ({ message }),
  },
  toggleTask: {
    type: 'live-docs/toggleTask',
    payload: (id: string) => ({ id }),
  },
  deleteTask: {
    type: 'live-docs/deleteTask',
    payload: (id: string) => ({ id }),
  },
  setLang: {
    type: 'live-docs/setLang',
    payload: (lang: LiveDocsLang) => ({ lang }),
  },
  reset: {
    type: 'live-docs/reset',
  },
});`;

const actionsCatalogFocusSnippet = `defineActionCatalog({
  changeDraftTitle: {
    type: 'live-docs/changeDraftTitle',
    payload: (title: string) => ({ title }),
  },
});`;

const actionTypeFocusSnippet = `changeDraftTitle: {
  type: 'live-docs/changeDraftTitle',
  payload: (title: string) => ({ title }),
},`;

const actionPayloadFocusSnippet = `payload: (title: string) => ({ title })`;

const actionAddNewSnippet = `archiveTask: {
  type: 'live-docs/archiveTask',
  payload: (id: string) => ({ id }),
},`;

const transitionsSnippet = `export function createLiveDocsTransitions() {
  return defineKernelTransitions<LiveDocsState>()(
    liveDocsActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.requestSave, (state) => ({
          ...state,
          status: 'saving',
          feedbackMessage:
            'O effect agora esta simulando uma persistencia assincrona.',
          errorMessage: null,
          lastUserActionType: liveDocsActionTypes.requestSave,
          lastTransitionLabel:
            'A transition de salvamento colocou o exemplo em saving.',
          lastChangedFields: ['status', 'feedbackMessage', 'errorMessage'],
        }))
        .globalOn(actions.saveSucceeded, (state, event) => ({
          ...state,
          status: 'ready',
          draftTitle: '',
          tasks: [event.task, ...state.tasks],
          lastSavedTaskTitle: event.task.title,
          feedbackMessage: event.message,
          errorMessage: null,
          lastTransitionLabel:
            'A transition derivada concluiu o caminho feliz e anexou a nova tarefa.',
          lastChangedFields: [
            'status',
            'tasks',
            'draftTitle',
            'lastSavedTaskTitle',
            'feedbackMessage',
          ],
        }))
        .globalOn(actions.toggleTask, (state, event) => ({
          ...state,
          tasks: state.tasks.map((task) =>
            task.id === event.id && task.status !== 'deleted'
              ? { ...task, status: task.status === 'done' ? 'open' : 'done' }
              : task,
          ),
        }))
        .globalOn(actions.deleteTask, (state, event) => ({
          ...state,
          tasks: state.tasks.map((task) =>
            task.id === event.id ? { ...task, status: 'deleted' } : task,
          ),
        }))
        .done(),
  );
}`;

const transitionsSetupSnippet = `defineKernelTransitions<LiveDocsState>()(
  liveDocsActions,
  ({ chain, actions }) =>
    chain()
      .globalOn(actions.requestSave, (state) => ({
        ...state,
        status: 'saving',
      }))
      .done(),
)`;

const transitionsRequestSaveSnippet = `.globalOn(actions.requestSave, (state) => ({
  ...state,
  status: 'saving',
  feedbackMessage:
    'O effect agora esta simulando uma persistencia assincrona.',
  errorMessage: null,
  lastUserActionType: liveDocsActionTypes.requestSave,
}))`;

const transitionsSuccessSnippet = `.globalOn(actions.saveSucceeded, (state, event) => ({
  ...state,
  status: 'ready',
  draftTitle: '',
  tasks: [event.task, ...state.tasks],
  feedbackMessage: event.message,
}))`;

const transitionsLocalSnippet = `.globalOn(actions.toggleTask, (state, event) => ({
  ...state,
  tasks: state.tasks.map((task) =>
    task.id === event.id && task.status !== 'deleted'
      ? { ...task, status: task.status === 'done' ? 'open' : 'done' }
      : task,
  ),
}))`;

const effectsSnippet = `export function createLiveDocsEffects() {
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
              actions.saveFailed(services.demoApi.buildErrorMessage(state.lang)),
            );
          }
        },
      }),
    ],
  );
}`;

const effectsSetupSnippet = `defineKernelEffects<LiveDocsState, LiveDocsServices>()(
  liveDocsActions,
  ({ on, actions }) => [
    on(actions.requestSave, {
      id: 'live-docs-request-save-effect',
      priority: 10,
      handler: async ({ state, dispatch, services }) => {
        // ...
      },
    }),
  ],
)`;

const effectsValidationSnippet = `const title = state.draftTitle.trim();

if (!title) {
  dispatch(
    actions.saveFailed(
      services.demoApi.buildBlankDraftMessage(state.lang),
    ),
  );
  return;
}`;

const effectsSuccessSnippet = `const task = await services.demoApi.persistTask(
  title,
  state.nextSaveMode,
  state.lang,
);

dispatch(
  actions.saveSucceeded(
    task,
    services.demoApi.buildSuccessMessage(task.title, state.lang),
  ),
);`;

const effectsErrorSnippet = `try {
  // persistencia externa
} catch {
  dispatch(
    actions.saveFailed(services.demoApi.buildErrorMessage(state.lang)),
  );
}`;

const kernelSelectionsSnippet = `export function createLiveDocsKernelSelections() {
  return defineSelections((state: Signal<LiveDocsState>) => ({
    currentStatus: () => state().status,
    currentFilter: () => state().filter,
    draftTitle: () => state().draftTitle,
    selectedSaveMode: () => state().nextSaveMode,
    lastActionType: () => state().lastUserActionType,
    feedbackMessage: () => state().feedbackMessage,
  }));
}`;

const composedSelectionsSnippet = `selections: defineSelections((state: Signal<LiveDocsComposedState>) => ({
  ...liveDocsKernel.selections(state as Signal<LiveDocsState>),
  visibleTasks: () => getVisibleTasks(state()),
  canSave: () =>
    state().draftTitle.trim().length > 0 && state().status !== 'saving',
  taskSummary: () => {
    const open = state().tasks.filter((task) => task.status === 'open').length;
    const done = state().tasks.filter((task) => task.status === 'done').length;
    const deleted = state().tasks.filter((task) => task.status === 'deleted').length;

    return {
      total: state().tasks.length,
      open,
      done,
      deleted,
    };
  },
  childProjectionSummary: () => {
    const projection = state().historyProjection;
    if (!projection) {
      return 'A projection slice so aparece quando voce entra em Composition.';
    }

    return \`\${projection.status} | \${projection.eventCount} evento(s)\`;
  },
}))`;

const kernelSelectionsFocusSnippet = `defineSelections((state: Signal<LiveDocsState>) => ({
  currentStatus: () => state().status,
  currentFilter: () => state().filter,
  draftTitle: () => state().draftTitle,
  feedbackMessage: () => state().feedbackMessage,
}))`;

const composedSelectionsFocusSnippet = `visibleTasks: () => getVisibleTasks(state()),
canSave: () =>
  state().draftTitle.trim().length > 0 && state().status !== 'saving',`;

const selectionSummarySnippet = `taskSummary: () => {
  const open = state().tasks.filter((task) => task.status === 'open').length;
  const done = state().tasks.filter((task) => task.status === 'done').length;
  const deleted = state().tasks.filter((task) => task.status === 'deleted').length;

  return {
    total: state().tasks.length,
    open,
    done,
    deleted,
  };
}`;

const facadeSnippet = `@Injectable()
export class LiveDocsFacadeService implements OnDestroy {
  readonly #demoApi = inject(LiveDocsMockService);
  readonly #devtoolsManager = inject(EngineDevtoolsManagerService);
  readonly childDemoCore = createLiveDocsChildDemo();
  #pendingDraftTitle: string | null = null;
  #draftDebounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  readonly core = createComposedEngine(
    createLiveDocsArtifact(this.#demoApi, this.childDemoCore),
  );

  readonly bindings = createFacadeBindings(this.core);
  readonly state = this.bindings.state;
  readonly actions = this.bindings.actions;
  readonly selections = this.bindings.selections;
  readonly composition = this.bindings.composition;
  readonly engineFacade = this.bindings.engineFacade;

  readonly #devtools = this.#devtoolsManager.bind(this.engineFacade, {
    title: 'Live Docs Devtools',
    subtitle: 'Observabilidade real da store, das transitions e dos effects.',
    getSelectionsSnapshot: () => this.liveSelectionSnapshot(),
  });

  updateDraftTitle(title: string): void {
    this.#pendingDraftTitle = title;
    this.#clearDraftDebounceTimer();
    this.#draftDebounceTimer = globalThis.setTimeout(() => {
      const nextTitle = this.#pendingDraftTitle;
      this.#pendingDraftTitle = null;
      this.#clearDraftDebounceTimer();

      if (nextTitle && nextTitle !== this.state().draftTitle) {
        this.actions.changeDraftTitle(nextTitle);
      }
    }, 400);
  }

  setFilter(filter: 'all' | 'open' | 'done'): void {
    if (filter === this.state().filter) {
      return;
    }

    this.actions.setFilter(filter);
  }

  saveTask(title = this.state().draftTitle): void {
    this.#pendingDraftTitle = title;
    this.#clearDraftDebounceTimer();

    if (title !== this.state().draftTitle) {
      this.actions.changeDraftTitle(title);
    }

    this.actions.requestSave();
  }

  #clearDraftDebounceTimer(): void {
    if (this.#draftDebounceTimer === null) {
      return;
    }

    globalThis.clearTimeout(this.#draftDebounceTimer);
    this.#draftDebounceTimer = null;
  }
}`;

const facadeDispatchFocusSnippet = `readonly actions = this.bindings.actions;

updateDraftTitle(title: string): void {
  this.#pendingDraftTitle = title;
  this.#clearDraftDebounceTimer();
  this.#draftDebounceTimer = globalThis.setTimeout(() => {
    const nextTitle = this.#pendingDraftTitle;

    if (nextTitle && nextTitle !== this.state().draftTitle) {
      this.actions.changeDraftTitle(nextTitle);
    }
  }, 400);
}`;

const facadeSaveFocusSnippet = `saveTask(title = this.state().draftTitle): void {
  this.#pendingDraftTitle = title;
  this.#clearDraftDebounceTimer();

  if (title !== this.state().draftTitle) {
    this.actions.changeDraftTitle(title);
  }

  this.actions.requestSave();
}`;

const facadeBindingsSnippet = `readonly core = createComposedEngine(
  createLiveDocsArtifact(this.#demoApi, this.childDemoCore),
);

readonly bindings = createFacadeBindings(this.core);
readonly state = this.bindings.state;
readonly actions = this.bindings.actions;
readonly selections = this.bindings.selections;`;

const facadeDevtoolsSnippet = `readonly #devtools = this.#devtoolsManager.bind(this.engineFacade, {
  title: 'Live Docs Devtools',
  subtitle: 'Observabilidade real da store, das transitions e dos effects.',
  getSelectionsSnapshot: () => this.liveSelectionSnapshot(),
});

toggleDevtools(): void {
  this.#devtools.toggle();
}`;

const artifactSnippet = `export function createLiveDocsArtifact(
  demoApi: LiveDocsServices['demoApi'],
  childDemoCore: LiveDocsChildDemo = createLiveDocsChildDemo(),
) {
  return createCoreArtifact(liveDocsKernel, {
    services: {
      demoApi,
    },
    composition: ({ parentPort }) =>
      createComposition(liveDocsCompositionSchema, { parentPort })
        .withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
          title: 'PrimaryActionButtonPluggable',
          hint: 'A UI do botao continua igual; o core decide quando salvar.',
          buttonLabel: 'Salvar tarefa',
          createEvent: () => liveDocsActions.requestSave(),
        })
        .withChildCore('history', childDemoCore.connectionPort)
        .connectChild('history', ({ parent, child, link }) => ({
          parentToChild: [
            link(
              parent.actions.requestSave,
              child.actions.recordParentEvent,
            ).map((event) => ({
              eventType: event.type,
              note: 'O pai disparou requestSave e o child acompanhou o fluxo.',
            })),
          ],
          projection: {
            initialState: {
              status: 'idle',
              eventCount: 0,
              lastEventType: null,
            },
            select: (childState) => ({
              status: childState.status,
              eventCount: childState.eventCount,
              lastEventType: childState.lastEventType,
            }),
          },
        }))
        .build(),
  });
}`;

const pluggableSnippet = `@Component({
  selector: 'app-primary-action-button-pluggable',
  templateUrl: './primary-action-button.pluggable.html',
  styleUrl: './primary-action-button.pluggable.scss',
})
export class PrimaryActionButtonPluggableComponent extends EnginePluggableBase<
  EngineState<string>,
  string,
  EngineEvent,
  PrimaryActionButtonConfig
> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({});

  run(): void {
    if (this.mergedConfig().disabled) {
      return;
    }

    this.dispatch(this.mergedConfig().createEvent());
  }
}`;

const pluggableRunSnippet = `run(): void {
  if (this.mergedConfig().disabled) {
    return;
  }

  this.dispatch(this.mergedConfig().createEvent());
}`;

const taskBoardArtifactSnippet = `createComposition(taskBoardSchema, { parentPort })
  .withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
    title: 'Reusable pluggable',
    hint: 'The same pluggable is used in another core, but here it opens a local modal.',
    buttonLabel: 'Add task',
    createEvent: () => taskBoardActions.openCreateTaskModal(),
  })
  .build()`;

const taskBoardConfigSnippet = `.withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
  title: 'Reusable pluggable',
  hint: 'The same pluggable is used in another core, but here it opens a local modal.',
  buttonLabel: 'Add task',
  createEvent: () => taskBoardActions.openCreateTaskModal(),
})`;

const projectOverviewArtifactSnippet = `createComposition(projectOverviewSchema, { parentPort })
  .withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
    title: 'Reusable pluggable',
    hint: 'The same pluggable is used in Task Board, but here the core turns it into navigation.',
    buttonLabel: 'Add task',
    createEvent: () => projectOverviewActions.goToTaskCreationPage(),
  })
  .build()`;

const projectOverviewConfigSnippet = `.withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
  title: 'Reusable pluggable',
  hint: 'The same pluggable is used in Task Board, but here the core turns it into navigation.',
  buttonLabel: 'Add task',
  createEvent: () => projectOverviewActions.goToTaskCreationPage(),
})`;

const compositionConnectSnippet = `.connectChild('history', ({ parent, child, link }) => ({
  parentToChild: [
    link(
      parent.actions.requestSave,
      child.actions.recordParentEvent,
    ).map((event) => ({
      eventType: event.type,
      note: 'O pai disparou requestSave e o child acompanhou o fluxo.',
    })),
  ],
  projection: {
    initialState: {
      status: 'idle',
      eventCount: 0,
      lastEventType: null,
    },
    select: (childState) => ({
      status: childState.status,
      eventCount: childState.eventCount,
      lastEventType: childState.lastEventType,
    }),
  },
}))`;

const compositionProjectionSnippet = `projection: {
  initialState: {
    status: 'idle',
    eventCount: 0,
    lastEventType: null,
  },
  select: (childState) => ({
    status: childState.status,
    eventCount: childState.eventCount,
    lastEventType: childState.lastEventType,
  }),
}`;

const childKernelSnippet = `export const liveDocsChildDemoKernel = defineCoreKernel({
  id: 'live-docs-child-demo',
  store: defineStore<LiveDocsChildDemoState>({
    initialState: createLiveDocsChildDemoInitialState(),
  }),
  actions: liveDocsChildDemoActions,
  transitions: defineKernelTransitions<LiveDocsChildDemoState>()(
    liveDocsChildDemoActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.recordParentEvent, (state, event) => ({
          ...state,
          status: 'ready',
          eventCount: state.eventCount + 1,
          lastEventType: event.eventType,
          notes: [event.note, ...state.notes].slice(0, 4),
        }))
        .globalOn(actions.clear, () => createLiveDocsChildDemoInitialState())
        .done(),
  ),
});`;

const childKernelFocusSnippet = `.globalOn(actions.recordParentEvent, (state, event) => ({
  ...state,
  status: 'ready',
  eventCount: state.eventCount + 1,
  lastEventType: event.eventType,
  notes: [event.note, ...state.notes].slice(0, 4),
}))`;

const transitionsTestSnippet = `describe('live-docs transitions', () => {
  it('moves to saving and then appends a task on success', () => {
    const facade = createFacade();

    facade.commands.dispatch(liveDocsActions.changeDraftTitle('Draft docs tabs'));
    facade.commands.dispatch(liveDocsActions.requestSave());

    expect(facade.state().status).toBe('saving');

    facade.commands.dispatch(
      liveDocsActions.saveSucceeded(
        { id: 'task-200', title: 'Draft docs tabs', status: 'open' },
        'A tarefa foi adicionada.',
      ),
    );

    expect(facade.state().status).toBe('ready');
    expect(facade.state().tasks.at(0)?.title).toBe('Draft docs tabs');
  });
});`;

const transitionsTestFocusSnippet = `facade.commands.dispatch(liveDocsActions.changeDraftTitle('Draft docs tabs'));
facade.commands.dispatch(liveDocsActions.requestSave());

expect(facade.state().status).toBe('saving');`;

const effectsTestSnippet = `describe('live-docs effects', () => {
  const saveEffect = createLiveDocsEffects().find(
    (effect) => effect.id === 'live-docs-request-save-effect',
  );

  it('dispatches saveSucceeded when the mock service resolves', async () => {
    const dispatch = jest.fn();

    await saveEffect?.handler({
      state: {
        ...createLiveDocsInitialState(),
        draftTitle: 'Document facade boundary',
        nextSaveMode: 'success',
      },
      event: liveDocsActions.requestSave(),
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
    });

    expect(dispatch).toHaveBeenCalledWith(
      liveDocsActions.saveSucceeded(
        { id: 'task-500', title: 'Document facade boundary', status: 'open' },
        'ok',
      ),
    );
  });
});`;

const effectsTestFocusSnippet = `await saveEffect?.handler({
  state: {
    ...createLiveDocsInitialState(),
    draftTitle: 'Document facade boundary',
    nextSaveMode: 'success',
  },
  event: liveDocsActions.requestSave(),
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
});`;

const devtoolsBindingSnippet = `readonly #devtools = this.#devtoolsManager.bind(this.engineFacade, {
  title: 'Live Docs Devtools',
  subtitle: 'Observabilidade real da store, das transitions e dos effects.',
  getSelectionsSnapshot: () => this.liveSelectionSnapshot(),
});`;

const devtoolsSnapshotSnippet = `getSelectionsSnapshot: () => this.liveSelectionSnapshot()`;

const devtoolsOpenSnippet = `toggleDevtools(): void {
  this.#devtools.toggle();
}`;

function buildOverviewCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que voce esta vendo',
          body: 'Uma pagina de documentacao viva: texto simples, exemplo executavel, trechos de codigo e o fluxo da engine renderizado em Mermaid.',
        },
        {
          title: 'Por que usar este exemplo',
          body: 'Task Manager e pequeno, mas cobre facade, actions, transitions, effects, selections, pluggables e composicao sem virar dashboard.',
        },
        {
          title: 'O que observar no runtime',
          body: 'Escreva uma tarefa, salve, conclua ou exclua itens e observe a timeline, as selections e o resumo do runtime mudarem.',
        },
        {
          title: 'Como ler o codigo',
          body: 'Comece em actions.ts, siga para transitions.ts, depois effects.ts, selections.ts, artifact.ts e facade.ts.',
        },
      ]
    : [
        {
          title: 'What you are looking at',
          body: 'A live documentation page: simple text, a runnable example, curated source tabs and the engine flow rendered with Mermaid.',
        },
        {
          title: 'Why this example',
          body: 'Task Manager is small but still covers facade, actions, transitions, effects, selections, pluggables and composition.',
        },
        {
          title: 'What to watch in runtime',
          body: 'Type a task, save it, complete or delete items and watch the timeline, selections and runtime summary change.',
        },
        {
          title: 'How to read the code',
          body: 'Start with actions.ts, then transitions.ts, effects.ts, selections.ts, artifact.ts and facade.ts.',
        },
      ];
}

function buildActionsCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que uma action realmente faz',
          body: 'Action nao muda estado sozinha. Ela registra uma intencao publica do componente. Pense nela como uma frase curta que diz para a engine o que o usuario ou a interface pediu para fazer.',
        },
        {
          title: 'Por que a action vem primeiro',
          body: 'A facade, um pluggable ou um link de composicao disparam a action primeiro. Depois disso a engine decide quem reage: uma transition pura, um effect assincrono ou ambos, sempre nessa cadeia observavel.',
        },
        {
          title: 'O que faz uma action ser boa',
          body: 'Uma boa action tem nome claro, payload pequeno e sentido de negocio. Quem ler o catalogo precisa entender rapidamente o que o componente sabe fazer sem abrir varios arquivos.',
        },
        {
          title: 'Como pensar o campo type',
          body: 'O campo type e o identificador textual da action. E essa string que aparece no facade, no Devtools, nas transitions, nos effects e na timeline. Por isso vale manter um padrao previsivel, como nome-do-core/verboContexto.',
        },
        {
          title: 'Boas praticas de nome e payload',
          body: 'Use verbo + contexto, como changeDraftTitle, requestSave ou deleteTask. No payload, envie so o minimo necessario para a reacao acontecer. Evite mandar objetos enormes ou dados que a store ja conhece.',
        },
        {
          title: 'Como adicionar uma nova action',
          body: 'Primeiro declare a action no defineActionCatalog. Depois exponha um metodo curto na facade ou conecte a action a um pluggable. Em seguida escolha quem vai reagir: transition, effect ou os dois. Por fim, valide no exemplo se a timeline mostra a nova intencao com clareza.',
        },
        {
          title: 'Erros comuns ao modelar actions',
          body: 'Nao coloque regra de negocio dentro da action, nao use nomes vagos como updateData e nao crie actions duplicadas para a mesma intencao. Se duas actions significam quase a mesma coisa, o componente fica mais dificil de manter e testar.',
        },
      ]
    : [
        {
          title: 'What an action really does',
          body: 'An action does not change state by itself. It records a public intent of the component. Think of it as a short sentence telling the engine what the user or the UI asked to do.',
        },
        {
          title: 'Why the action comes first',
          body: 'The facade, a pluggable or a composition link dispatches the action first. After that, the engine decides who reacts: a pure transition, an async effect or both, always inside an observable chain.',
        },
        {
          title: 'What makes an action good',
          body: 'A good action has a clear name, a small payload and business meaning. Anyone reading the catalog should quickly understand what the component can do without opening many files.',
        },
        {
          title: 'Naming and payload best practices',
          body: 'Use verb + context, such as changeDraftTitle, requestSave or deleteTask. In the payload, send only the minimum needed for the reaction to happen. Avoid huge objects or data the store already knows.',
        },
        {
          title: 'How to add a new action',
          body: 'First declare the action inside defineActionCatalog. Then expose a short facade method or connect the action to a pluggable. Next decide who reacts: transition, effect or both. Finally validate in the example that the timeline shows the new intent clearly.',
        },
        {
          title: 'Common mistakes when modeling actions',
          body: 'Do not hide business rules inside the action, do not use vague names like updateData and do not create duplicate actions for the same intent. If two actions mean almost the same thing, the component becomes harder to maintain and test.',
        },
      ];
}

function buildActionsCatalogWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O papel do defineActionCatalog',
          body: 'defineActionCatalog e a funcao da biblioteca que registra o catalogo publico de actions do core. Ela ajuda a alinhar tipagem, runtime e autocompletar, para que facade, effects e transitions conversem com o mesmo contrato.',
          snippet: actionsCatalogFocusSnippet,
          hint: 'Comece sempre pelo catalogo. Depois disso fica mais facil decidir quais transitions e effects vao reagir.',
        },
        {
          title: '2. O campo type e o identificador da conversa',
          body: 'A string de type precisa ser estavel e clara, porque ela identifica a action em toda a engine. Quando a facade chama changeDraftTitle, o que realmente trafega no runtime e live-docs/changeDraftTitle.',
          snippet: actionTypeFocusSnippet,
          hint: 'Pense bem ao definir o type: ele sera o identificador usado pelo facade, pelo Devtools e pelos observadores da engine para manter toda a logica alinhada.',
        },
        {
          title: '3. Payload leva somente o minimo necessario',
          body: 'A funcao payload tipa a entrada e devolve um objeto pequeno. Isso deixa claro quais dados entram na action e evita transportar estado inteiro quando apenas um campo bastaria.',
          snippet: actionPayloadFocusSnippet,
          hint: 'Se a store ja conhece um dado, nao repita esse dado no payload sem necessidade.',
        },
        {
          title: '4. Como adicionar uma nova action',
          body: 'Para criar uma action nova, primeiro declare a intencao no catalogo. Depois exponha um metodo curto na facade e, por fim, escolha quem reage a ela: uma transition, um effect ou ambos.',
          snippet: actionAddNewSnippet,
          hint: 'Um bom teste mental e este: a equipe entende o que archiveTask faz apenas lendo o nome e o payload?',
        },
      ]
    : [
        {
          title: '1. The role of defineActionCatalog',
          body: 'defineActionCatalog is the library function that registers the public action catalog of the core. It keeps typing, runtime and autocomplete aligned so the facade, effects and transitions all share the same contract.',
          snippet: actionsCatalogFocusSnippet,
          hint: 'Always start from the catalog. After that it becomes easier to decide which transitions and effects should react.',
        },
        {
          title: '2. The type field is the identifier of the conversation',
          body: 'The type string must stay stable and readable because it identifies the action across the engine. When the facade calls changeDraftTitle, what actually travels through runtime is live-docs/changeDraftTitle.',
          snippet: actionTypeFocusSnippet,
          hint: 'Choose type carefully: it is the identifier used by the facade, Devtools and engine observers to keep the whole flow aligned.',
        },
        {
          title: '3. Payload carries only the minimum needed',
          body: 'The payload function types the input and returns a small object. That makes it obvious which data enters the action and avoids shipping a whole state shape when a single field would do.',
          snippet: actionPayloadFocusSnippet,
          hint: 'If the store already knows a piece of data, do not repeat it in the payload unless it is truly necessary.',
        },
        {
          title: '4. How to add a new action',
          body: 'To create a new action, first declare the intent in the catalog. Then expose a short facade method and finally decide who reacts to it: a transition, an effect or both.',
          snippet: actionAddNewSnippet,
          hint: 'A good mental test is this: can the team understand what archiveTask does just by reading the name and the payload?',
        },
      ];
}

function buildActionsFacadeWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. A facade descreve a intencao, nao escreve estado',
          body: 'Na facade, o ponto importante e este: a UI nao altera a store diretamente. Ela chama um metodo curto e esse metodo dispara uma action tipada. Isso mantem a borda Angular simples e previsivel.',
          snippet: facadeDispatchFocusSnippet,
          hint: 'Quando voce ler uma facade, procure por this.actions.algo(). Esse e o sinal de que a classe esta apenas descrevendo a intencao.',
        },
        {
          title: '2. O debounce continua na borda da interface',
          body: 'O debounce fica na facade porque ele faz parte da experiencia da tela, nao da regra de negocio da store. Assim a action changeDraftTitle so chega na engine quando faz sentido registrar a mudanca.',
          snippet: facadeDispatchFocusSnippet,
          hint: 'Transitions continuam puras porque nao precisam saber nada sobre tempo de digitacao.',
        },
        {
          title: '3. Salvar combina duas actions em sequencia',
          body: 'No salvar, a facade primeiro garante que o ultimo titulo digitado entrou no catalogo de actions e, logo depois, dispara requestSave. A persistencia de verdade fica para o effect reagir.',
          snippet: facadeSaveFocusSnippet,
          hint: 'Esse encadeamento mostra bem a divisao de responsabilidades: facade dispara, transition prepara o estado e effect fala com o mundo externo.',
        },
      ]
    : [
        {
          title: '1. The facade describes intent, it does not write state',
          body: 'Inside the facade, the key idea is this: the UI does not mutate the store directly. It calls a short method and that method dispatches a typed action. That keeps the Angular boundary simple and predictable.',
          snippet: facadeDispatchFocusSnippet,
          hint: 'When reading a facade, look for this.actions.something(). That is the sign the class is only describing intent.',
        },
        {
          title: '2. Debounce stays at the UI boundary',
          body: 'Debounce lives in the facade because it belongs to the screen experience, not to store business rules. This way the changeDraftTitle action reaches the engine only when it makes sense to record the change.',
          snippet: facadeDispatchFocusSnippet,
          hint: 'Transitions stay pure because they do not need to know anything about typing delay.',
        },
        {
          title: '3. Saving combines two actions in sequence',
          body: 'On save, the facade first guarantees that the last typed title enters the action catalog and only then dispatches requestSave. The actual persistence is left for the effect to react.',
          snippet: facadeSaveFocusSnippet,
          hint: 'This sequence is a good example of responsibility split: facade dispatches, transition prepares state and effect talks to the outside world.',
        },
      ];
}

function buildTransitionsCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que uma transition faz',
          body: 'Transition e a camada que recebe uma action e devolve o proximo estado. Ela nao conversa com servicos externos e nao espera tempo: apenas calcula o novo estado da store.',
        },
        {
          title: 'Por que transitions precisam ser puras',
          body: 'Quando a transition depende so de estado atual + action, ela fica previsivel. Isso facilita leitura, reaproveitamento mental do fluxo e testes unitarios bem curtos.',
        },
        {
          title: 'Como ler um arquivo de transitions',
          body: 'Leia cada globalOn como um ramo do comportamento. Pergunte: qual action entrou, quais campos mudaram e que mensagem de runtime essa mudanca deveria deixar para a UI ou para o Devtools.',
        },
        {
          title: 'Quando criar uma transition nova',
          body: 'Crie uma nova transition sempre que uma nova action precisar escrever estado. Se a action so aciona IO externo, a transition ainda pode existir para preparar loading, limpar erro ou registrar contexto antes do effect.',
        },
        {
          title: 'Erros comuns',
          body: 'O erro mais comum e esconder logica assicrona dentro da transition ou deixar o ramo grande demais. Se um ramo comecar a ficar dificil de entender, normalmente a action esta grande demais ou a responsabilidade foi mal dividida.',
        },
      ]
    : [
        {
          title: 'What a transition does',
          body: 'A transition receives an action and returns the next state. It does not talk to external services and it does not wait on time: it only computes the next store state.',
        },
        {
          title: 'Why transitions must stay pure',
          body: 'When a transition depends only on current state + action, it becomes predictable. That makes the flow easier to read and makes unit tests short and reliable.',
        },
        {
          title: 'How to read a transitions file',
          body: 'Read each globalOn as one behavior branch. Ask: which action came in, which fields changed and what runtime message should that change leave behind for the UI or Devtools.',
        },
        {
          title: 'When to create a new transition',
          body: 'Create a new transition whenever a new action needs to write state. If the action only triggers external IO, a transition may still exist to prepare loading, clear errors or register context before the effect runs.',
        },
        {
          title: 'Common mistakes',
          body: 'The most common mistake is hiding async logic inside the transition or letting one branch grow too large. If a branch becomes hard to read, the action is usually too broad or the responsibility split is off.',
        },
      ];
}

function buildTransitionsWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. A transition nasce ligada ao catalogo de actions',
          body: 'O defineKernelTransitions recebe o catalogo de actions e abre uma cadeia de ramos observaveis. Isso garante que a store reaja so ao que foi declarado publicamente no core.',
          snippet: transitionsSetupSnippet,
          hint: 'Repare que a transition nao inventa eventos. Ela sempre responde a actions que ja existem no catalogo.',
        },
        {
          title: '2. requestSave prepara o estado antes do effect',
          body: 'Quando requestSave entra, a transition coloca o estado em saving, limpa erro e registra mensagem de fluxo. Essa preparacao e importante para a UI reagir imediatamente, sem esperar a persistencia terminar.',
          snippet: transitionsRequestSaveSnippet,
          hint: 'Loading, limpeza de erro e contexto visual costumam nascer aqui.',
        },
        {
          title: '3. saveSucceeded escreve o caminho feliz',
          body: 'Depois que o effect devolve saveSucceeded, a transition anexa a nova tarefa, limpa o rascunho e atualiza a mensagem para refletir o sucesso. O effect nao escreve nada direto: quem atualiza a store continua sendo a transition.',
          snippet: transitionsSuccessSnippet,
          hint: 'Uma boa leitura de transition sempre responde: o que muda na store quando tudo da certo?',
        },
        {
          title: '4. Nem toda transition precisa ser complexa',
          body: 'toggleTask mostra um caso simples e muito comum: action entra, um campo muda e a UI reage. Mesmo um ramo pequeno merece existir aqui para manter a regra centralizada.',
          snippet: transitionsLocalSnippet,
          hint: 'Se a acao muda estado, mesmo que pouco, o lugar natural dela continua sendo transitions.ts.',
        },
      ]
    : [
        {
          title: '1. A transition is wired to the action catalog',
          body: 'defineKernelTransitions receives the action catalog and opens a chain of observable branches. This guarantees the store reacts only to intents that were declared publicly in the core.',
          snippet: transitionsSetupSnippet,
          hint: 'Notice that the transition does not invent events. It always responds to actions that already exist in the catalog.',
        },
        {
          title: '2. requestSave prepares state before the effect',
          body: 'When requestSave arrives, the transition sets the state to saving, clears errors and records a flow message. This matters because the UI can react immediately without waiting for persistence to finish.',
          snippet: transitionsRequestSaveSnippet,
          hint: 'Loading state, error cleanup and visual context often start here.',
        },
        {
          title: '3. saveSucceeded writes the happy path',
          body: 'After the effect returns saveSucceeded, the transition appends the new task, clears the draft and updates the message to reflect success. The effect does not mutate state directly: the transition still owns store writes.',
          snippet: transitionsSuccessSnippet,
          hint: 'A good transition read always answers: what changes in the store when everything works?',
        },
        {
          title: '4. Not every transition needs to be complex',
          body: 'toggleTask shows a very common small branch: an action comes in, one field changes and the UI reacts. Even a small rule belongs here so the behavior stays centralized.',
          snippet: transitionsLocalSnippet,
          hint: 'If the action changes state, even a little, transitions.ts is still the natural home.',
        },
      ];
}

function buildEffectsCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que um effect faz',
          body: 'Effect observa actions e conversa com o mundo externo. Pode chamar API, aguardar resposta, ler um servico ou montar uma acao derivada para devolver a store.',
        },
        {
          title: 'O que ele nao deve fazer',
          body: 'O effect nao deve escrever estado direto. Ele descreve o trabalho externo e devolve outra action para que a transition escreva o resultado com clareza.',
        },
        {
          title: 'Como pensar o fluxo',
          body: 'Uma action entra, o effect observa, executa IO e devolve uma action de saida. Em geral voce deve conseguir narrar esse caminho em uma frase curta.',
        },
        {
          title: 'Quando criar um effect',
          body: 'Crie effect quando houver dependencia externa, espera assicrona, integracao com browser ou qualquer trabalho que nao seja so calcular proximo estado.',
        },
        {
          title: 'Boas praticas',
          body: 'Mantenha o handler pequeno, trate erro explicitamente e devolva actions com nomes claros como saveSucceeded ou saveFailed. O effect fica facil de testar quando ele parece um contrato simples de entrada e saida.',
        },
      ]
    : [
        {
          title: 'What an effect does',
          body: 'An effect observes actions and talks to the outside world. It may call an API, await a response, read a service or build a derived action to send back to the store.',
        },
        {
          title: 'What it should not do',
          body: 'An effect should not mutate state directly. It describes external work and returns another action so the transition can write the result clearly.',
        },
        {
          title: 'How to think about the flow',
          body: 'One action comes in, the effect observes it, performs IO and returns an output action. In general you should be able to narrate this path in one short sentence.',
        },
        {
          title: 'When to create an effect',
          body: 'Create an effect when there is an external dependency, async waiting, browser integration or any job that is not just computing the next state.',
        },
        {
          title: 'Best practices',
          body: 'Keep the handler small, handle errors explicitly and return clearly named actions such as saveSucceeded or saveFailed. The effect becomes easy to test when it looks like a simple input/output contract.',
        },
      ];
}

function buildEffectsWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O effect se registra dizendo o que observa',
          body: 'defineKernelEffects monta a lista de observadores da store. Aqui o ponto importante e que o effect nasce ligado a uma action concreta, em vez de ficar escutando tudo de maneira difusa.',
          snippet: effectsSetupSnippet,
          hint: 'O id do effect ajuda observabilidade e depuracao. Vale tratar esse nome como parte da documentacao do fluxo.',
        },
        {
          title: '2. Validacoes rapidas podem acontecer no handler',
          body: 'Antes de chamar o servico externo, o handler checa se o titulo esta vazio. Em vez de mutar estado aqui, ele devolve uma nova action de erro para a store reagir do jeito certo.',
          snippet: effectsValidationSnippet,
          hint: 'O effect pode validar entrada, mas o resultado da validacao continua voltando para a engine em forma de action.',
        },
        {
          title: '3. O sucesso volta como action',
          body: 'Quando persistTask resolve, o effect monta saveSucceeded com os dados necessarios para a transition escrever o novo estado. Isso mantem a divisao entre IO e escrita de estado muito visivel.',
          snippet: effectsSuccessSnippet,
          hint: 'Se a pergunta for "quem grava a nova tarefa na store?", a resposta continua sendo a transition, nunca o effect.',
        },
        {
          title: '4. O erro tambem entra no fluxo oficial',
          body: 'No catch, o effect nao engole o erro nem escreve mensagem direto. Ele traduz a falha em saveFailed, preservando o mesmo fluxo observavel da engine.',
          snippet: effectsErrorSnippet,
          hint: 'A regra pratica e simples: tudo que a UI precisa saber volta por uma action, inclusive erro.',
        },
      ]
    : [
        {
          title: '1. The effect registers what it observes',
          body: 'defineKernelEffects builds the list of store observers. The important point here is that the effect is explicitly tied to a concrete action instead of listening to everything in a fuzzy way.',
          snippet: effectsSetupSnippet,
          hint: 'The effect id helps observability and debugging. Treat that name as part of the flow documentation.',
        },
        {
          title: '2. Quick validation may happen in the handler',
          body: 'Before calling the external service, the handler checks whether the title is blank. Instead of mutating state here, it returns a new error action for the store to handle properly.',
          snippet: effectsValidationSnippet,
          hint: 'The effect may validate input, but the validation result still goes back into the engine as an action.',
        },
        {
          title: '3. Success comes back as an action',
          body: 'When persistTask resolves, the effect builds saveSucceeded with the data needed for the transition to write the new state. This keeps the split between IO and state writes very visible.',
          snippet: effectsSuccessSnippet,
          hint: 'If the question is "who writes the new task into the store?", the answer is still the transition, never the effect.',
        },
        {
          title: '4. Errors also re-enter the official flow',
          body: 'Inside catch, the effect does not swallow the error and it does not write the message directly. It translates the failure into saveFailed, preserving the same observable engine flow.',
          snippet: effectsErrorSnippet,
          hint: 'The practical rule is simple: everything the UI needs to know comes back as an action, including errors.',
        },
      ];
}

function buildSelectionsCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que uma selection entrega',
          body: 'Selection e leitura derivada. Ela pega a store bruta e devolve um valor pronto para a UI, evitando que o template saiba detalhes da estrutura interna do estado.',
        },
        {
          title: 'Kernel vs composed selections',
          body: 'Kernel selections leem o basico do proprio core. Composed selections combinam essas leituras com projection slice, composicao ou calculos mais ricos que pertencem ao artifact.',
        },
        {
          title: 'Por que isso ajuda a UI',
          body: 'Quando a tela consome currentStatus, visibleTasks ou taskSummary, ela nao precisa saber como esses valores foram montados. Isso deixa o template menor e muito mais legivel.',
        },
        {
          title: 'Quando criar uma selection nova',
          body: 'Crie uma nova selection quando a UI estiver repetindo calculo, lendo varios campos para montar uma decisao ou escondendo regra no template.',
        },
        {
          title: 'Erros comuns',
          body: 'Evite usar selection para escrever estado, chamar servico ou esconder logica grande demais. Se o calculo comecar a ficar opaco, talvez ele mereca ser quebrado ou renomeado.',
        },
      ]
    : [
        {
          title: 'What a selection returns',
          body: 'A selection is a derived read. It takes raw store state and returns a value ready for the UI, so the template does not need to know the internal structure of the state.',
        },
        {
          title: 'Kernel vs composed selections',
          body: 'Kernel selections read the basics from the core itself. Composed selections combine those reads with projection slices, composition or richer calculations that belong to the artifact.',
        },
        {
          title: 'Why this helps the UI',
          body: 'When the screen consumes currentStatus, visibleTasks or taskSummary, it does not need to know how those values were assembled. That makes the template smaller and easier to read.',
        },
        {
          title: 'When to create a new selection',
          body: 'Create a new selection when the UI starts repeating calculations, reading several fields to make one decision or hiding rules inside the template.',
        },
        {
          title: 'Common mistakes',
          body: 'Avoid using a selection to mutate state, call a service or hide calculations that became too opaque. If the logic grows hard to read, it may need to be split or renamed.',
        },
      ];
}

function buildKernelSelectionsWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. Kernel selections expoem leituras basicas',
          body: 'Essas selecoes devolvem campos ou leituras curtas que pertencem naturalmente ao proprio core. Elas funcionam como a primeira camada de leitura da store.',
          snippet: kernelSelectionsFocusSnippet,
          hint: 'Se a leitura existe mesmo sem composicao ou projection slice, ela provavelmente cabe no kernel.',
        },
        {
          title: '2. O valor da selection e nao o campo bruto',
          body: 'Mesmo quando a selection parece simples, ela cria um nome claro para a UI consumir. currentStatus e melhor para o template do que espalhar state().status em varios pontos.',
          snippet: kernelSelectionsFocusSnippet,
          hint: 'Selection tambem serve para nomear bem a leitura, nao apenas para fazer calculo complexo.',
        },
      ]
    : [
        {
          title: '1. Kernel selections expose basic reads',
          body: 'These selections return fields or short reads that naturally belong to the core itself. They act as the first reading layer of the store.',
          snippet: kernelSelectionsFocusSnippet,
          hint: 'If the read exists even without composition or a projection slice, it probably belongs in the kernel.',
        },
        {
          title: '2. The value is the selection, not the raw field',
          body: 'Even when a selection looks simple, it gives the UI a clear name to consume. currentStatus is better for the template than scattering state().status everywhere.',
          snippet: kernelSelectionsFocusSnippet,
          hint: 'A selection also exists to name reads well, not only to do complex calculations.',
        },
      ];
}

function buildComposedSelectionsWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. Composed selections sobem um nivel na leitura',
          body: 'Aqui a UI passa a receber respostas prontas, como visibleTasks e canSave. Isso evita que o template repita filtros, contagens ou condicionais espalhadas.',
          snippet: composedSelectionsFocusSnippet,
          hint: 'Se a tela esta fazendo "map, filter, count" demais, esse calculo provavelmente deveria virar selection.',
        },
        {
          title: '2. taskSummary transforma lista em informacao de tela',
          body: 'taskSummary e um bom exemplo de leitura derivada: a store guarda tarefas, mas a UI quer totais prontos por status. A selection faz essa traducao em um unico lugar.',
          snippet: selectionSummarySnippet,
          hint: 'Selections sao uma camada de linguagem entre a store e o template.',
        },
      ]
    : [
        {
          title: '1. Composed selections raise the level of the read',
          body: 'Here the UI starts receiving ready-made answers such as visibleTasks and canSave. This avoids repeating filters, counts or conditionals across the template.',
          snippet: composedSelectionsFocusSnippet,
          hint: 'If the screen is doing too much "map, filter, count", that calculation probably belongs in a selection.',
        },
        {
          title: '2. taskSummary translates a list into screen information',
          body: 'taskSummary is a good example of a derived read: the store keeps tasks, but the UI wants ready totals by status. The selection performs that translation in one place.',
          snippet: selectionSummarySnippet,
          hint: 'Selections are a language layer between the store and the template.',
        },
      ];
}

function buildFacadeCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que a facade faz',
          body: 'A facade monta o core, expoe bindings legiveis e oferece metodos curtos para a UI disparar intents. Ela e a borda entre Angular e engine.',
        },
        {
          title: 'O que deve ficar fora dela',
          body: 'Regra de negocio pesada, calculos de selections e escrita direta de estado nao devem morar aqui. Quando a facade cresce demais, normalmente o core foi mal dividido.',
        },
        {
          title: 'Como ler uma boa facade',
          body: 'Procure por tres blocos: criacao do core, leitura exposta para a UI e metodos de escrita que disparam actions. Se esses tres blocos estiverem claros, a facade esta saudavel.',
        },
        {
          title: 'Quando a facade pode ter logica',
          body: 'A facade pode ter logica de borda, como debounce, integracao com Devtools ou adaptacao de parametros da UI. O que ela nao deve fazer e virar um segundo lugar de regra de negocio.',
        },
      ]
    : [
        {
          title: 'What the facade does',
          body: 'The facade builds the core, exposes readable bindings and offers short methods for the UI to dispatch intents. It is the boundary between Angular and the engine.',
        },
        {
          title: 'What should stay out of it',
          body: 'Heavy business rules, selection calculations and direct state writes do not belong here. When the facade grows too much, the core is usually split poorly.',
        },
        {
          title: 'How to read a good facade',
          body: 'Look for three blocks: core creation, reads exposed to the UI and write methods that dispatch actions. If those three blocks are clear, the facade is healthy.',
        },
        {
          title: 'When the facade may contain logic',
          body: 'The facade may contain boundary logic such as debounce, Devtools integration or adapting UI parameters. What it should not do is become a second home for business rules.',
        },
      ];
}

function buildFacadeWalkthrough(lang: LiveDocsLang): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. A facade primeiro sobe o core e seus bindings',
          body: 'Esse bloco mostra o bootstrap da engine dentro do Angular. A partir daqui, state, actions e selections ficam disponiveis para a classe e para o template com nomes claros.',
          snippet: facadeBindingsSnippet,
          hint: 'A UI deveria conversar com esses bindings, nao com detalhes internos do core.',
        },
        {
          title: '2. Escrita sai da UI como action',
          body: 'updateDraftTitle e um bom exemplo de metodo de borda: ele adapta a digitacao da UI, espera um tempo curto e so depois dispara a action correta para a engine.',
          snippet: facadeDispatchFocusSnippet,
          hint: 'A facade pode coordenar experiencia de tela, desde que continue devolvendo a regra principal para o catalogo de actions.',
        },
        {
          title: '3. Ferramentas do runtime entram pela facade',
          body: 'A integracao com Devtools tambem mora aqui, porque ela faz parte da borda do componente. O core continua limpo e a tela ganha observabilidade real.',
          snippet: facadeDevtoolsSnippet,
          hint: 'Essa e a fronteira certa para integrar ferramentas sem poluir transitions ou effects.',
        },
      ]
    : [
        {
          title: '1. The facade first boots the core and its bindings',
          body: 'This block shows the engine bootstrap inside Angular. From here, state, actions and selections become available to the class and the template with clear names.',
          snippet: facadeBindingsSnippet,
          hint: 'The UI should talk to these bindings, not to internal core details.',
        },
        {
          title: '2. Writes leave the UI as actions',
          body: 'updateDraftTitle is a good boundary-method example: it adapts typing from the UI, waits briefly and only then dispatches the correct action into the engine.',
          snippet: facadeDispatchFocusSnippet,
          hint: 'The facade may coordinate screen experience as long as it still hands the main rule back to the action catalog.',
        },
        {
          title: '3. Runtime tools enter through the facade',
          body: 'Devtools integration also lives here because it belongs to the component boundary. The core stays clean and the screen gains real observability.',
          snippet: facadeDevtoolsSnippet,
          hint: 'This is the right boundary for integrating tools without polluting transitions or effects.',
        },
      ];
}

function buildPluggablesCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que um pluggable resolve',
          body: 'Pluggable resolve reutilizacao de UI sem colar regra de negocio dentro do componente visual. A mesma interface pode servir a mais de um core.',
        },
        {
          title: 'Onde fica a regra de negocio',
          body: 'A regra nao fica no pluggable. Ela fica no core que configura o slot e decide qual action deve ser despachada quando o usuario interage com aquela UI.',
        },
        {
          title: 'Como identificar um pluggable saudavel',
          body: 'Ele e pequeno, recebe configuracao clara e despacha um evento configurado. Se o pluggable sabe demais sobre dominio, ele parou de ser reutilizavel.',
        },
        {
          title: 'Vantagem real no exemplo',
          body: 'Task Board e Project Overview usam o mesmo botao, mas um abre modal e o outro navega. A UI continua igual; o comportamento muda no artifact de cada core.',
        },
      ]
    : [
        {
          title: 'What a pluggable solves',
          body: 'A pluggable solves UI reuse without gluing business rules inside the visual component. The same interface can serve more than one core.',
        },
        {
          title: 'Where business rules live',
          body: 'The rule does not live inside the pluggable. It lives in the core that configures the slot and decides which action should be dispatched when the user interacts with that UI.',
        },
        {
          title: 'How to spot a healthy pluggable',
          body: 'It is small, receives clear configuration and dispatches a configured event. If the pluggable knows too much about the domain, it stopped being reusable.',
        },
        {
          title: 'Real benefit in this example',
          body: 'Task Board and Project Overview use the same button, but one opens a modal and the other navigates. The UI stays the same; behavior changes in each core artifact.',
        },
      ];
}

function buildPluggableComponentWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O pluggable recebe configuracao, nao regra fixa',
          body: 'Esse componente sabe ler a configuracao mesclada e decidir se pode rodar. O comportamento concreto continua vindo de fora.',
          snippet: pluggableRunSnippet,
          hint: 'Um pluggable reutilizavel geralmente fala em createEvent, disabled e labels, nao em nomes de caso de negocio.',
        },
        {
          title: '2. O despacho continua alinhado com a engine',
          body: 'No fim, o pluggable chama dispatch(createEvent()). Isso garante que a interacao visual entre no mesmo fluxo de actions do restante da aplicacao.',
          snippet: pluggableRunSnippet,
          hint: 'A UI pode ser compartilhada porque o evento final continua sendo decidido pelo core.',
        },
      ]
    : [
        {
          title: '1. The pluggable receives configuration, not fixed rules',
          body: 'This component knows how to read merged config and decide whether it can run. The concrete behavior still comes from outside.',
          snippet: pluggableRunSnippet,
          hint: 'A reusable pluggable usually talks in createEvent, disabled and labels, not in domain-specific use-case names.',
        },
        {
          title: '2. Dispatch stays aligned with the engine',
          body: 'In the end, the pluggable calls dispatch(createEvent()). That guarantees the visual interaction enters the same action flow as the rest of the application.',
          snippet: pluggableRunSnippet,
          hint: 'The UI can be shared because the final event is still chosen by the core.',
        },
      ];
}

function buildTaskBoardWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O Task Board conecta o mesmo botao a outra intencao',
          body: 'Aqui o slot primaryAction continua recebendo o mesmo pluggable visual, mas createEvent devolve openCreateTaskModal. O dominio muda sem trocar a UI.',
          snippet: taskBoardConfigSnippet,
          hint: 'Esse e o ponto central da reutilizacao: a configuracao do core troca a action, nao o componente visual.',
        },
      ]
    : [
        {
          title: '1. Task Board wires the same button to a different intent',
          body: 'Here the primaryAction slot still receives the same visual pluggable, but createEvent returns openCreateTaskModal. The domain changes without replacing the UI.',
          snippet: taskBoardConfigSnippet,
          hint: 'This is the core idea of reuse: core configuration changes the action, not the visual component.',
        },
      ];
}

function buildProjectOverviewWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O Project Overview reaproveita a UI para navegar',
          body: 'No segundo core, o mesmo slot usa o mesmo botao, mas createEvent devolve goToTaskCreationPage. A acao final muda e a interface continua intacta.',
          snippet: projectOverviewConfigSnippet,
          hint: 'Quando a reutilizacao esta boa, o que muda e o contrato do core, nao o markup do pluggable.',
        },
      ]
    : [
        {
          title: '1. Project Overview reuses the UI to navigate',
          body: 'In the second core, the same slot uses the same button, but createEvent returns goToTaskCreationPage. The final action changes and the interface stays intact.',
          snippet: projectOverviewConfigSnippet,
          hint: 'When reuse is healthy, what changes is the core contract, not the pluggable markup.',
        },
      ];
}

function buildCompositionCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'Quando composicao vale a pena',
          body: 'Use composicao quando um pedaco do comportamento merecer autonomia propria, mas o pai nao precisar carregar o estado inteiro do filho.',
        },
        {
          title: 'O que a projection slice resolve',
          body: 'A projection slice traduz o estado do child para um resumo pequeno que o parent consegue consumir. Isso reduz acoplamento e evita vazamento de detalhes internos.',
        },
        {
          title: 'Como ler esse fluxo',
          body: 'Primeiro veja a action ligada de pai para filho. Depois veja a projection que volta para o pai. Com isso voce entende o contrato entre os dois cores sem precisar abrir toda a store filha.',
        },
        {
          title: 'Quando nao usar',
          body: 'Se o comportamento for simples demais, composicao pode ser complexidade extra. Nem todo subproblema merece um child core separado.',
        },
      ]
    : [
        {
          title: 'When composition is worth it',
          body: 'Use composition when one part of behavior deserves autonomy, but the parent does not need to carry the child full state.',
        },
        {
          title: 'What the projection slice solves',
          body: 'The projection slice translates child state into a small summary the parent can consume. This reduces coupling and avoids leaking internal details.',
        },
        {
          title: 'How to read this flow',
          body: 'First inspect the linked action from parent to child. Then inspect the projection that goes back to the parent. That lets you understand the contract between both cores without opening the full child store.',
        },
        {
          title: 'When not to use it',
          body: 'If the behavior is too simple, composition may be extra complexity. Not every subproblem deserves a separate child core.',
        },
      ];
}

function buildCompositionArtifactWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. connectChild declara o contrato entre pai e filho',
          body: 'Esse bloco mostra de forma explicita como o parent envia uma action ligada para o child. E uma integracao declarativa, nao uma chamada manual espalhada pelo codigo.',
          snippet: compositionConnectSnippet,
          hint: 'Se voce consegue apontar onde o pai fala com o filho em um unico bloco, a composicao esta legivel.',
        },
        {
          title: '2. Projection slice devolve apenas o resumo necessario',
          body: 'O pai nao recebe a store inteira do child. Em vez disso, recebe um resumo pequeno com status, contagem e ultimo evento. Isso deixa a leitura do parent muito mais limpa.',
          snippet: compositionProjectionSnippet,
          hint: 'Projection boa tem poucos campos e significado claro para a tela do pai.',
        },
      ]
    : [
        {
          title:
            '1. connectChild declares the contract between parent and child',
          body: 'This block shows explicitly how the parent sends a linked action into the child. It is a declarative integration, not a manual call scattered across the codebase.',
          snippet: compositionConnectSnippet,
          hint: 'If you can point to where parent talks to child in one clear block, the composition is readable.',
        },
        {
          title: '2. The projection slice returns only the needed summary',
          body: 'The parent does not receive the full child store. Instead it receives a compact summary with status, count and last event. That keeps the parent read much cleaner.',
          snippet: compositionProjectionSnippet,
          hint: 'A good projection has few fields and clear meaning for the parent screen.',
        },
      ];
}

function buildChildKernelWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O child core continua sendo um core normal',
          body: 'Mesmo pequeno, o child tem actions e transitions proprias. Aqui ele so registra o evento do pai e atualiza um historico curto, mantendo uma responsabilidade bem focada.',
          snippet: childKernelFocusSnippet,
          hint: 'Composicao nao cria uma excecao na engine. O child continua obedecendo as mesmas regras de action + transition.',
        },
      ]
    : [
        {
          title: '1. The child core is still a normal core',
          body: 'Even when small, the child has its own actions and transitions. Here it only records the parent event and updates a short history, keeping a very focused responsibility.',
          snippet: childKernelFocusSnippet,
          hint: 'Composition does not create an engine exception. The child still follows the same action + transition rules.',
        },
      ];
}

function buildTestingCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'Como pensar testes nesta engine',
          body: 'A separacao por arquivos permite testar cada camada pelo contrato certo: transition escreve estado, effect fala com servico, facade dispara actions e pluggable despacha evento configurado.',
        },
        {
          title: 'Por que isso melhora manutencao',
          body: 'Quando um teste falha, a equipe sabe em qual camada procurar. Isso reduz depuracao cega e evita aqueles testes gigantes que tentam cobrir tudo de uma vez.',
        },
        {
          title: 'O que um bom teste de transition faz',
          body: 'Entrega um estado inicial simples, dispara uma action e verifica o novo estado. Sem mock de HTTP, sem timer e sem dependencia externa.',
        },
        {
          title: 'O que um bom teste de effect faz',
          body: 'Entrega uma action de entrada, simula o servico externo e valida quais actions sairam. O centro do teste e o contrato de IO, nao a UI.',
        },
      ]
    : [
        {
          title: 'How to think about tests in this engine',
          body: 'The file split lets you test each layer by the right contract: a transition writes state, an effect talks to a service, a facade dispatches actions and a pluggable dispatches a configured event.',
        },
        {
          title: 'Why this improves maintenance',
          body: 'When a test fails, the team knows which layer to inspect. This reduces blind debugging and avoids giant tests trying to cover everything at once.',
        },
        {
          title: 'What a good transition test does',
          body: 'It supplies a simple initial state, dispatches one action and verifies the new state. No HTTP mock, no timer and no external dependency.',
        },
        {
          title: 'What a good effect test does',
          body: 'It supplies an input action, simulates the external service and validates which actions came out. The center of the test is the IO contract, not the UI.',
        },
      ];
}

function buildTransitionsTestWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O teste de transition valida escrita de estado',
          body: 'Nesse teste, a facade de teste despacha actions reais e observa a store. O foco nao e o HTML, e sim se a transicao colocou status em saving e depois anexou a tarefa corretamente.',
          snippet: transitionsTestFocusSnippet,
          hint: 'Se o teste consegue narrar um unico ramo, ele tende a ficar curto e muito mais util.',
        },
      ]
    : [
        {
          title: '1. A transition test validates state writes',
          body: 'In this test, the test facade dispatches real actions and observes the store. The focus is not HTML, but whether the transition set status to saving and then appended the task correctly.',
          snippet: transitionsTestFocusSnippet,
          hint: 'If the test can narrate one branch clearly, it tends to stay short and far more useful.',
        },
      ];
}

function buildEffectsTestWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O teste de effect valida contrato de entrada e saida',
          body: 'Aqui o handler recebe estado, action, dispatch e servicos falsos. O teste comprova que, diante de um servico resolvendo com sucesso, a action devolvida e saveSucceeded.',
          snippet: effectsTestFocusSnippet,
          hint: 'Quanto mais explicito estiver o fake do servico, mais facil fica entender o contrato que o effect precisa cumprir.',
        },
      ]
    : [
        {
          title: '1. An effect test validates the input/output contract',
          body: 'Here the handler receives state, action, dispatch and fake services. The test proves that when the service resolves successfully, the returned action is saveSucceeded.',
          snippet: effectsTestFocusSnippet,
          hint: 'The more explicit the fake service is, the easier it becomes to understand the contract the effect must satisfy.',
        },
      ];
}

function buildDevtoolsCards(lang: LiveDocsLang): LiveDocsQuestionCard[] {
  return lang === 'pt-br'
    ? [
        {
          title: 'O que o Devtools mostra',
          body: 'O overlay mostra historico de actions, transitions, effects, snapshots e selections reais da engine. Ele nao tenta adivinhar o fluxo: ele observa o fluxo verdadeiro.',
        },
        {
          title: 'Por que nao duplicar isso na pagina',
          body: 'A pagina didatica resume o fluxo para ensinar. O Devtools existe para inspecionar o runtime completo. Misturar as duas coisas no mesmo widget deixaria a documentacao mais confusa.',
        },
        {
          title: 'Quando abrir o overlay',
          body: 'Abra quando a timeline curta da pagina nao for suficiente, quando houver duvida sobre ordem de chamadas ou quando voce quiser conferir snapshots completos da store.',
        },
        {
          title: 'Como isso ajuda manutencao',
          body: 'O Devtools reduz achismo. Em vez de tentar imaginar qual action disparou qual effect, voce consegue inspecionar a cadeia real e confirmar o comportamento observado.',
        },
      ]
    : [
        {
          title: 'What Devtools shows',
          body: 'The overlay shows real engine actions, transitions, effects, snapshots and selections history. It does not guess the flow: it observes the true flow.',
        },
        {
          title: 'Why not duplicate it inside the page',
          body: 'The teaching page summarizes the flow for learning. Devtools exists to inspect the full runtime. Mixing both concerns into the same widget would make the documentation noisier.',
        },
        {
          title: 'When to open the overlay',
          body: 'Open it when the short page timeline is not enough, when there is doubt about call order or when you want to inspect complete store snapshots.',
        },
        {
          title: 'How this helps maintenance',
          body: 'Devtools reduces guesswork. Instead of imagining which action triggered which effect, you can inspect the real chain and confirm the observed behavior.',
        },
      ];
}

function buildDevtoolsWalkthrough(
  lang: LiveDocsLang,
): LiveDocsCodeWalkthrough[] {
  return lang === 'pt-br'
    ? [
        {
          title: '1. O overlay se conecta ao facade real da engine',
          body: 'Esse bind registra o facade no manager global de Devtools. Por isso o overlay mostra o comportamento real do core, e nao uma copia simplificada da pagina de docs.',
          snippet: devtoolsBindingSnippet,
          hint: 'A documentacao ensina, mas a fonte de verdade do runtime continua sendo o overlay real.',
        },
        {
          title: '2. O snapshot de selections e enviado sob demanda',
          body: 'getSelectionsSnapshot oferece uma fotografia legivel das selections atuais. Isso ajuda a comparar o que a UI ve com o que o Devtools consegue inspecionar.',
          snippet: devtoolsSnapshotSnippet,
          hint: 'Snapshot bom e pequeno, legivel e centrado nas leituras que importam para a tela.',
        },
        {
          title: '3. Abrir o Devtools continua sendo uma acao de borda',
          body: 'A facade expoe um metodo curto para alternar o overlay. Isso deixa a integracao facil para o componente Angular sem espalhar detalhes do manager pelo template.',
          snippet: devtoolsOpenSnippet,
          hint: 'Ferramentas de runtime entram pela facade porque ela ja e a borda oficial do componente.',
        },
      ]
    : [
        {
          title: '1. The overlay connects to the real engine facade',
          body: 'This bind registers the facade in the global Devtools manager. That is why the overlay shows real core behavior instead of a simplified copy of the docs page.',
          snippet: devtoolsBindingSnippet,
          hint: 'Documentation teaches, but the real runtime source of truth remains the actual overlay.',
        },
        {
          title: '2. The selections snapshot is provided on demand',
          body: 'getSelectionsSnapshot offers a readable picture of the current selections. This helps compare what the UI sees with what Devtools can inspect.',
          snippet: devtoolsSnapshotSnippet,
          hint: 'A good snapshot is small, readable and centered on the reads that matter to the screen.',
        },
        {
          title: '3. Opening Devtools remains a boundary action',
          body: 'The facade exposes a short method to toggle the overlay. That keeps integration easy for the Angular component without scattering manager details across the template.',
          snippet: devtoolsOpenSnippet,
          hint: 'Runtime tools enter through the facade because it is already the official boundary of the component.',
        },
      ];
}

export function createLiveDocsHeaderCopy(lang: LiveDocsLang) {
  return {
    eyebrow:
      lang === 'pt-br' ? 'Machine State Live Docs' : 'Machine State Live Docs',
    title:
      lang === 'pt-br'
        ? 'Documentacao viva para entender a engine por partes'
        : 'Live documentation to understand the engine in parts',
    subtitle:
      lang === 'pt-br'
        ? 'Leia cada arquivo no contexto de um exemplo real. O texto explica o papel de cada camada e a aba de codigo mostra trechos curados da implementacao.'
        : 'Read each file inside a real example. The text explains the role of each layer and the source tab shows curated implementation snippets.',
    language: lang === 'pt-br' ? 'Switch to EN' : 'Voltar para PT-BR',
    devtools: lang === 'pt-br' ? 'Abrir Devtools' : 'Open Devtools',
    reset: lang === 'pt-br' ? 'Resetar exemplo' : 'Reset example',
    example: 'Example',
    source: 'View Source',
    menu: lang === 'pt-br' ? 'Partes da engine' : 'Engine parts',
  };
}

export function createLiveDocsSections(
  lang: LiveDocsLang,
): LiveDocsSectionContent[] {
  const isPtBr = lang === 'pt-br';

  return [
    {
      id: 'overview',
      label: 'Overview',
      title: isPtBr ? 'Visao geral do fluxo' : 'Flow overview',
      lede: isPtBr
        ? 'Aqui o foco e enxergar o ciclo completo sem mergulhar em todos os detalhes ao mesmo tempo.'
        : 'The goal here is to see the complete cycle before diving into each file.',
      exampleNote: isPtBr
        ? 'Use o exemplo abaixo para disparar actions reais, salvar tarefas, alterar status, excluir itens, abrir o Devtools e observar o fluxo Action -> Transition -> Effect -> State -> Selection. No diagrama, clique nos blocos para abrir a explicacao de cada camada.'
        : 'Use the example below to dispatch real actions, save tasks, change status, delete items, open Devtools and inspect the Action -> Transition -> Effect -> State -> Selection flow. In the diagram, click each block to open the explanation for that layer.',
      cards: buildOverviewCards(lang),
      sourceTabs: [
        {
          id: 'actions',
          label: 'actions.ts',
          fileName: 'live-docs.actions.ts',
          note: isPtBr
            ? 'O catalogo de intents globais do componente.'
            : 'The global intent catalog of the component.',
          code: actionsSnippet,
          walkthrough: buildActionsCatalogWalkthrough(lang),
        },
        {
          id: 'transitions',
          label: 'transitions.ts',
          fileName: 'live-docs.transitions.ts',
          note: isPtBr
            ? 'Transitions puras escrevendo o estado.'
            : 'Pure transitions writing the state.',
          code: transitionsSnippet,
          walkthrough: buildTransitionsWalkthrough(lang),
        },
        {
          id: 'effects',
          label: 'effects.ts',
          fileName: 'live-docs.effects.ts',
          note: isPtBr
            ? 'Onde a engine observa uma action e executa o trabalho assincrono.'
            : 'Where the engine observes an action and runs async work.',
          code: effectsSnippet,
          walkthrough: buildEffectsWalkthrough(lang),
        },
        {
          id: 'selections',
          label: 'selections.ts',
          fileName: 'live-docs.selections.ts',
          note: isPtBr
            ? 'Kernel selections enxutas e legiveis.'
            : 'Lean and readable kernel selections.',
          code: kernelSelectionsSnippet,
          walkthrough: buildKernelSelectionsWalkthrough(lang),
        },
        {
          id: 'facade',
          label: 'facade.ts',
          fileName: 'live-docs-facade.service.ts',
          note: isPtBr
            ? 'A fronteira curta entre Angular e engine.'
            : 'The short boundary between Angular and the engine.',
          code: facadeSnippet,
          walkthrough: buildFacadeWalkthrough(lang),
        },
      ],
      diagram: flowDiagram,
      diagramNodeLinks: {
        facade: 'facade',
        action: 'actions',
        transition: 'transitions',
        state: 'transitions',
        effect: 'effects',
        selection: 'selections',
        ui: 'overview',
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      title: isPtBr ? 'Actions' : 'Actions',
      lede: isPtBr
        ? 'Actions sao a porta de entrada do comportamento do componente. Elas definem um catalogo publico de intencoes e criam um contrato claro entre UI, facade, transitions, effects e Devtools.'
        : 'Actions are the entry point of component behavior. They define a public intent catalog and create a clear contract between UI, facade, transitions, effects and Devtools.',
      exampleNote: isPtBr
        ? 'Nesta tela a timeline do runtime mostra somente actions. Use o input, altere o filtro e salve tarefas para observar como cada intencao entra primeiro pelo catalogo publico antes de qualquer transition ou effect reagir.'
        : 'On this screen, the runtime timeline shows only actions. Use the input, change the filter and save tasks to observe how each intent enters through the public catalog before any transition or effect reacts.',
      cards: buildActionsCards(lang),
      sourceTabs: [
        {
          id: 'actions',
          label: 'actions.ts',
          fileName: 'live-docs.actions.ts',
          note: isPtBr
            ? 'Este arquivo descreve a API comportamental do core. Leia como se fosse a lista oficial do que o componente aceita fazer.'
            : 'This file describes the behavioral API of the core. Read it as the official list of what the component accepts as intent.',
          code: actionsSnippet,
          walkthrough: buildActionsCatalogWalkthrough(lang),
        },
        {
          id: 'facade',
          label: 'facade.ts',
          fileName: 'live-docs-facade.service.ts',
          note: isPtBr
            ? 'Aqui voce acompanha a action saindo da UI e entrando na engine sem a facade escrever estado diretamente.'
            : 'Here you can follow the action leaving the UI and entering the engine without the facade writing state directly.',
          code: facadeSnippet,
          walkthrough: buildActionsFacadeWalkthrough(lang),
        },
      ],
      diagram: flowDiagram,
      diagramNodeLinks: {
        facade: 'facade',
        action: 'actions',
        transition: 'transitions',
        state: 'transitions',
        effect: 'effects',
        selection: 'selections',
        ui: 'overview',
      },
    },
    {
      id: 'transitions',
      label: 'Transitions',
      title: isPtBr ? 'Transitions' : 'Transitions',
      lede: isPtBr
        ? 'Transitions sao o lugar onde a action vira estado novo. Elas deixam explicito quais campos mudam, em que momento mudam e qual ramo do fluxo esta sendo executado.'
        : 'Transitions are where an action becomes new state. They make explicit which fields change, when they change and which branch of the flow is executing.',
      exampleNote: isPtBr
        ? 'Nesta tela a timeline do runtime mostra somente transitions. Altere filtro, conclua tarefas e salve novos itens para enxergar como cada action escreve um ramo diferente da store.'
        : 'On this screen, the runtime timeline shows only transitions. Change the filter, complete tasks and save new items to inspect how each action writes a different store branch.',
      cards: buildTransitionsCards(lang),
      sourceTabs: [
        {
          id: 'transitions',
          label: 'transitions.ts',
          fileName: 'live-docs.transitions.ts',
          note: isPtBr
            ? 'Aqui ficam os ramos puros de sucesso, erro e alteracoes locais.'
            : 'This is where pure success, error and local branches live.',
          code: transitionsSnippet,
          walkthrough: buildTransitionsWalkthrough(lang),
        },
      ],
    },
    {
      id: 'effects',
      label: 'Effects',
      title: isPtBr ? 'Effects' : 'Effects',
      lede: isPtBr
        ? 'Effects observam actions e fazem o trabalho que nao pertence a uma transicao pura: conversar com servicos, esperar resposta e devolver novas actions para o fluxo continuar.'
        : 'Effects observe actions and do the work that does not belong in a pure transition: talk to services, wait for responses and return new actions so the flow can continue.',
      exampleNote: isPtBr
        ? 'Nesta tela a timeline do runtime mostra somente effects. Salve uma tarefa e compare o momento em que requestSave entra com o momento em que saveSucceeded ou saveFailed voltam para a store.'
        : 'On this screen, the runtime timeline shows only effects. Save a task and compare the moment requestSave enters with the moment saveSucceeded or saveFailed returns to the store.',
      cards: buildEffectsCards(lang),
      sourceTabs: [
        {
          id: 'effects',
          label: 'effects.ts',
          fileName: 'live-docs.effects.ts',
          note: isPtBr
            ? 'Um effect pequeno ja mostra o ganho de separar IO e escrita de estado.'
            : 'A single small effect already shows the value of separating IO from state writes.',
          code: effectsSnippet,
          walkthrough: buildEffectsWalkthrough(lang),
        },
      ],
    },
    {
      id: 'selections',
      label: 'Selections',
      title: isPtBr ? 'Selections' : 'Selections',
      lede: isPtBr
        ? 'Selections traduzem a store em leituras prontas para a UI. Elas reduzem acoplamento, escondem calculos repetitivos e deixam o template muito mais simples de ler.'
        : 'Selections translate the store into reads that are ready for the UI. They reduce coupling, hide repetitive calculations and make the template much easier to read.',
      exampleNote: isPtBr
        ? 'Nesta tela a timeline do runtime mostra somente selections. Mexa no filtro, conclua tarefas e observe como as leituras derivadas mudam sem a UI precisar recalcular nada por conta propria.'
        : 'On this screen, the runtime timeline shows only selections. Change the filter, complete tasks and watch derived reads change without the UI recalculating anything on its own.',
      cards: buildSelectionsCards(lang),
      sourceTabs: [
        {
          id: 'kernel',
          label: 'Kernel selections',
          fileName: 'live-docs.selections.ts',
          note: isPtBr
            ? 'Selecoes basicas que vivem no kernel.'
            : 'Basic selections that live in the kernel.',
          code: kernelSelectionsSnippet,
          walkthrough: buildKernelSelectionsWalkthrough(lang),
        },
        {
          id: 'composed',
          label: 'Composed selections',
          fileName: 'live-docs.artifact.ts',
          note: isPtBr
            ? 'Selecoes que juntam store local com projection slice do child.'
            : 'Selections that combine local store data with the child projection slice.',
          code: composedSelectionsSnippet,
          walkthrough: buildComposedSelectionsWalkthrough(lang),
        },
      ],
    },
    {
      id: 'facade',
      label: 'Facade',
      title: 'Facade',
      lede: isPtBr
        ? 'A facade e a borda que traduz interacoes do Angular para a engine e expoe leituras prontas para o componente. Ela ajuda a manter o template simples e o core bem isolado.'
        : 'The facade is the boundary that translates Angular interactions into the engine and exposes reads that are ready for the component. It keeps the template simple and the core well isolated.',
      exampleNote: isPtBr
        ? 'Aqui o exemplo mostra como a facade sobe o core, expoe bindings e adiciona logica de borda, como debounce e Devtools, sem roubar responsabilidades de transitions ou effects.'
        : 'Here the example shows how the facade boots the core, exposes bindings and adds boundary logic such as debounce and Devtools without stealing responsibilities from transitions or effects.',
      cards: buildFacadeCards(lang),
      sourceTabs: [
        {
          id: 'facade',
          label: 'facade.ts',
          fileName: 'live-docs-facade.service.ts',
          note: isPtBr
            ? 'A facade e curta porque a maior parte do trabalho ja foi bem separada antes.'
            : 'The facade stays short because most responsibilities were already separated before it.',
          code: facadeSnippet,
          walkthrough: buildFacadeWalkthrough(lang),
        },
      ],
    },
    {
      id: 'pluggables',
      label: 'Pluggables',
      title: 'Pluggables',
      lede: isPtBr
        ? 'Pluggables sao uma forma de reutilizar UI sem acoplar regra de negocio ao componente visual. O core continua decidindo a intent, e o pluggable continua fino.'
        : 'Pluggables are a way to reuse UI without coupling business rules to the visual component. The core still decides the intent, and the pluggable stays thin.',
      exampleNote: isPtBr
        ? 'Nesta aba voce compara o mesmo botao conectado a dois cores diferentes. O markup e o mesmo; o que muda e a action configurada em cada artifact.'
        : 'In this section you compare the same button connected to two different cores. The markup stays the same; what changes is the action configured in each artifact.',
      cards: buildPluggablesCards(lang),
      sourceTabs: [
        {
          id: 'pluggable',
          label: 'PrimaryActionButton',
          fileName: 'primary-action-button.pluggable.ts',
          note: isPtBr
            ? 'A mesma UI para dois cores diferentes.'
            : 'The same UI reused by two different cores.',
          code: pluggableSnippet,
          walkthrough: buildPluggableComponentWalkthrough(lang),
        },
        {
          id: 'task-board',
          label: 'Task Board',
          fileName: 'task-board.artifact.ts',
          note: isPtBr
            ? 'Aqui o pluggable abre uma modal local.'
            : 'Here the pluggable opens a local modal.',
          code: taskBoardArtifactSnippet,
          walkthrough: buildTaskBoardWalkthrough(lang),
        },
        {
          id: 'project-overview',
          label: 'Project Overview',
          fileName: 'project-overview.artifact.ts',
          note: isPtBr
            ? 'Aqui o mesmo pluggable dispara uma navegacao.'
            : 'Here the same pluggable triggers navigation.',
          code: projectOverviewArtifactSnippet,
          walkthrough: buildProjectOverviewWalkthrough(lang),
        },
      ],
      links: [
        {
          label: 'Task Board',
          to: '/task-board',
          hint: isPtBr
            ? 'O botao compartilhado abre uma modal local.'
            : 'The shared button opens a local modal.',
        },
        {
          label: 'Project Overview',
          to: '/project-overview',
          hint: isPtBr
            ? 'O mesmo botao vira uma action de navegacao.'
            : 'The same button becomes a navigation action.',
        },
      ],
    },
    {
      id: 'composition',
      label: 'Composition',
      title: isPtBr
        ? 'Child core + projection slice'
        : 'Child core + projection slice',
      lede: isPtBr
        ? 'Composicao e util quando o pai precisa conversar com um child core sem virar dependente da store inteira dele. O contrato fica menor e o fluxo continua observavel.'
        : 'Composition is useful when the parent needs to talk to a child core without becoming dependent on its full store. The contract stays smaller and the flow remains observable.',
      exampleNote: isPtBr
        ? 'Nesta aba o child core fica visivel. Salve uma tarefa e observe como o pai envia uma action ligada, enquanto recebe de volta apenas um resumo pequeno da projection slice.'
        : 'In this section the child core becomes visible. Save a task and watch the parent send a linked action while receiving back only a compact projection slice summary.',
      cards: buildCompositionCards(lang),
      sourceTabs: [
        {
          id: 'artifact',
          label: 'artifact.ts',
          fileName: 'live-docs.artifact.ts',
          note: isPtBr
            ? 'O artifact liga slot, child core e projection slice.'
            : 'The artifact wires the slot, child core and projection slice.',
          code: artifactSnippet,
          walkthrough: buildCompositionArtifactWalkthrough(lang),
        },
        {
          id: 'child-kernel',
          label: 'child-demo.kernel.ts',
          fileName: 'live-docs-child-demo.kernel.ts',
          note: isPtBr
            ? 'O child core fica pequeno e especializado.'
            : 'The child core stays small and specialized.',
          code: childKernelSnippet,
          walkthrough: buildChildKernelWalkthrough(lang),
        },
      ],
      diagram: compositionDiagram,
      diagramNodeLinks: {
        parent: 'composition',
        link: 'composition',
        child: 'composition',
        projection: 'composition',
        ui: 'overview',
      },
    },
    {
      id: 'testing',
      label: 'Testing',
      title: 'Testing',
      lede: isPtBr
        ? 'Testing fica mais simples quando cada camada tem uma responsabilidade clara. Em vez de um teste gigante tentando provar tudo, voce testa contratos menores e mais confiaveis.'
        : 'Testing becomes simpler when each layer has a clear responsibility. Instead of one giant test trying to prove everything, you test smaller and more reliable contracts.',
      exampleNote: isPtBr
        ? 'Nesta aba o foco e mostrar que transition e effect pedem testes diferentes. Um valida escrita de estado; o outro valida integracao com servico e action de retorno.'
        : 'This section focuses on showing that transitions and effects need different tests. One validates state writes; the other validates service integration and returned actions.',
      cards: buildTestingCards(lang),
      sourceTabs: [
        {
          id: 'transition-spec',
          label: 'transitions.spec.ts',
          fileName: 'live-docs.transitions.spec.ts',
          note: isPtBr
            ? 'Valida o ramo puro de escrita de estado.'
            : 'Validates the pure state-writing branch.',
          code: transitionsTestSnippet,
          walkthrough: buildTransitionsTestWalkthrough(lang),
        },
        {
          id: 'effect-spec',
          label: 'effects.spec.ts',
          fileName: 'live-docs.effects.spec.ts',
          note: isPtBr
            ? 'Valida entrada, chamada de servico e action de saida.'
            : 'Validates input, service call and dispatched output action.',
          code: effectsTestSnippet,
          walkthrough: buildEffectsTestWalkthrough(lang),
        },
      ],
      diagram: flowDiagram,
      diagramNodeLinks: {
        facade: 'facade',
        action: 'actions',
        transition: 'transitions',
        state: 'transitions',
        effect: 'effects',
        selection: 'selections',
        ui: 'testing',
      },
    },
    {
      id: 'devtools',
      label: 'Devtools',
      title: 'Devtools',
      lede: isPtBr
        ? 'O Devtools e a ferramenta de observabilidade real da engine. Ele mostra o que realmente aconteceu no runtime e complementa a pagina didatica com historico completo e snapshots.'
        : 'Devtools is the real observability tool of the engine. It shows what actually happened in runtime and complements the teaching page with full history and snapshots.',
      exampleNote: isPtBr
        ? 'Abra o overlay e compare o historico completo dele com a timeline curta da pagina. A documentacao resume; o Devtools prova o comportamento real.'
        : 'Open the overlay and compare its complete history with the short page timeline. Documentation summarizes; Devtools proves the real behavior.',
      cards: buildDevtoolsCards(lang),
      sourceTabs: [
        {
          id: 'devtools',
          label: 'facade.ts',
          fileName: 'live-docs-facade.service.ts',
          note: isPtBr
            ? 'O Devtools entra como ferramenta real da engine, nao como widget didatico paralelo.'
            : 'Devtools is integrated as a real engine tool, not as a parallel teaching widget.',
          code: facadeSnippet,
          walkthrough: buildDevtoolsWalkthrough(lang),
        },
      ],
      diagram: devtoolsDiagram,
      diagramNodeLinks: {
        ui: 'overview',
        facade: 'facade',
        transition: 'transitions',
        effects: 'effects',
        selections: 'selections',
        overlay: 'devtools',
      },
    },
  ];
}
