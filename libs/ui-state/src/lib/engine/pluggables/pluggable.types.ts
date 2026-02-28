import {
  InjectionToken,
  Injector,
  InputSignal,
  Signal,
  Type,
} from '@angular/core';
import {
  EffectConfig,
  EngineEvent,
  EngineState,
  TransitionRegistration,
} from '../store/engine.types';

export type SlotId = string;
export type GenericRecord = Record<string, unknown>;
export type EventPayload<TEvent extends EngineEvent> = Omit<TEvent, 'type'>;
type BivariantEventCreator<TEvent extends EngineEvent> = {
  bivarianceHack(...args: unknown[]): TEvent;
}['bivarianceHack'];

export type ActionCreator<TEvent extends EngineEvent = EngineEvent> =
  BivariantEventCreator<TEvent> & {
    readonly actionType: TEvent['type'];
  };
export type ActionCreatorRecord = Record<string, ActionCreator>;
export type AnyActionCreator = ActionCreator<EngineEvent>;

export type EventFromCreator<TCreator extends AnyActionCreator> =
  ReturnType<TCreator>;
export type PayloadFromCreator<TCreator extends AnyActionCreator> =
  EventPayload<EventFromCreator<TCreator>>;
export type PayloadCompatible<
  TSourceCreator extends AnyActionCreator,
  TTargetCreator extends AnyActionCreator,
> =
  PayloadFromCreator<TSourceCreator> extends PayloadFromCreator<TTargetCreator>
    ? true
    : false;

export interface EditorTabRegistration {
  id: string;
  title: string;
  component: Type<unknown>;
  priority?: number;
  icon?: string;
  visible?: (state: Record<string, unknown>) => boolean;
}

export interface PluggableStoreArtifacts<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> {
  slice?: {
    key: string;
    initialState: Record<string, unknown>;
  };
  transitions?: TransitionRegistration<TState, TStatus, TEvent>;
  effects?: EffectConfig<TState, TStatus, TEvent, TServices>[];
  editorTabs?: EditorTabRegistration[];
  actions?: ActionCreatorRecord;
  selections?: (state: Signal<TState>) => Record<string, Signal<unknown>>;
}

export function definePluggableStoreArtifacts<
  const TArtifacts extends PluggableStoreArtifacts<
    EngineState<string>,
    string,
    EngineEvent,
    Record<string, unknown>
  >,
>(artifacts: TArtifacts): TArtifacts {
  return artifacts;
}

export interface EngineCommandPort<TEvent extends EngineEvent> {
  dispatch: (event: TEvent) => void;
  dispatchMany: (events: TEvent[]) => void;
}

export interface PluggableContext<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TConfig,
> {
  commands: EngineCommandPort<TEvent>;
  state: Signal<TState>;
  injector: Injector;
  config: TConfig;
  slotId: SlotId;
}

export const ENGINE_PLUGGABLE_CONTEXT = new InjectionToken<
  PluggableContext<EngineState<string>, string, EngineEvent, unknown>
>('ENGINE_PLUGGABLE_CONTEXT');

export interface PluggableWithArtifacts<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> {
  storeArtifacts?: PluggableStoreArtifacts<TState, TStatus, TEvent, TServices>;
}

export type PluggableComponentType<
  TConfig = unknown,
  TStatus extends string = string,
  TState extends EngineState<TStatus> = EngineState<TStatus>,
  TEvent extends EngineEvent = EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> = Type<Pluggable<TConfig>> & {
  storeArtifacts?: PluggableStoreArtifacts<TState, TStatus, TEvent, TServices>;
};

export interface PluggableConfig<TConfig = unknown> {
  id: string;
  component: Type<unknown>;
  config: TConfig;
  cssClass?: string;
  slotSlice?: {
    key: string;
    initialState: Record<string, unknown>;
  };
}

export interface Composition {
  slots: Partial<Record<SlotId, PluggableConfig>>;
  editorTabs?: EditorTabRegistration[];
}

export interface SlotSchemaDefinition<
  TConfig,
  TRequired extends boolean = boolean,
> {
  required: TRequired;
  readonly __config?: TConfig;
}

