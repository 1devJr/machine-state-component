import {
  computed,
  effect,
  Injectable,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  createComposedEngine,
  createFacadeBindings,
  EngineDevtoolsManagerService,
} from '@machine-state-component/ui-state';
import {
  createLiveDocsChildDemo,
  LiveDocsChildDemo,
} from '../child-demo/live-docs-child-demo.artifact';
import { createLiveDocsArtifact } from '../store/live-docs.artifact';
import { liveDocsActionTypes } from '../store/live-docs.actions';
import { LiveDocsLang } from '../store/live-docs.types';
import { LiveDocsMockService } from '../services/live-docs.mock.service';

type LiveDocsTimelineKind = 'action' | 'transition' | 'effect' | 'selection';
const LIVE_DOCS_DRAFT_DEBOUNCE_MS = 400;

interface LiveDocsTimelineEntry {
  id: string;
  kind: LiveDocsTimelineKind;
  title: string;
  summary: string;
  count: number;
}

@Injectable()
export class LiveDocsFacadeService implements OnDestroy {
  readonly #demoApi = inject(LiveDocsMockService);
  readonly #devtoolsManager = inject(EngineDevtoolsManagerService);

  readonly childDemoCore: LiveDocsChildDemo = createLiveDocsChildDemo();
  readonly eventTimeline = signal<LiveDocsTimelineEntry[]>([]);
  readonly #previousVisibleTasksKey = signal<string | null>(null);
  readonly #previousTaskSummaryKey = signal<string | null>(null);
  readonly #previousCanSave = signal<boolean | null>(null);
  readonly #previousCurrentStatus = signal<string | null>(null);
  readonly #previousCurrentFilter = signal<string | null>(null);
  readonly #previousFeedbackMessage = signal<string | null>(null);
  readonly #previousChildProjection = signal<string | null>(null);
  #timelineEntrySequence = 0;
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

  readonly runtimeSummary = computed(() => ({
    status: this.selections.currentStatus(),
    filter: this.selections.currentFilter(),
    lastAction: this.selections.lastActionType(),
    lastTransition: this.state().lastTransitionLabel,
    feedback: this.selections.feedbackMessage(),
    canSave: this.selections.canSave(),
    childProjection: this.selections.childProjectionSummary(),
    taskSummary: this.selections.taskSummary(),
  }));

  readonly liveSelectionSnapshot = computed(() => ({
    currentStatus: this.selections.currentStatus(),
    currentFilter: this.selections.currentFilter(),
    selectedSaveMode: this.selections.selectedSaveMode(),
    lastActionType: this.selections.lastActionType(),
    feedbackMessage: this.selections.feedbackMessage(),
    canSave: this.selections.canSave(),
    taskSummary: this.selections.taskSummary(),
    childProjectionSummary: this.selections.childProjectionSummary(),
  }));

  readonly liveEffects = computed(() =>
    this.engineFacade.listEffects().map((effect) => ({
      id: effect.id,
      event: effect.event,
      priority: effect.priority ?? 0,
    })),
  );

