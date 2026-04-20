import { describe, expect, it, vi } from 'vitest';
import { createEffectRegistry } from './effect.registry';
import { EngineState } from '../store/engine.types';

type TestStatus = 'idle' | 'ready';

interface TestState extends EngineState<TestStatus> {
  value: number;
}

type TestEvent =
  | { type: 'save'; value: number }
  | { type: 'delete'; id: string };

describe('createEffectRegistry', () => {
  it('clears the event cache when the registry is reset', () => {
    const registry = createEffectRegistry<
      TestState,
      TestStatus,
      TestEvent,
      Record<string, unknown>
    >();

    registry.register([
      {
        id: 'save-10',
        event: 'save',
        priority: 10,
        handler: vi.fn(),
      },
      {
        id: 'save-20',
        event: 'save',
        priority: 20,
        handler: vi.fn(),
      },
    ]);

    expect(registry.listByEvent('save')).toHaveLength(2);

    registry.clear();

    expect(registry.list()).toEqual([]);
    expect(registry.listByEvent('save')).toEqual([]);
  });

  it('returns shallow copies instead of the cached internal arrays', () => {
    const registry = createEffectRegistry<
      TestState,
      TestStatus,
      TestEvent,
      Record<string, unknown>
    >();

    registry.register([
      {
        id: 'save-10',
        event: 'save',
        priority: 10,
        handler: vi.fn(),
      },
    ]);

    const listedByEvent = registry.listByEvent('save');
    const listedAll = registry.list();

    expect(listedByEvent).toHaveLength(1);
    expect(listedAll).toHaveLength(1);

    (listedByEvent as unknown as { length: number }).length = 0;
    (listedAll as unknown as { length: number }).length = 0;

    expect(registry.listByEvent('save')).toHaveLength(1);
    expect(registry.list()).toHaveLength(1);
  });
});
