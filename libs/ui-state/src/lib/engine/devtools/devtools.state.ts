import { computed, signal } from '@angular/core';
import { EngineEvent, EngineState } from '../store/engine.types';
import {
  DEFAULT_ENGINE_DEVTOOLS_CONFIG,
  EngineDevToolsAPI,
  EngineDevToolsConfig,
  EngineDevToolsLogEntry,
} from './devtools.types';
import {
  calculateEngineMetrics,
  createEngineLogEntry,
  generateEngineInstanceId,
  generateEngineInstanceName,
  truncateEngineHistory,
} from './devtools.utils';
import { logEngineTransition } from './devtools.logger';

export class EngineDevToolsState<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
> {
  readonly instanceId = generateEngineInstanceId();
  readonly instanceName: string;
  readonly config: Required<EngineDevToolsConfig>;

  readonly #entries = signal<EngineDevToolsLogEntry<TState, TStatus, TEvent>[]>(
    [],
  );

  readonly history = computed(() => this.#entries());
  readonly metrics = computed(() => calculateEngineMetrics(this.#entries()));

  constructor(config?: EngineDevToolsConfig) {
    this.config = {
      ...DEFAULT_ENGINE_DEVTOOLS_CONFIG,
      ...(config ?? {}),
    };
    this.instanceName =
      this.config.instanceName === DEFAULT_ENGINE_DEVTOOLS_CONFIG.instanceName
        ? generateEngineInstanceName('engine')
        : this.config.instanceName;
  }

  logTransition(event: TEvent, prevState: TState, nextState: TState): void {
    if (!this.config.enable) {
      return;
    }

    const entry = createEngineLogEntry(event, prevState, nextState);
    this.#entries.update((entries) =>
      truncateEngineHistory([...entries, entry], this.config.maxHistory),
    );
    logEngineTransition(entry, this.config, this.instanceName);
  }

  clearHistory(): void {
    this.#entries.set([]);
  }

  exportHistory(): string {
    return JSON.stringify(this.#entries(), null, 2);
  }

  createPublicApi(): EngineDevToolsAPI {
    return {
      instanceId: this.instanceId,
      instanceName: this.instanceName,
      clearHistory: () => this.clearHistory(),
      exportHistory: () => this.exportHistory(),
    };
  }
}
