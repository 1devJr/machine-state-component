import { computed, Injectable, inject, OnDestroy, signal } from '@angular/core';
import {
  createComposedEngine,
  createFacadeBindings,
  EngineDevtoolsManagerService,
} from '@machine-state-component/ui-state';
import { createMyCoreChildDemo } from '../child-demo/my-core-child-demo.artifact';
import {
  createMyCoreArtifact,
  MyCoreRuntimeInspector,
} from '../store/my-core.artifact';
import { myCoreActionTypes } from '../store/my-core.actions';
import {
  MyCoreFlowSummary,
  MyCoreRuntimeBridge,
  MyCoreTimelineEntry,
} from '../store/my-core.types';
import { MyCoreMockService } from '../services/my-core.mock.service';

@Injectable()
export class MyCoreFacadeService implements OnDestroy {
  readonly #demoApi = inject(MyCoreMockService);
  readonly #devtoolsManager = inject(EngineDevtoolsManagerService);
  readonly #maxTimelineEntries = 6;
  readonly #scratchSliceKey = 'scratchpad';

  readonly eventTimeline = signal<MyCoreTimelineEntry[]>([]);
  readonly childDemoCore = createMyCoreChildDemo();

  readonly #runtimeBridge: MyCoreRuntimeBridge & {
    clearScratchSlice: () => void;
  } = {
    toggleScratchSlice: () => undefined,
    clearScratchSlice: () => undefined,
  };

  readonly core = createComposedEngine(
    createMyCoreArtifact(
      this.#demoApi,
      this.#runtimeBridge,
      this.childDemoCore,
      this.#buildRuntimeInspector(),
    ),
  );

  readonly bindings = createFacadeBindings(this.core);
  readonly state = this.bindings.state;
  readonly status = this.bindings.selections.status;
  readonly actions = this.bindings.actions;
  readonly selections = this.bindings.selections;
  readonly composition = this.bindings.composition;
  readonly engineFacade = this.bindings.engineFacade;

  readonly liveEffects = computed(() =>
    this.engineFacade.listEffects().map((effect) => ({
      id: effect.id,
      event: effect.event,
      priority: effect.priority ?? 0,
    })),
  );

  readonly liveSliceKeys = computed(() =>
    [
      'controls',
      'diagnostics',
      'docs',
      'childDemoProjection',
      this.#scratchSliceKey,
    ].filter((key) => this.#stateRecord()[key] !== undefined),
  );

  readonly liveSelectionSnapshot = computed(() => ({
    currentStatus: this.selections.currentStatus(),
    lastActionType: this.selections.lastActionType(),
    actionCountEntries: this.selections.actionCountEntries(),
    learningMode: this.selections.learningMode(),
    showRawRuntimeData: this.selections.showRawRuntimeData(),
    diagnosticMessage: this.selections.diagnosticMessage(),
    registeredSliceKeys: this.selections.registeredSliceKeys(),
    hasChildProjection: this.selections.hasChildProjection(),
    childProjectionSummary: this.selections.childProjectionSummary(),
  }));

  readonly flowSummary = computed<MyCoreFlowSummary>(() => {
    const lastUserAction = this.state().lastUserActionType;

    return {
      action: lastUserAction ?? (this.isPtBr() ? 'nenhuma' : 'none'),
      transition: this.state().lastTransitionLabel,
      effect: this.#effectLabel(lastUserAction),
      changedFields: this.state().lastChangedFields,
      message: this.state().diagnosticMessage,
    };
  });

  readonly #devtools = this.#devtoolsManager.bind(this.engineFacade, {
    title: 'Engine Devtools',
    subtitle: 'Observabilidade real da store, actions, transitions e effects.',
    getSelectionsSnapshot: () => this.liveSelectionSnapshot(),
  });

  readonly #eventSubscription = this.engineFacade.subscribeEvents((event) => {
    this.eventTimeline.update((entries) => {
      const nextEntry = {
        id: entries.length ? entries[0].id + 1 : 1,
        type: event.type,
        summary: this.#summarizeEvent(event),
      };

      return [nextEntry, ...entries].slice(0, this.#maxTimelineEntries);
    });

    if (event.type === myCoreActionTypes.reset) {
      this.#runtimeBridge.clearScratchSlice();
    }
  });

  constructor() {
    this.#runtimeBridge.toggleScratchSlice = () => {
      const nextToggleCount =
        (
          this.#stateRecord()[this.#scratchSliceKey] as
            | { toggles?: number }
            | undefined
        )?.toggles ?? 0;

      if (this.#stateRecord()[this.#scratchSliceKey] !== undefined) {
        this.engineFacade.unregisterSlice(this.#scratchSliceKey);
        return;
      }

      this.engineFacade.registerSlice(this.#scratchSliceKey, {
        mountedAt: 'runtime bridge',
        toggles: nextToggleCount + 1,
      });
    };

    this.#runtimeBridge.clearScratchSlice = () => {
      this.engineFacade.unregisterSlice(this.#scratchSliceKey);
    };
  }

  readonly isPtBr = computed(() => this.state().lang === 'pt-br');

  setLearningMode(mode: 'flow' | 'files' | 'advanced'): void {
    this.actions.setLearningMode(mode);
  }

  toggleLang(): void {
    this.actions.toggleLang();
  }

  reset(): void {
    this.actions.reset();
  }

  toggleScratchSlice(): void {
    this.actions.toggleScratchSlice();
  }

  toggleChildDemo(): void {
    this.actions.toggleChildDemo();
  }

  toggleDevtools(): void {
    this.#devtools.toggle();
  }

  ngOnDestroy(): void {
    this.#eventSubscription();
    this.#devtools.destroy();
    this.bindings.destroy();
    this.childDemoCore.destroy();
  }

  #buildRuntimeInspector(): MyCoreRuntimeInspector {
    return {
      getEventTimeline: () => this.eventTimeline(),
      getStateSnapshot: () => this.#snapshotRecord(),
      getSelectionSnapshot: () => this.liveSelectionSnapshot(),
      getSliceKeys: () => this.liveSliceKeys(),
      getEffects: () => this.liveEffects(),
      getFlowSummary: () => this.flowSummary(),
    };
  }

  #summarizeEvent(event: { type: string } & Record<string, unknown>): string {
    const isPtBr = this.isPtBr();

    if (event.type === myCoreActionTypes.runDemoAction) {
      return isPtBr
        ? `A UI disparou "${String(event['label'])}".`
        : `The UI dispatched "${String(event['label'])}".`;
    }

    if (event.type === myCoreActionTypes.demoCompleted) {
      return isPtBr
        ? 'O effect assincrono concluiu o fluxo e gerou uma action derivada.'
        : 'The async effect completed the flow and dispatched a follow-up action.';
    }

    if (event.type === myCoreActionTypes.simulateError) {
      return isPtBr
        ? `A UI disparou o erro ${String(event['severity'])}.`
        : `The UI triggered the ${String(event['severity'])} error.`;
    }

    if (event.type === myCoreActionTypes.toggleScratchSlice) {
      return isPtBr
        ? 'O runtime alternou um scratch slice.'
        : 'The runtime toggled a scratch slice.';
    }

    if (event.type === myCoreActionTypes.setLearningMode) {
      return isPtBr
        ? `Mudou o modo para ${String(event['mode'])}.`
        : `Switched mode to ${String(event['mode'])}.`;
    }

    return isPtBr
      ? 'O runtime observou um novo evento.'
      : 'The runtime observed a new event.';
  }

  #effectLabel(actionType: string | null): string {
    const isPtBr = this.isPtBr();

    if (!actionType) {
      return isPtBr ? 'nenhum' : 'none';
    }

    if (actionType === myCoreActionTypes.runDemoAction) {
      return 'my-core-run-demo-effect';
    }

    if (actionType === myCoreActionTypes.simulateError) {
      return 'my-core-simulate-error-effect';
    }

    if (actionType === myCoreActionTypes.toggleScratchSlice) {
      return 'my-core-scratch-slice-effect';
    }

    return isPtBr ? 'sem effect dedicado' : 'no dedicated effect';
  }

  #stateRecord(): Record<string, unknown> {
    return this.state() as unknown as Record<string, unknown>;
  }

  #snapshotRecord(): Record<string, unknown> {
    return this.engineFacade.commands.getStateSnapshot() as unknown as Record<
      string,
      unknown
    >;
  }
}
