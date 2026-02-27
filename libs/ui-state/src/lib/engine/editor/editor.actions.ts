import { EngineCommandPort } from '../pluggables/pluggable.types';
import { EngineEvent } from '../store/engine.types';

export class EditorActions<TEvent extends EngineEvent = EngineEvent> {
  constructor(private readonly commands: EngineCommandPort<TEvent>) {}

  open(): void {
    this.commands.dispatch({ type: 'editor/open' } as TEvent);
  }

  close(): void {
    this.commands.dispatch({ type: 'editor/close' } as TEvent);
  }

  update(partial: Record<string, unknown>): void {
    this.commands.dispatch({
      type: 'editor/update',
      partial,
    } as unknown as TEvent);
  }

  save(): void {
    this.commands.dispatch({ type: 'editor/save' } as TEvent);
  }

  cancel(): void {
    this.commands.dispatch({ type: 'editor/cancel' } as TEvent);
  }
}
