import { describe, expect, it } from 'vitest';
import { EngineEvent, EngineState } from '../store/engine.types';
import { EngineDevToolsState } from './devtools.state';

type Status = 'idle' | 'ready' | 'error';
type Event = EngineEvent;

interface State extends EngineState<Status> {
  value: number;
}

describe('EngineDevToolsState', () => {
  it('mantém histórico por instância com truncamento e métricas', () => {
    const devtools = new EngineDevToolsState<State, Status, Event>({
      enable: true,
      maxHistory: 2,
      instanceName: 'test-engine',
    });

    devtools.logTransition(
      { type: 'start' },
      { status: 'idle', value: 0 },
      { status: 'ready', value: 1 },
    );
    devtools.logTransition(
      { type: 'update' },
      { status: 'ready', value: 1 },
      { status: 'ready', value: 2 },
    );
    devtools.logTransition(
      { type: 'fail' },
      { status: 'ready', value: 2 },
      { status: 'error', value: 2 },
    );

    expect(devtools.history().length).toBe(2);
    expect(devtools.history()[0].event.type).toBe('update');
    expect(devtools.history()[1].event.type).toBe('fail');

    const metrics = devtools.metrics();
    expect(metrics.totalTransitions).toBe(2);
    expect(metrics.transitionsByType['update']).toBe(1);
    expect(metrics.transitionsByType['fail']).toBe(1);
    expect(metrics.errorCount).toBe(1);
  });

  it('expõe API pública para exportar e limpar histórico', () => {
    const devtools = new EngineDevToolsState<State, Status, Event>({
      enable: true,
      instanceName: 'api-engine',
    });

    devtools.logTransition(
      { type: 'event' },
      { status: 'idle', value: 0 },
      { status: 'ready', value: 1 },
    );

    const api = devtools.createPublicApi();
    const exported = JSON.parse(api.exportHistory()) as Array<unknown>;
    expect(exported.length).toBe(1);

    api.clearHistory();
    expect(devtools.history().length).toBe(0);
  });

  it('não acumula histórico quando enable=false', () => {
    const devtools = new EngineDevToolsState<State, Status, Event>({
      enable: false,
      instanceName: 'disabled-engine',
    });

    devtools.logTransition(
      { type: 'ignored' },
      { status: 'idle', value: 0 },
      { status: 'ready', value: 1 },
    );

    expect(devtools.history()).toEqual([]);
    expect(devtools.metrics().totalTransitions).toBe(0);
  });
});
