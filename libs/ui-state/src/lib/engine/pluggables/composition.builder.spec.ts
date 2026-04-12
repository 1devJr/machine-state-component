import { describe, expect, it, vi } from 'vitest';
import { defineActionCatalog } from '../store/action-catalog';
import {
  CompositionBuilder,
  createComposition,
  defineCompositionSchema,
  extendComposition,
  requiredSlot,
} from './composition.builder';

class InputPluggable {
  config?: { placeholder: string };
}

class ResultsPluggable {
  config?: { dense: boolean };
}

class RulesPluggable {
  config?: { compact: boolean };
}

const parentCatalog = defineActionCatalog({
  selectPokemon: {
    type: 'parent/selectPokemon',
    payload: (name: string) => ({ name }),
  },
  ruleSaved: {
    type: 'parent/ruleSaved',
    payload: (ruleId: string) => ({ ruleId }),
  },
  hydrated: {
    type: 'parent/hydrated',
    payload: (status: string) => ({ status }),
  },
});

const childCatalog = defineActionCatalog({
  loadByPokemon: {
    type: 'child/loadByPokemon',
    payload: (name: string) => ({ name }),
  },
  saved: {
    type: 'child/saved',
    payload: (id: string) => ({ id }),
  },
  hydrated: {
    type: 'child/hydrated',
    payload: (status: string) => ({ status }),
  },
});

