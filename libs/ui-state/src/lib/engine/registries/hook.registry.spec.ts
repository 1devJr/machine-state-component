import { describe, expect, it, vi } from 'vitest';
import { createHookRegistry } from './hook.registry';
import { EngineState } from '../store/engine.types';

type TestStatus = 'idle' | 'ready';

interface TestState extends EngineState<TestStatus> {
  value: number;
}

type TestEvent = { type: 'save'; value: number };

describe('createHookRegistry', () => {
  it('fails fast when a before hook throws', () => {
    const registry = createHookRegistry<TestState, TestStatus, TestEvent>();
    const afterError = new Error('broken-before-hook');
    const nextHook = vi.fn();

    registry.register({
      onBeforeTransition: () => {
        throw afterError;
      },
    });
    registry.register({
      onBeforeTransition: nextHook,
    });

    expect(() =>
      registry.runBefore(
        {
          status: 'idle',
          value: 1,
        },
        { type: 'save', value: 2 },
      ),
    ).toThrow(afterError);
    expect(nextHook).not.toHaveBeenCalled();
  });

  it('fails fast when an after hook throws', () => {
    const registry = createHookRegistry<TestState, TestStatus, TestEvent>();
    const afterError = new Error('broken-after-hook');
    const nextHook = vi.fn();

    registry.register({
      onAfterTransition: () => {
        throw afterError;
      },
    });
    registry.register({
      onAfterTransition: nextHook,
    });

    expect(() =>
      registry.runAfter(
        {
          status: 'ready',
          value: 2,
        },
        { type: 'save', value: 3 },
      ),
    ).toThrow(afterError);
    expect(nextHook).not.toHaveBeenCalled();
  });
});
