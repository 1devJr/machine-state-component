import type { EngineState } from '../store';

export interface SliceRegistration {
  key: string;
  initialState: Record<string, unknown>;
}

export interface SliceRegistry<
  TState extends EngineState<TStatus>,
  TStatus extends string,
> {
  register: (slice: SliceRegistration) => void;
  unregister: (sliceKey: string) => boolean;
  has: (sliceKey: string) => boolean;
  apply: (state: TState) => TState;
  clear: () => void;
}
