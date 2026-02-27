import { Signal, signal } from '@angular/core';
import {
  EffectConfig,
  EngineEvent,
  EngineState,
  ReducerHook,
} from '../store/engine.types';
import { EngineDevtoolsOverlayService } from './devtools-overlay.service';
import { EngineDevtoolsOverlayPayload } from './devtools-overlay.types';

interface EngineActionLogEntry<TEvent extends EngineEvent> {
  at: string;
  type: TEvent['type'];
  payload: Record<string, unknown>;
}

interface EngineTransitionLogEntry<TEvent extends EngineEvent> {
  at: string;
  actionType: TEvent['type'];
  fromStatus: string;
  toStatus: string;
}

export interface EngineDevtoolsInspectableFacade<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> {
  state: Signal<TState>;
  listEffects(): ReadonlyArray<
    EffectConfig<TState, TStatus, TEvent, TServices>
  >;
  registerHook(hook: ReducerHook<TState, TStatus, TEvent>): () => void;
}

export interface EngineDevtoolsInspectorConfig<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> {
  overlay: EngineDevtoolsOverlayService;
  facade: EngineDevtoolsInspectableFacade<TState, TStatus, TEvent, TServices>;
  title?: string;
  subtitle?: string;
  maxEntries?: number;
  getSelectionsSnapshot?: (state: TState) => unknown;
}

const DEFAULT_MAX_ENTRIES = 80;

export class EngineDevtoolsInspector<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly enabled = signal(false);

  readonly #overlay: EngineDevtoolsOverlayService;
  readonly #facade: EngineDevtoolsInspectableFacade<
    TState,
    TStatus,
    TEvent,
    TServices
  >;
  readonly #title: string;
  readonly #subtitle: string;
  readonly #maxEntries: number;
  readonly #getSelectionsSnapshot?: (state: TState) => unknown;

  #actionLog: EngineActionLogEntry<TEvent>[] = [];
  #transitionLog: EngineTransitionLogEntry<TEvent>[] = [];
  #hookCleanup: (() => void) | null = null;

  constructor(
    config: EngineDevtoolsInspectorConfig<TState, TStatus, TEvent, TServices>,
  ) {
    this.#overlay = config.overlay;
    this.#facade = config.facade;
    this.#title = config.title ?? 'Engine Devtools';
    this.#subtitle =
      config.subtitle ?? 'Observabilidade da store e runtime da engine.';
    this.#maxEntries = config.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.#getSelectionsSnapshot = config.getSelectionsSnapshot;
  }

  toggle(): void {
    this.setEnabled(!this.enabled());
  }

  setEnabled(next: boolean): void {
    if (this.enabled() === next) {
      return;
    }

    this.enabled.set(next);
    this.#overlay.setEnabled(next);

    if (!next) {
      this.#reset();
      return;
    }

    this.#attachHook();
    this.#renderPayload();
  }

  disable(): void {
    this.setEnabled(false);
  }

  destroy(): void {
    this.disable();
  }

  #attachHook(): void {
    if (this.#hookCleanup) {
      return;
    }

    let previousState = this.#facade.state();

    this.#hookCleanup = this.#facade.registerHook({
      onBeforeTransition: (state, event) => {
        previousState = state;
        this.#actionLog = this.#pushWithLimit(
          this.#actionLog,
          this.#toActionLogEntry(event),
        );
      },
      onAfterTransition: (state, event) => {
        this.#transitionLog = this.#pushWithLimit(
          this.#transitionLog,
          this.#toTransitionLogEntry(event, previousState, state),
        );
        this.#renderPayload();
      },
    });
  }

  #reset(): void {
    this.#hookCleanup?.();
    this.#hookCleanup = null;
    this.#actionLog = [];
    this.#transitionLog = [];
    this.#overlay.setPayload(null);
  }

  #renderPayload(): void {
    if (!this.enabled()) {
      return;
    }

    const currentState = this.#facade.state();
    const effects = this.#facade
      .listEffects()
      .map((effect) => ({
        id: effect.id,
        event: String(effect.event),
        priority: effect.priority ?? 50,
      }))
      .sort(
        (left, right) =>
          left.priority - right.priority || left.id.localeCompare(right.id),
      );

    const selections = this.#getSelectionsSnapshot
      ? this.#getSelectionsSnapshot(currentState)
      : { status: currentState.status };

    const payload: EngineDevtoolsOverlayPayload = {
      title: this.#title,
      subtitle: this.#subtitle,
      sections: [
        {
          id: 'effects',
          title: 'Effects',
          kind: 'list',
          items: effects.map((effect) => ({
            title: effect.id,
            subtitle: effect.event,
            meta: `prioridade ${effect.priority}`,
          })),
        },
        {
          id: 'actions',
          title: 'Actions',
          kind: 'list',
          items: this.#actionLog.map((entry) => ({
            title: entry.type,
            meta: entry.at,
            details: Object.keys(entry.payload).length
              ? entry.payload
              : undefined,
          })),
        },
        {
          id: 'transitions',
          title: 'Transitions',
          kind: 'list',
          items: this.#transitionLog.map((transition) => ({
            title: transition.actionType,
            subtitle: `status: ${transition.fromStatus} -> ${transition.toStatus}`,
            meta: transition.at,
          })),
        },
        {
          id: 'selections',
          title: 'Selections',
          kind: 'json',
          value: selections,
        },
        {
          id: 'store',
          title: 'Store Snapshot',
          kind: 'json',
          value: currentState,
        },
      ],
    };

    this.#overlay.setPayload(payload);
  }

  #toActionLogEntry(event: TEvent): EngineActionLogEntry<TEvent> {
    const payloadEntries = Object.entries(event).filter(
      ([key]) => key !== 'type',
    );
    const payload = Object.fromEntries(payloadEntries) as Record<
      string,
      unknown
    >;

    return {
      at: new Date().toISOString(),
      type: event.type,
      payload,
    };
  }

  #toTransitionLogEntry(
    event: TEvent,
    fromState: TState,
    toState: TState,
  ): EngineTransitionLogEntry<TEvent> {
    return {
      at: new Date().toISOString(),
      actionType: event.type,
      fromStatus: fromState.status,
      toStatus: toState.status,
    };
  }

  #pushWithLimit<T>(items: readonly T[], next: T): T[] {
    const merged = [...items, next];
    if (merged.length <= this.#maxEntries) {
      return merged;
    }
    return merged.slice(merged.length - this.#maxEntries);
  }
}
