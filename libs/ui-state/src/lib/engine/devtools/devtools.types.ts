import { EngineEvent, EngineState } from '../store/engine.types';

export interface EngineDevToolsConfig {
  enable?: boolean;
  display?: 'console' | 'panel' | 'both';
  maxHistory?: number;
  instanceName?: string;
  autoRegisterGlobal?: boolean;
}

export interface EngineDevToolsLogEntry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
> {
  id: string;
  timestamp: number;
  event: TEvent;
  prevState: TState;
  nextState: TState;
}

export interface EngineDevToolsMetrics {
  totalTransitions: number;
  transitionsByType: Record<string, number>;
  errorCount: number;
}

export interface EngineDevToolsAPI {
  instanceId: string;
  instanceName: string;
  clearHistory: () => void;
  exportHistory: () => string;
}

export interface EngineDevToolsGlobal {
  list: () => string[];
  get: (id: string) => EngineDevToolsAPI | undefined;
}

export const DEFAULT_ENGINE_DEVTOOLS_CONFIG: Required<EngineDevToolsConfig> = {
  enable: false,
  display: 'console',
  maxHistory: 50,
  instanceName: 'engine-instance',
  autoRegisterGlobal: true,
};
