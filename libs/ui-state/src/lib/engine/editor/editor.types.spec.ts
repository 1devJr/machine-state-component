import { describe, expect, it } from 'vitest';
import { EngineFacade } from '../facade/engine.facade';
import { EngineState } from '../store/engine.types';
import {
  createEditorSlice,
  createEditorTransitions,
  EditorEvent,
  EditorSlice,
} from './editor.types';

type Status = 'idle' | 'ready';

interface ConfigDraft {
  id: string;
  title?: string;
}

type TestEvent = EditorEvent<ConfigDraft> | { type: 'noop' };

interface TestState extends EngineState<Status> {
  config: ConfigDraft | null;
  editor?: EditorSlice<ConfigDraft>;
}

describe('editor core', () => {
  it('abre, atualiza e salva draft no estado', () => {
    const editorTransitions = createEditorTransitions<
      TestState,
      Status,
      ConfigDraft,
      TestEvent
    >('editor', () => ({ id: 'default' }));

    const facade = new EngineFacade<TestState, Status, TestEvent>({
      initialState: {
        status: 'idle',
        config: null,
        editor: createEditorSlice<ConfigDraft>(),
      },
      globalTransitions: editorTransitions.globalTransitions,
    });

    facade.commands.dispatch({ type: 'editor/open' });
    expect(facade.state().editor?.open).toBe(true);
    expect(facade.state().editor?.draft).toEqual({ id: 'default' });

    facade.commands.dispatch({
      type: 'editor/update',
      partial: { id: 'c1', title: 'Card' },
    });
    expect(facade.state().editor?.dirty).toBe(true);
    expect(facade.state().editor?.draft).toEqual({ id: 'c1', title: 'Card' });

    facade.commands.dispatch({ type: 'editor/save' });
    expect(facade.state().config).toEqual({ id: 'c1', title: 'Card' });
    expect(facade.state().editor?.open).toBe(false);
    expect(facade.state().editor?.dirty).toBe(false);
    expect(facade.state().editor?.draft).toBeNull();
  });

  it('cancela edição sem persistir o draft', () => {
    const editorTransitions = createEditorTransitions<
      TestState,
      Status,
      ConfigDraft,
      TestEvent
    >('editor', () => ({ id: 'default' }));

    const facade = new EngineFacade<TestState, Status, TestEvent>({
      initialState: {
        status: 'ready',
        config: { id: 'original', title: 'Original' },
        editor: createEditorSlice<ConfigDraft>(),
      },
      globalTransitions: editorTransitions.globalTransitions,
    });

    facade.commands.dispatch({ type: 'editor/open' });
    facade.commands.dispatch({
      type: 'editor/update',
      partial: { title: 'Changed' },
    });
    expect(facade.state().editor?.draft).toEqual({
      id: 'original',
      title: 'Changed',
    });

    facade.commands.dispatch({ type: 'editor/cancel' });
    expect(facade.state().config).toEqual({
      id: 'original',
      title: 'Original',
    });
    expect(facade.state().editor?.open).toBe(false);
    expect(facade.state().editor?.draft).toBeNull();
  });
});
