import { EngineEvent, EngineState } from '../store/engine.types';
import {
  EngineDevToolsLogEntry,
  EngineDevToolsMetrics,
} from './devtools.types';

export function generateEngineInstanceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function generateEngineInstanceName(prefix = 'engine'): string {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}

export function createEngineLogEntry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
>(
  event: TEvent,
  prevState: TState,
  nextState: TState,
): EngineDevToolsLogEntry<TState, TStatus, TEvent> {
  return {
    id: generateEngineInstanceId(),
    timestamp: Date.now(),
    event,
    prevState,
    nextState,
  };
}

export function truncateEngineHistory<T>(entries: T[], max: number): T[] {
  if (entries.length <= max) {
    return entries;
  }
  return entries.slice(entries.length - max);
}

export function calculateEngineMetrics<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
>(
  entries: EngineDevToolsLogEntry<TState, TStatus, TEvent>[],
): EngineDevToolsMetrics {
  const transitionsByType: Record<string, number> = {};
  let errorCount = 0;

  for (const entry of entries) {
    transitionsByType[entry.event.type] =
      (transitionsByType[entry.event.type] ?? 0) + 1;
    if (entry.nextState.status === 'error') {
      errorCount += 1;
    }
  }

  return {
    totalTransitions: entries.length,
    transitionsByType,
    errorCount,
  };
}
