import { Injectable, inject } from '@angular/core';
import { EngineEvent, EngineState } from '../store/engine.types';
import {
  EngineDevtoolsInspectableFacade,
  EngineDevtoolsInspector,
  EngineDevtoolsInspectorConfig,
} from './devtools-inspector';
import { EngineDevtoolsOverlayService } from './devtools-overlay.service';

export type EngineDevtoolsBindConfig<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> = Omit<
  EngineDevtoolsInspectorConfig<TState, TStatus, TEvent, TServices>,
  'overlay' | 'facade'
>;

@Injectable({
  providedIn: 'root',
})
export class EngineDevtoolsManagerService {
  readonly #overlay = inject(EngineDevtoolsOverlayService);

  bind<
    TState extends EngineState<TStatus>,
    TStatus extends string,
    TEvent extends EngineEvent,
    TServices extends Record<string, unknown> = Record<string, unknown>,
  >(
    facade: EngineDevtoolsInspectableFacade<TState, TStatus, TEvent, TServices>,
    config?: EngineDevtoolsBindConfig<TState, TStatus, TEvent, TServices>,
  ): EngineDevtoolsInspector<TState, TStatus, TEvent, TServices> {
    const getSelectionsSnapshot =
      config?.getSelectionsSnapshot ??
      this.#createSelectionsSnapshotReader(
        facade as { selections?: Record<string, unknown> },
      );

    return new EngineDevtoolsInspector<TState, TStatus, TEvent, TServices>({
      overlay: this.#overlay,
      facade,
      getSelectionsSnapshot,
      ...(config ?? {}),
    });
  }

  #createSelectionsSnapshotReader(source: {
    selections?: Record<string, unknown>;
  }): ((state: unknown) => unknown) | undefined {
    const selections = source.selections;
    if (!selections) {
      return undefined;
    }

    return () => {
      const snapshot: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(selections)) {
        if (typeof value !== 'function') {
          continue;
        }

        try {
          snapshot[key] = (value as () => unknown)();
        } catch {
          // Ignore selections that are not zero-arg signals/computeds.
        }
      }

      return snapshot;
    };
  }
}
