import { Signal } from '@angular/core';

export type StateKey = string;
export type EventKey = string;

export interface MachineEvent {
  type: EventKey;
  [key: string]: unknown;
}

export type Guard<TContext, TEvent extends MachineEvent> = (
  context: TContext,
  event: TEvent,
) => boolean;

export type Action<TContext, TEvent extends MachineEvent> = (api: {
  context: () => TContext;
  setContext: (next: TContext | ((prev: TContext) => TContext)) => void;
  event: TEvent;
  send: (evt: TEvent) => void;
}) => void;

export interface TransitionConfig<TContext, TEvent extends MachineEvent> {
  target: StateKey;
  guard?: Guard<TContext, TEvent>;
  actions?: Action<TContext, TEvent>[];
}

export interface AfterConfig<TContext> {
  delay: number;
  target: StateKey;
  actions?: Action<TContext, MachineEvent>[];
  type?: 'timeout' | 'debounce';
}

export interface InvokeConfig<TContext, TEvent extends MachineEvent> {
  /** called on state entry; abort when leaving state */
  src: (api: {
    signal: AbortSignal;
    context: () => TContext;
    send: (evt: TEvent) => void;
  }) => Promise<void> | void;
  /** optional cleanup besides AbortSignal */
  onCleanup?: () => void;
}

export interface StateConfig<TContext, TEvent extends MachineEvent> {
  on?: Record<
    EventKey,
    TransitionConfig<TContext, TEvent> | TransitionConfig<TContext, TEvent>[]
  >;
  after?: AfterConfig<TContext>[];
  invoke?: InvokeConfig<TContext, TEvent>;
  entry?: Action<TContext, TEvent>[];
  exit?: Action<TContext, TEvent>[];
}

export interface MachineConfig<TContext, TEvent extends MachineEvent> {
  id: string;
  initial: StateKey;
  context: TContext;
  states: Record<StateKey, StateConfig<TContext, TEvent>>;
}

export interface MachineInstance<TContext, TEvent extends MachineEvent> {
  state: Signal<StateKey>;
  context: Signal<TContext>;
  send: (evt: TEvent) => void;
  stop: () => void;
}
