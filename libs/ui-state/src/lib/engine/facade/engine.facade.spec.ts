import { describe, expect, it, vi } from 'vitest';
import { EngineFacade } from './engine.facade';
import { EngineState } from '../store/engine.types';

type Status = 'idle' | 'ready' | 'error';

type TestEvent =
  | { type: 'inc'; amount: number }
  | { type: 'left/inc' }
  | { type: 'right/inc' }
  | { type: 'run' }
  | { type: 'fail' }
  | { type: 'noop' };

interface TestState extends EngineState<Status> {
  count: number;
  left?: { value: number };
  right?: { value: number };
}

describe('EngineFacade', () => {
  it('aplica transitions apenas via dispatch e mantém snapshot imutável', () => {
    const facade = new EngineFacade<TestState, Status, TestEvent>({
      initialState: {
        status: 'idle',
        count: 0,
      },
      transitions: {
        idle: {
          inc: (state, event) => ({
            ...state,
            status: 'ready',
            count:
              state.count +
              (event as Extract<TestEvent, { type: 'inc' }>).amount,
          }),
        },
        ready: {
          inc: (state, event) => ({
            ...state,
            count:
              state.count +
              (event as Extract<TestEvent, { type: 'inc' }>).amount,
          }),
        },
      },
      globalTransitions: {
        fail: (state) => ({ ...state, status: 'error' }),
      },
    });

    const initial = facade.state();
    facade.commands.dispatch({ type: 'noop' });
    expect(facade.state()).toEqual(initial);

    facade.commands.dispatch({ type: 'inc', amount: 2 });
    expect(facade.state().status).toBe('ready');
    expect(facade.state().count).toBe(2);

    facade.commands.dispatchMany([
      { type: 'inc', amount: 3 },
      { type: 'inc', amount: 5 },
    ]);
    expect(facade.state().count).toBe(10);

    const snapshot = facade.commands.getStateSnapshot();
    snapshot.count = 999;
    expect(facade.state().count).toBe(10);

    facade.commands.dispatch({ type: 'fail' });
    expect(facade.state().status).toBe('error');
  });

  it('isola slices e limpa transitions/effects dinâmicos', () => {
    const calls: string[] = [];

    const facade = new EngineFacade<TestState, Status, TestEvent>({
      initialState: {
        status: 'idle',
        count: 0,
      },
    });

    facade.registerSlice('left', { value: 0 });
    facade.registerSlice('right', { value: 0 });

    const cleanupTransitions = facade.registerTransitions({
      id: 'child-transitions',
      globalTransitions: {
        'left/inc': (state) => ({
          ...state,
          left: {
            value: (state.left?.value ?? 0) + 1,
          },
        }),
        'right/inc': (state) => ({
          ...state,
          right: {
            value: (state.right?.value ?? 0) + 1,
          },
        }),
      },
    });

    const cleanupEffects = facade.registerEffects([
      {
        id: 'run-20',
        event: 'run',
        priority: 20,
        handler: () => calls.push('20'),
      },
      {
        id: 'run-10',
        event: 'run',
        priority: 10,
        handler: () => calls.push('10'),
      },
      {
        id: 'run-skip',
        event: 'run',
        priority: 15,
        when: () => false,
        handler: () => calls.push('skip'),
      },
      {
        id: 'left-effect',
        event: 'left/inc',
        handler: () => calls.push('left'),
      },
    ]);

    facade.commands.dispatch({ type: 'left/inc' });
    facade.commands.dispatch({ type: 'right/inc' });
    expect(facade.state().left?.value).toBe(1);
    expect(facade.state().right?.value).toBe(1);
    expect(calls).toContain('left');

    facade.commands.dispatch({ type: 'run' });
    expect(calls.slice(-2)).toEqual(['10', '20']);

    cleanupTransitions();
    cleanupEffects();

    facade.commands.dispatch({ type: 'left/inc' });
    facade.commands.dispatch({ type: 'run' });

    expect(facade.state().left?.value).toBe(1);
    expect(calls.filter((item) => item === 'left').length).toBe(1);
    expect(calls.filter((item) => item === '10').length).toBe(1);
    expect(calls.filter((item) => item === '20').length).toBe(1);
  });

  it('encaminha falhas de effects para o handler configurado', async () => {
    const onEffectError = vi.fn();

    const facade = new EngineFacade<TestState, Status, TestEvent>({
      initialState: {
        status: 'idle',
        count: 0,
      },
      onEffectError,
    });

    facade.registerEffects([
      {
        id: 'run-sync-fail',
        event: 'run',
        handler: () => {
          throw new Error('sync');
        },
      },
      {
        id: 'run-async-fail',
        event: 'run',
        handler: async () => {
          throw new Error('async');
        },
      },
    ]);

    facade.commands.dispatch({ type: 'run' });
    await Promise.resolve();

    expect(onEffectError).toHaveBeenCalledTimes(2);
    expect(onEffectError).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        effectId: 'run-sync-fail',
        eventType: 'run',
      }),
    );
    expect(onEffectError).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        effectId: 'run-async-fail',
        eventType: 'run',
      }),
    );
  });
});
