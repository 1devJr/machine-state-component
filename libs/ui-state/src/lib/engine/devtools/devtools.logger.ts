import { EngineEvent, EngineState } from '../store/engine.types';
import { EngineDevToolsConfig, EngineDevToolsLogEntry } from './devtools.types';

export function logEngineTransition<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
>(
  entry: EngineDevToolsLogEntry<TState, TStatus, TEvent>,
  config: Required<EngineDevToolsConfig>,
  instanceName: string,
): void {
  if (config.display !== 'console' && config.display !== 'both') {
    return;
  }

  console.groupCollapsed(
    `[Engine:${instanceName}] ${entry.event.type} ${entry.prevState.status} -> ${entry.nextState.status}`,
  );
  console.log('event', entry.event);
  console.log('prevState', entry.prevState);
  console.log('nextState', entry.nextState);
  console.groupEnd();
}