function createParentPort() {
  const listeners = new Set<(event: unknown) => void>();
  const registeredSlices = new Map<string, Record<string, unknown>>();
  const sliceState = new Map<string, Record<string, unknown>>();

  return {
    actions: parentCatalog.creators,
    events: parentCatalog.creators,
    dispatch: (event: unknown) => {
      for (const listener of listeners) {
        listener(event);
      }
    },
    subscribe: (listener: (event: unknown) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState: () => ({}),
    registerSlice: (
      sliceKey: string,
      initialState: Record<string, unknown>,
    ) => {
      if (!registeredSlices.has(sliceKey)) {
        registeredSlices.set(sliceKey, initialState);
      }
    },
    unregisterSlice: (sliceKey: string) => {
      registeredSlices.delete(sliceKey);
      sliceState.delete(sliceKey);
    },
    setSliceState: (sliceKey: string, nextState: Record<string, unknown>) => {
      sliceState.set(sliceKey, nextState);
    },
    __registeredSlices: registeredSlices,
    __sliceState: sliceState,
  };
}

function createChildPort() {
  let state = {
    status: 'idle',
    pendingCount: 0,
    errorMessage: null as string | null,
  };
  const listeners = new Set<(event: unknown) => void>();

  return {
    actions: childCatalog.creators,
    events: childCatalog.creators,
    dispatch: (event: { type: string; [key: string]: unknown }) => {
      if (event.type === childCatalog.types.hydrated) {
        state = {
          status: String(event.status),
          pendingCount: Number(event.pendingCount ?? 0),
          errorMessage:
            (event.errorMessage as string | null | undefined) ?? null,
        };
      }

      for (const listener of listeners) {
        listener(event);
      }
    },
    subscribe: (listener: (event: unknown) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState: () => state,
  };
}

describe('CompositionBuilder', () => {
  it('monta composição com slots e tabs do editor', () => {
    const composition = CompositionBuilder.create()
      .withSlot('input', InputPluggable, { placeholder: 'Buscar...' })
      .withEditorTabs([
        {
          id: 'general',
          title: 'General',
          component: InputPluggable,
          priority: 10,
        },
      ])
      .build();

    expect(composition.slots.input?.id).toBe('input-pluggable');
    expect(composition.slots.input?.config).toEqual({
      placeholder: 'Buscar...',
    });
    expect(composition.editorTabs?.length).toBe(1);
    expect(composition.editorTabs?.[0].id).toBe('general');
  });

  it('estende composição base sem perder configurações existentes', () => {
    const base = CompositionBuilder.create()
      .withSlot('input', InputPluggable, { placeholder: 'Base' })
      .build();

    const extended = extendComposition(base)
      .withSlot('results', ResultsPluggable, { dense: true })
      .build();

    expect(extended.slots.input?.config).toEqual({ placeholder: 'Base' });
    expect(extended.slots.results?.config).toEqual({ dense: true });
  });

  it('cria composição tipada com slotIds e conexões de child core', () => {
    const schema = defineCompositionSchema({
      input: requiredSlot<{ placeholder: string }>(),
      rules: requiredSlot<{ compact: boolean }>(),
    });

    const composition = createComposition(schema, {
      parentPort: createParentPort(),
    })
      .withSlot('input', InputPluggable, { placeholder: 'Buscar...' })
      .withSlot('rules', RulesPluggable, { compact: true })
      .withChildCore('rules', createChildPort())
      .connectChild('rules', ({ parent, child, link }) => ({
        parentToChild: [
          link(parent.actions.selectPokemon, child.actions.loadByPokemon).map(
            (event) => ({ name: event.name }),
          ),
          link(parent.actions.hydrated, child.actions.hydrated),
        ],
        childToParent: [
          link(child.events.saved, parent.actions.ruleSaved).map((event) => ({
            ruleId: event.id,
          })),
        ],
        projection: {
          sliceKey: 'rulesProjection',
          initialState: {
            status: 'idle',
            pendingCount: 0,
            lastError: null,
          },
          select: (childState) => ({
            status: childState.status,
            pendingCount: childState.pendingCount,
            lastError: childState.errorMessage,
          }),
        },
      }))
      .build();

    expect(composition.slotIds.input).toBe('input');
    expect(composition.slotIds.rules).toBe('rules');
    expect(composition.slots.input.config).toEqual({
      placeholder: 'Buscar...',
    });
    expect(composition.slots.rules.config).toEqual({ compact: true });
    expect(composition.childConnections.rules).toBeDefined();
  });

  it('executa runtime de conexão e atualiza projection no pai', () => {
    const schema = defineCompositionSchema({
      rules: requiredSlot<{ compact: boolean }>(),
    });

    const parentPort = createParentPort();
    const childPort = createChildPort();
    const parentDispatch = vi.spyOn(parentPort, 'dispatch');
    const childDispatch = vi.spyOn(childPort, 'dispatch');
    const setSliceState = vi.spyOn(parentPort, 'setSliceState');

    const composition = createComposition(schema, { parentPort })
      .withSlot('rules', RulesPluggable, { compact: true })
      .withChildCore('rules', childPort)
      .connectChild('rules', ({ parent, child, link }) => ({
        parentToChild: [
          link(parent.actions.selectPokemon, child.actions.loadByPokemon).map(
            (event) => ({ name: event.name }),
          ),
        ],
        childToParent: [
          link(child.events.saved, parent.actions.ruleSaved).map((event) => ({
            ruleId: event.id,
          })),
        ],
        projection: {
          sliceKey: 'rulesProjection',
          initialState: { status: 'idle', pendingCount: 0, lastError: null },
          select: (childState) => ({
            status: childState.status,
            pendingCount: childState.pendingCount,
            lastError: childState.errorMessage,
          }),
        },
      }))
      .build();

    composition.connectionRuntime?.enable('rules');

    parentPort.dispatch(parentCatalog.creators.selectPokemon('charmander'));
    expect(childDispatch).toHaveBeenCalledWith({
      type: childCatalog.types.loadByPokemon,
      name: 'charmander',
    });

    childPort.dispatch(childCatalog.creators.saved('rule-1'));
    expect(parentDispatch).toHaveBeenCalledWith({
      type: parentCatalog.types.ruleSaved,
      ruleId: 'rule-1',
    });

    childPort.dispatch({
      type: childCatalog.types.hydrated,
      status: 'ready',
      pendingCount: 2,
      errorMessage: null,
    });

    expect(parentPort.__registeredSlices.get('rulesProjection')).toEqual({
      status: 'idle',
      pendingCount: 0,
      lastError: null,
    });
    expect(parentPort.__sliceState.get('rulesProjection')).toEqual({
      status: 'ready',
      pendingCount: 2,
      lastError: null,
    });

    childPort.dispatch({
      type: childCatalog.types.hydrated,
      status: 'ready',
      pendingCount: 2,
      errorMessage: null,
    });
    expect(setSliceState).toHaveBeenCalledTimes(1);

    composition.connectionRuntime?.disable('rules');
    expect(parentPort.__registeredSlices.has('rulesProjection')).toBe(false);
    expect(parentPort.__sliceState.has('rulesProjection')).toBe(false);
  });
});
