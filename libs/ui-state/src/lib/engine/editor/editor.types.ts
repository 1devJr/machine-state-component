import {
  EngineEvent,
  EngineState,
  TransitionRegistration,
} from '../store/engine.types';

export interface EditorSlice<TDraft> {
  open: boolean;
  dirty: boolean;
  draft: TDraft | null;
}

export type EditorEvent<TDraft> =
  | { type: 'editor/open' }
  | { type: 'editor/close' }
  | { type: 'editor/update'; partial: Partial<TDraft> }
  | { type: 'editor/save' }
  | { type: 'editor/cancel' };

export function createEditorSlice<TDraft>(
  draft: TDraft | null = null,
): EditorSlice<TDraft> {
  return {
    open: false,
    dirty: false,
    draft,
  };
}

export function createEditorTransitions<
  TState extends EngineState<TStatus> & {
    config?: TDraft | null;
    editor?: EditorSlice<TDraft>;
  },
  TStatus extends string,
  TDraft extends Record<string, unknown>,
  TEvent extends EngineEvent = EditorEvent<TDraft>,
>(
  id: string,
  createDefaultDraft: () => TDraft,
): TransitionRegistration<TState, TStatus, TEvent> {
  return {
    id,
    globalTransitions: {
      'editor/open': (state) => {
        const baseDraft = state.config
          ? (JSON.parse(JSON.stringify(state.config)) as TDraft)
          : createDefaultDraft();

        return {
          ...state,
          editor: {
            open: true,
            dirty: false,
            draft: baseDraft,
          },
        };
      },
      'editor/close': (state) => ({
        ...state,
        editor: {
          open: false,
          dirty: false,
          draft: null,
        },
      }),
      'editor/update': (state, event) => {
        const nextDraft = {
          ...(state.editor?.draft ?? createDefaultDraft()),
          ...((
            event as unknown as EditorEvent<TDraft> & {
              partial: Partial<TDraft>;
            }
          ).partial ?? {}),
        };

        return {
          ...state,
          editor: {
            open: true,
            dirty: true,
            draft: nextDraft,
          },
        };
      },
      'editor/save': (state) => ({
        ...state,
        config: state.editor?.draft ?? state.config,
        editor: {
          open: false,
          dirty: false,
          draft: null,
        },
      }),
      'editor/cancel': (state) => ({
        ...state,
        editor: {
          open: false,
          dirty: false,
          draft: null,
        },
      }),
    } as TransitionRegistration<TState, TStatus, TEvent>['globalTransitions'],
  };
}