export type CompositionSchema = Record<
  string,
  SlotSchemaDefinition<unknown, boolean>
>;
export type SlotSchemaConfig<
  TSlot extends SlotSchemaDefinition<unknown, boolean>,
> =
  TSlot extends SlotSchemaDefinition<infer TConfig, boolean> ? TConfig : never;

export type RequiredSlotKeys<TSchema extends CompositionSchema> = {
  [K in keyof TSchema]: TSchema[K] extends SlotSchemaDefinition<unknown, true>
    ? K
    : never;
}[keyof TSchema];

export type OptionalSlotKeys<TSchema extends CompositionSchema> = Exclude<
  keyof TSchema,
  RequiredSlotKeys<TSchema>
>;

export type TypedCompositionSlots<TSchema extends CompositionSchema> = {
  [K in RequiredSlotKeys<TSchema>]: PluggableConfig<
    SlotSchemaConfig<TSchema[K]>
  >;
} & {
  [K in OptionalSlotKeys<TSchema>]?: PluggableConfig<
    SlotSchemaConfig<TSchema[K]>
  >;
};

export type TypedSlotIds<TSchema extends CompositionSchema> = {
  [K in keyof TSchema]: K;
};

export interface ChildProjectionDefinition<
  TChildState extends object,
  TSliceKey extends string = string,
  TProjectedState extends object = Record<string, unknown>,
> {
  sliceKey?: TSliceKey;
  initialState: TProjectedState;
  select: (childState: TChildState) => TProjectedState;
}

export interface ConnectionLinkSpec<
  TSourceEvent extends EngineEvent,
  TTargetEvent extends EngineEvent,
> {
  sourceType: TSourceEvent['type'];
  targetType: TTargetEvent['type'];
  map: (event: EngineEvent) => Record<string, unknown>;
}

export interface ConnectionLinkResolved<
  TSourceCreator extends AnyActionCreator,
  TTargetCreator extends AnyActionCreator,
> {
  readonly source: TSourceCreator;
  readonly target: TTargetCreator;
  readonly sourceType: EventFromCreator<TSourceCreator>['type'];
  readonly targetType: EventFromCreator<TTargetCreator>['type'];
  readonly map: (event: EngineEvent) => Record<string, unknown>;
}

export interface ConnectionLinkNeedsMap<
  TSourceCreator extends AnyActionCreator,
  TTargetCreator extends AnyActionCreator,
> {
  readonly source: TSourceCreator;
  readonly target: TTargetCreator;
  map: (
    mapper: (
      event: EventFromCreator<TSourceCreator>,
    ) => PayloadFromCreator<TTargetCreator>,
  ) => ConnectionLinkResolved<TSourceCreator, TTargetCreator>;
}

export type ConnectionLink<
  TSourceCreator extends AnyActionCreator,
  TTargetCreator extends AnyActionCreator,
> =
  PayloadCompatible<TSourceCreator, TTargetCreator> extends true
    ? ConnectionLinkResolved<TSourceCreator, TTargetCreator>
    : ConnectionLinkNeedsMap<TSourceCreator, TTargetCreator>;

export interface ConnectionPort<
  TActions extends ActionCreatorRecord,
  TEvents extends ActionCreatorRecord = TActions,
  TState extends object = GenericRecord,
> {
  actions: TActions;
  events: TEvents;
  dispatch: (event: EventFromCreator<TActions[keyof TActions]>) => void;
  subscribe: (
    listener: (event: EventFromCreator<TEvents[keyof TEvents]>) => void,
  ) => () => void;
  getState?: () => TState;
  registerSlice?: (
    sliceKey: string,
    initialState: Record<string, unknown>,
  ) => void;
  unregisterSlice?: (sliceKey: string) => void;
  setSliceState?: (
    sliceKey: string,
    nextState: Record<string, unknown>,
  ) => void;
}

export type ActionConnectionPort<
  TActions extends ActionCreatorRecord,
  TState extends object = GenericRecord,
> = ConnectionPort<TActions, TActions, TState>;

