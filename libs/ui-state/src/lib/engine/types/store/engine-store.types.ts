import type { Signal } from '@angular/core';

export type EngineDefaultStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface EngineEvent {
  type: string;
  [key: string]: unknown;
}

export type EventMap = Record<string, Record<string, unknown> | undefined>;

export type EventUnion<TMap extends EventMap> = {
  [K in keyof TMap & string]: { type: K } & (TMap[K] extends Record<
    string,
    unknown
  >
    ? TMap[K]
    : Record<never, never>);
}[keyof TMap & string];

export type EventType<TEvent extends EngineEvent> = TEvent['type'];

export type EventByType<
  TEvent extends EngineEvent,
  K extends EventType<TEvent>,
> = Extract<TEvent, { type: K }>;

export type EngineState<TStatus extends string = EngineDefaultStatus> = {
  status: TStatus;
};

export type TransitionFn<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
  K extends EventType<TEvent> = EventType<TEvent>,
> = (state: TState, event: EventByType<TEvent, K>) => TState;

export type TransitionHandlerMap<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
> = Partial<{
  [K in EventType<TEvent>]: TransitionFn<TState, TStatus, TEvent, K>;
}>;

export type TransitionTable<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
> = Partial<Record<TStatus, TransitionHandlerMap<TState, TStatus, TEvent>>>;

export type GlobalTransitions<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
> = Partial<{
  [K in EventType<TEvent>]: TransitionFn<TState, TStatus, TEvent, K>;
}>;

export interface TransitionRegistration<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
> {
  id: string;
  transitions?: TransitionTable<TState, TStatus, TEvent>;
  globalTransitions?: GlobalTransitions<TState, TStatus, TEvent>;
}

export interface ReducerHook<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
> {
  onBeforeTransition?: (state: TState, event: TEvent) => void;
  onAfterTransition?: (state: TState, event: TEvent) => void;
}

export interface EffectContext<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  dispatch: (event: TEvent) => void;
  getState: () => TState;
  services: TServices;
}

export interface EffectConfig<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
  K extends EventType<TEvent> = EventType<TEvent>,
> {
  id: string;
  event: K;
  priority?: number;
  when?: (state: TState, event: EventByType<TEvent, K>) => boolean;
  handler: (
    state: TState,
    event: EventByType<TEvent, K>,
    context: EffectContext<TState, TStatus, TEvent, TServices>,
  ) => void | Promise<void>;
}

export type EffectByEvent<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> = {
  [K in EventType<TEvent>]: EffectConfig<TState, TStatus, TEvent, TServices, K>;
}[EventType<TEvent>];

export interface FacadeCommands<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent = EngineEvent,
> {
  dispatch: (event: TEvent) => void;
  dispatchMany: (events: TEvent[]) => void;
  getStateSnapshot: () => TState;
}

export interface FacadeSelections<
  TState extends EngineState<TStatus>,
  TStatus extends string,
> {
  state: Signal<TState>;
  status: Signal<TStatus>;
}

export type SliceInitEvent = {
  type: '__engine/initSlice';
  sliceKey: string;
  initialState: Record<string, unknown>;
};