  readonly #devtools = this.#devtoolsManager.bind(this.engineFacade, {
    title: 'Live Docs Devtools',
    subtitle:
      'Observabilidade real da store, das transitions, dos effects e das selections.',
    getSelectionsSnapshot: () => this.liveSelectionSnapshot(),
  });

  readonly #eventSubscription = this.engineFacade.subscribeEvents((event) => {
    this.#recordTimeline(
      'action',
      event.type,
      this.#summarizeAction(event.type, this.state().lang),
    );

    for (const runtimeEffect of this.engineFacade.listEffectsForEvent(
      event.type,
    )) {
      this.#recordTimeline(
        'effect',
        runtimeEffect.id,
        this.#summarizeEffect(runtimeEffect.id, event.type, this.state().lang),
      );
    }
  });

  readonly #transitionHookCleanup = this.engineFacade.registerHook({
    onAfterTransition: (_state, event) => {
      this.#recordTimeline(
        'transition',
        event.type,
        this.state().lastTransitionLabel,
      );
    },
  });

  constructor() {
    effect(() => {
      const tasks = this.selections.visibleTasks();
      const nextKey = tasks
        .map((task) => `${task.id}:${task.status}`)
        .join('|');

      if (
        this.#previousVisibleTasksKey() !== null &&
        nextKey !== this.#previousVisibleTasksKey()
      ) {
        this.#recordTimeline(
          'selection',
          'live-docs/listTasks',
          this.state().lang === 'pt-br'
            ? `A selection recalculou a lista visivel. O filtro atual mostra ${tasks.length} tarefa(s).`
            : `The selection recalculated the visible list. The current filter shows ${tasks.length} task(s).`,
        );
      }

      this.#previousVisibleTasksKey.set(nextKey);
    });

    effect(() => {
      const summary = this.selections.taskSummary();
      const nextKey = JSON.stringify(summary);

      if (
        this.#previousTaskSummaryKey() !== null &&
        nextKey !== this.#previousTaskSummaryKey()
      ) {
        this.#recordTimeline(
          'selection',
          'live-docs/taskSummary',
          this.state().lang === 'pt-br'
            ? `A selection recalculou os contadores: total ${summary.total}, abertas ${summary.open}, concluidas ${summary.done}, excluidas ${summary.deleted}.`
            : `The selection recalculated the counters: total ${summary.total}, open ${summary.open}, done ${summary.done}, deleted ${summary.deleted}.`,
        );
      }

      this.#previousTaskSummaryKey.set(nextKey);
    });

    effect(() => {
      const canSave = this.selections.canSave();

      if (
        this.#previousCanSave() !== null &&
        canSave !== this.#previousCanSave()
      ) {
        this.#recordTimeline(
          'selection',
          'live-docs/canSave',
          this.state().lang === 'pt-br'
            ? canSave
              ? 'A selection liberou o botao principal para salvar a tarefa.'
              : 'A selection bloqueou o botao principal porque o rascunho nao pode ser salvo agora.'
            : canSave
              ? 'The selection enabled the primary save button.'
              : 'The selection disabled the primary save button because the draft cannot be saved right now.',
        );
      }

      this.#previousCanSave.set(canSave);
    });

    effect(() => {
      const currentStatus = this.selections.currentStatus();

      if (
        this.#previousCurrentStatus() !== null &&
        currentStatus !== this.#previousCurrentStatus()
      ) {
        this.#recordTimeline(
          'selection',
          'live-docs/currentStatus',
          this.state().lang === 'pt-br'
            ? `A selection publicou o novo status do runtime: ${currentStatus}.`
            : `The selection published the new runtime status: ${currentStatus}.`,
        );
      }

      this.#previousCurrentStatus.set(currentStatus);
    });

    effect(() => {
      const currentFilter = this.selections.currentFilter();

      if (
        this.#previousCurrentFilter() !== null &&
        currentFilter !== this.#previousCurrentFilter()
      ) {
        this.#recordTimeline(
          'selection',
          'live-docs/currentFilter',
          this.state().lang === 'pt-br'
            ? `A selection publicou o filtro atual: ${currentFilter}.`
            : `The selection published the current filter: ${currentFilter}.`,
        );
      }

      this.#previousCurrentFilter.set(currentFilter);
    });

    effect(() => {
      const feedbackMessage = this.selections.feedbackMessage();

      if (
        this.#previousFeedbackMessage() !== null &&
        feedbackMessage !== this.#previousFeedbackMessage()
      ) {
        this.#recordTimeline(
          'selection',
          'live-docs/feedbackMessage',
          this.state().lang === 'pt-br'
            ? 'A selection atualizou a mensagem que explica o fluxo na UI.'
            : 'The selection updated the message that explains the flow in the UI.',
        );
      }

      this.#previousFeedbackMessage.set(feedbackMessage);
    });

    effect(() => {
      const childProjection = this.selections.childProjectionSummary();

      if (
        this.#previousChildProjection() !== null &&
        childProjection !== this.#previousChildProjection()
      ) {
        this.#recordTimeline(
          'selection',
          'live-docs/childProjectionSummary',
          this.state().lang === 'pt-br'
            ? 'A selection recalculou o resumo vindo da projection slice do child core.'
            : 'The selection recalculated the summary that comes from the child core projection slice.',
        );
      }

      this.#previousChildProjection.set(childProjection);
    });
  }

  updateDraftTitle(title: string): void {
    this.#pendingDraftTitle = title;
    this.#scheduleDraftCommit();
  }

  setFilter(filter: 'all' | 'open' | 'done'): void {
    this.#flushPendingDraftTitle();

    if (filter === this.state().filter) {
      return;
    }

    this.actions.setFilter(filter);
  }

  setNextSaveMode(mode: 'success' | 'error'): void {
    if (mode === this.state().nextSaveMode) {
      return;
    }

    this.actions.setNextSaveMode(mode);
  }

  saveTask(title = this.state().draftTitle): void {
    this.#commitDraftTitle(title);
    this.actions.requestSave();
  }

  toggleTask(id: string): void {
    this.actions.toggleTask(id);
  }

  deleteTask(id: string): void {
    const task = this.state().tasks.find((item) => item.id === id);

    if (!task || task.status === 'deleted') {
      return;
    }

    this.actions.deleteTask(id);
  }

  setLang(lang: LiveDocsLang): void {
    this.#flushPendingDraftTitle();

    if (lang === this.state().lang) {
      return;
    }

    this.actions.setLang(lang);
  }

  reset(): void {
    this.#clearDraftDebounceTimer();
    this.#pendingDraftTitle = null;
    this.actions.reset();
  }

  toggleDevtools(): void {
    this.#flushPendingDraftTitle();
    this.#devtools.toggle();
  }

  ngOnDestroy(): void {
    this.#clearDraftDebounceTimer();
    this.#eventSubscription();
    this.#transitionHookCleanup();
    this.#devtools.destroy();
    this.bindings.destroy();
    this.childDemoCore.destroy();
  }

  #recordTimeline(
    kind: LiveDocsTimelineKind,
    title: string,
    summary: string,
  ): void {
    this.eventTimeline.update((entries) => {
      const latestEntry = entries[0];

      if (
        latestEntry &&
        latestEntry.kind === kind &&
        latestEntry.title === title &&
        latestEntry.summary === summary
      ) {
        return [
          {
            ...latestEntry,
            count: latestEntry.count + 1,
          },
          ...entries.slice(1),
        ];
      }

      return [
        {
          id: this.#nextTimelineEntryId(),
          kind,
          title,
          summary,
          count: 1,
        },
        ...entries,
      ];
    });
  }

  #summarizeAction(type: string, lang: LiveDocsLang): string {
    switch (type) {
      case liveDocsActionTypes.changeDraftTitle:
        return lang === 'pt-br'
          ? 'A facade descreveu a intencao de editar o rascunho.'
          : 'The facade described the intent to edit the draft.';
      case liveDocsActionTypes.requestSave:
        return lang === 'pt-br'
          ? 'A action principal iniciou o ciclo Action -> Transition -> Effect.'
          : 'The primary action started the Action -> Transition -> Effect cycle.';
      case liveDocsActionTypes.saveSucceeded:
        return lang === 'pt-br'
          ? 'O effect terminou e despachou a action de sucesso.'
          : 'The effect finished and dispatched the success action.';
      case liveDocsActionTypes.saveFailed:
        return lang === 'pt-br'
          ? 'O effect terminou no ramo de erro e despachou a falha.'
          : 'The effect ended in the error branch and dispatched the failure.';
      case liveDocsActionTypes.setFilter:
        return lang === 'pt-br'
          ? 'A transicao trocou o filtro sem precisar de effect.'
          : 'The transition changed the filter without needing an effect.';
      case liveDocsActionTypes.toggleTask:
        return lang === 'pt-br'
          ? 'A transicao local alterou apenas a tarefa escolhida.'
          : 'A local transition updated only the selected task.';
      case liveDocsActionTypes.deleteTask:
        return lang === 'pt-br'
          ? 'A UI pediu para excluir uma tarefa da lista.'
          : 'The UI asked to delete one task from the list.';
      default:
        return lang === 'pt-br'
          ? 'O runtime registrou um novo evento.'
          : 'The runtime registered a new event.';
    }
  }

  #summarizeEffect(
    effectId: string,
    actionType: string,
    lang: LiveDocsLang,
  ): string {
    if (effectId === 'live-docs-request-save-effect') {
      return lang === 'pt-br'
        ? `O effect observou ${actionType} e executou a persistencia assincrona antes de devolver uma nova action.`
        : `The effect observed ${actionType} and executed the async persistence step before returning a new action.`;
    }

    return lang === 'pt-br'
      ? `O effect ${effectId} observou ${actionType}.`
      : `The effect ${effectId} observed ${actionType}.`;
  }

  #nextTimelineEntryId(): string {
    this.#timelineEntrySequence += 1;
    return `timeline-entry-${this.#timelineEntrySequence}`;
  }

  #scheduleDraftCommit(): void {
    this.#clearDraftDebounceTimer();
    this.#draftDebounceTimer = globalThis.setTimeout(() => {
      this.#flushPendingDraftTitle();
    }, LIVE_DOCS_DRAFT_DEBOUNCE_MS);
  }

  #commitDraftTitle(title: string): void {
    this.#pendingDraftTitle = title;
    this.#flushPendingDraftTitle();
  }

  #flushPendingDraftTitle(): void {
    if (this.#pendingDraftTitle === null) {
      return;
    }

    const nextTitle = this.#pendingDraftTitle;
    this.#pendingDraftTitle = null;
    this.#clearDraftDebounceTimer();

    if (nextTitle === this.state().draftTitle) {
      return;
    }

    this.actions.changeDraftTitle(nextTitle);
  }

  #clearDraftDebounceTimer(): void {
    if (this.#draftDebounceTimer === null) {
      return;
    }

    globalThis.clearTimeout(this.#draftDebounceTimer);
    this.#draftDebounceTimer = null;
  }
}
