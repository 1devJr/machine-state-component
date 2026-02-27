import { computed, Signal } from '@angular/core';
import { EditorSlice } from './editor.types';

export interface EditorSelectionState<TDraft> {
  editor?: EditorSlice<TDraft>;
}

export class EditorSelections<
  TState extends EditorSelectionState<TDraft>,
  TDraft,
> {
  readonly editor: Signal<EditorSlice<TDraft> | undefined>;
  readonly isOpen: Signal<boolean>;
  readonly isDirty: Signal<boolean>;
  readonly draft: Signal<TDraft | null>;

  constructor(state: Signal<TState>) {
    this.editor = computed(() => state().editor);
    this.isOpen = computed(() => this.editor()?.open ?? false);
    this.isDirty = computed(() => this.editor()?.dirty ?? false);
    this.draft = computed(() => this.editor()?.draft ?? null);
  }
}