export type ConnectionLinkFactory = <
  TSourceCreator extends AnyActionCreator,
  TTargetCreator extends AnyActionCreator,
>(
  source: TSourceCreator,
  target: TTargetCreator,
) => ConnectionLink<TSourceCreator, TTargetCreator>;

export interface ChildConnectionDefinition<
  TParentActions extends ActionCreatorRecord,
  TChildActions extends ActionCreatorRecord,
  TChildEvents extends ActionCreatorRecord,
  TChildState extends object,
  TProjection extends
    | ChildProjectionDefinition<TChildState, string, object>
    | undefined =
    | ChildProjectionDefinition<TChildState, string, object>
    | undefined,
> {
  parentToChild?: Array<
    ConnectionLinkSpec<
      EventFromCreator<TParentActions[keyof TParentActions]>,
      EventFromCreator<TChildActions[keyof TChildActions]>
    >
  >;
  childToParent?: Array<
    ConnectionLinkSpec<
      EventFromCreator<TChildEvents[keyof TChildEvents]>,
      EventFromCreator<TParentActions[keyof TParentActions]>
    >
  >;
  projection?: TProjection;
}

export interface ConnectionDefinitionContext<
  TParentActions extends ActionCreatorRecord,
  TParentEvents extends ActionCreatorRecord,
  TChildActions extends ActionCreatorRecord,
  TChildEvents extends ActionCreatorRecord,
  TChildState extends object,
> {
  parent: ConnectionPort<TParentActions, TParentEvents, object>;
  child: ConnectionPort<TChildActions, TChildEvents, TChildState>;
  link: ConnectionLinkFactory;
}

export interface TypedComposition<
  TSchema extends CompositionSchema,
  TConnectionDefinitions extends object = Record<never, never>,
  TSlotSlices extends object = Record<never, never>,
> {
  slots: TypedCompositionSlots<TSchema>;
  slotIds: TypedSlotIds<TSchema>;
  editorTabs?: EditorTabRegistration[];
  childConnections: TConnectionDefinitions;
  slotSlices: TSlotSlices;
  connectionRuntime?: CompositionConnectionRuntime;
}

export interface CompositionConnectionRuntime {
  enable: (slot: string) => void;
  disable: (slot: string) => void;
  enableAll: () => void;
  disableAll: () => void;
  isEnabled: (slot: string) => boolean;
}

type ConnectionProjection<TConnection> = TConnection extends {
  projection?: infer TProjection;
}
  ? NonNullable<TProjection>
  : never;

export type InferConnectionProjectionState<TConnections extends object> = {
  [TConnectionKey in keyof TConnections as ConnectionProjection<
    TConnections[TConnectionKey]
  > extends {
    sliceKey?: infer TSliceKey extends string;
  }
    ? TSliceKey
    : never]?: ConnectionProjection<TConnections[TConnectionKey]> extends {
    select: (childState: never) => infer TProjectedState;
  }
    ? TProjectedState
    : never;
};

export type CompositionWithConnections = {
  childConnections: object;
  slotSlices: object;
  connectionRuntime?: CompositionConnectionRuntime;
};

export type CompositionSlotState<
  TComposition extends CompositionWithConnections,
> = TComposition['slotSlices'];

export type CompositionProjectionState<
  TComposition extends CompositionWithConnections,
> = InferConnectionProjectionState<TComposition['childConnections']>;

export type CompositionState<
  TBaseState extends object,
  TComposition extends CompositionWithConnections,
> = TBaseState &
  CompositionSlotState<TComposition> &
  CompositionProjectionState<TComposition>;

export type CompositionProjection<
  TComposition extends CompositionWithConnections,
  TSliceKey extends keyof CompositionProjectionState<TComposition> & string,
> = CompositionProjectionState<TComposition>[TSliceKey];

export interface Pluggable<TConfig = unknown> {
  config?: TConfig | InputSignal<TConfig | undefined> | Signal<TConfig>;
}

export function createPluggableConfig<TConfig>(
  id: string,
  component: Type<Pluggable<TConfig>>,
  config: TConfig,
): PluggableConfig<TConfig> {
  return {
    id,
    component,
    config,
  };
}
