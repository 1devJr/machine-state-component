import { Type } from '@angular/core';
import type { EngineEvent } from '../store/engine.types';
import {
  ActionCreatorRecord,
  AnyActionCreator,
  ChildConnectionDefinition,
  ChildProjectionDefinition,
  CompositionConnectionRuntime,
  CompositionSchema,
  Composition,
  ConnectionDefinitionContext,
  ConnectionLink,
  ConnectionLinkFactory,
  ConnectionLinkResolved,
  ConnectionPort,
  createPluggableConfig,
  EditorTabRegistration,
  EventPayload,
  Pluggable,
  PluggableConfig,
  RequiredSlotKeys,
  SlotId,
  SlotSchemaConfig,
  SlotSchemaDefinition,
  TypedComposition,
  TypedCompositionSlots,
} from './pluggable.types';

export class CompositionBuilder {
  #slots = new Map<SlotId, PluggableConfig>();
  #editorTabs: EditorTabRegistration[] = [];

  static create(): CompositionBuilder {
    return new CompositionBuilder();
  }

  withSlot<TConfig>(
    slot: SlotId,
    component: Type<Pluggable<TConfig>>,
    config: TConfig,
    options?: {
      id?: string;
      cssClass?: string;
      sliceInitialState?: Record<string, unknown>;
    },
  ): this {
    this.#slots.set(slot, {
      ...createPluggableConfig(
        options?.id ?? `${slot}-${component.name}`,
        component,
        config,
      ),
      cssClass: options?.cssClass,
      slotSlice: options?.sliceInitialState
        ? {
            key: slot,
            initialState: options.sliceInitialState,
          }
        : undefined,
    });
    return this;
  }

  withEditorTabs(tabs: EditorTabRegistration[]): this {
    this.#editorTabs = [...this.#editorTabs, ...tabs];
    return this;
  }

  build(): Composition {
    const slots: Composition['slots'] = {};
    this.#slots.forEach((config, slot) => {
      slots[slot] = config;
    });

    return {
      slots,
      editorTabs: this.#editorTabs.length ? [...this.#editorTabs] : undefined,
    };
  }
}

export function extendComposition(base: Composition): CompositionBuilder {
  const builder = CompositionBuilder.create();
  for (const [slot, config] of Object.entries(base.slots)) {
    if (config) {
      builder.withSlot(
        slot,
        config.component as Type<Pluggable<unknown>>,
        config.config,
        {
          id: config.id,
          cssClass: config.cssClass,
          sliceInitialState: config.slotSlice?.initialState,
        },
      );
    }
  }

  if (base.editorTabs?.length) {
    builder.withEditorTabs(base.editorTabs);
  }

  return builder;
}

type MissingRequiredSlots<
  TSchema extends CompositionSchema,
  TMounted extends keyof TSchema,
> = Exclude<RequiredSlotKeys<TSchema>, TMounted>;

type PortTypeArgs<TPort> =
  TPort extends ConnectionPort<infer TActions, infer TEvents, infer TState>
    ? [TActions, TEvents, TState]
    : never;

type PortActionsOf<TPort> = PortTypeArgs<TPort>[0];
type PortEventsOf<TPort> = PortTypeArgs<TPort>[1];
type PortStateOf<TPort> = PortTypeArgs<TPort>[2];

type SliceStateFromArtifacts<TArtifacts> = TArtifacts extends {
  slice: {
    key: infer TSliceKey extends string;
    initialState: infer TSliceState extends object;
  };
}
  ? { [K in TSliceKey]?: TSliceState }
  : Record<never, never>;

type ComponentSliceState<TComponent> = TComponent extends {
  storeArtifacts?: infer TArtifacts;
}
  ? SliceStateFromArtifacts<TArtifacts>
  : Record<never, never>;

type SlotDerivedSlice<
  TSlot extends PropertyKey,
  TSliceState extends Record<string, unknown> | undefined,
> =
  TSliceState extends Record<string, unknown>
    ? { [K in Extract<TSlot, string>]?: TSliceState }
    : Record<never, never>;

type DefaultProjectionKey<TSlot extends PropertyKey> =
  `${Extract<TSlot, string>}Projection`;

type SlotMountOptions<
  TSliceState extends Record<string, unknown> | undefined = undefined,
> = {
  id?: string;
  cssClass?: string;
  sliceInitialState?: TSliceState;
};

class ResolvedConnectionLink<
  TSourceCreator extends AnyActionCreator,
  TTargetCreator extends AnyActionCreator,
> implements ConnectionLinkResolved<TSourceCreator, TTargetCreator>
{
  readonly source: TSourceCreator;
  readonly target: TTargetCreator;
  readonly sourceType: ReturnType<TSourceCreator>['type'];
  readonly targetType: ReturnType<TTargetCreator>['type'];
  readonly map: (event: EngineEvent) => Record<string, unknown>;

  constructor(
    source: TSourceCreator,
    target: TTargetCreator,
    mapper?: (
      event: ReturnType<TSourceCreator>,
    ) => EventPayload<ReturnType<TTargetCreator>>,
  ) {
    this.source = source;
    this.target = target;
    this.sourceType = source.actionType as ReturnType<TSourceCreator>['type'];
    this.targetType = target.actionType as ReturnType<TTargetCreator>['type'];
    this.map = (event: EngineEvent) => {
      const sourceEvent = event as ReturnType<TSourceCreator>;
      if (mapper) {
        return mapper(sourceEvent) as Record<string, unknown>;
      }

      const payload = { ...(sourceEvent as Record<string, unknown>) };
      delete payload['type'];
      return payload as Record<string, unknown>;
    };
  }
}

function createConnectionLink<
  TSourceCreator extends AnyActionCreator,
  TTargetCreator extends AnyActionCreator,
>(
  source: TSourceCreator,
  target: TTargetCreator,
): ConnectionLink<TSourceCreator, TTargetCreator> {
  const sourceType = source.actionType as ReturnType<TSourceCreator>['type'];
  const targetType = target.actionType as ReturnType<TTargetCreator>['type'];

  return {
    source,
    target,
    sourceType,
    targetType,
    map: ((input: unknown) => {
      if (typeof input === 'function') {
        return new ResolvedConnectionLink(
          source,
          target,
          input as (
            event: ReturnType<TSourceCreator>,
          ) => EventPayload<ReturnType<TTargetCreator>>,
        );
      }

      const sourceEvent = input as ReturnType<TSourceCreator>;
      const payload = { ...(sourceEvent as Record<string, unknown>) };
      delete payload['type'];
      return payload;
    }) as unknown,
  } as unknown as ConnectionLink<TSourceCreator, TTargetCreator>;
}

export function defineCompositionSchema<
  const TSchema extends CompositionSchema,
>(schema: TSchema): TSchema {
  return schema;
}

export function requiredSlot<TConfig>(): SlotSchemaDefinition<TConfig, true> {
  return { required: true };
}

export function optionalSlot<TConfig>(): SlotSchemaDefinition<TConfig, false> {
  return { required: false };
}

export interface CreateCompositionOptions<
  TParentActions extends ActionCreatorRecord = ActionCreatorRecord,
  TParentEvents extends ActionCreatorRecord = ActionCreatorRecord,
> {
  parentPort?: ConnectionPort<TParentActions, TParentEvents, object>;
}

export class TypedCompositionBuilder<
  TSchema extends CompositionSchema,
  TMounted extends keyof TSchema = never,
  TParentActions extends ActionCreatorRecord = ActionCreatorRecord,
  TParentEvents extends ActionCreatorRecord = ActionCreatorRecord,
  TConnections extends object = Record<never, never>,
  TChildCores extends object = Record<never, never>,
  TSlotSlices extends object = Record<never, never>,
> {
  readonly #slots = new Map<keyof TSchema, PluggableConfig>();
  readonly #editorTabs: EditorTabRegistration[] = [];
  readonly #childPorts = new Map<
    keyof TSchema,
    ConnectionPort<ActionCreatorRecord, ActionCreatorRecord, object>
  >();
  readonly #childConnections: Record<string, unknown> = {};
  readonly #schema: TSchema;
  readonly #parentPort?: ConnectionPort<TParentActions, TParentEvents, object>;

  constructor(
    schema: TSchema,
    parentPort?: ConnectionPort<TParentActions, TParentEvents, object>,
  ) {
    this.#schema = schema;
    this.#parentPort = parentPort;
  }

  withSlot<
    K extends keyof TSchema,
    TComponent extends Type<Pluggable<SlotSchemaConfig<TSchema[K]>>>,
    TSliceState extends Record<string, unknown> | undefined = undefined,
  >(
    slot: K,
    component: TComponent,
    config: SlotSchemaConfig<TSchema[K]>,
    options?: SlotMountOptions<TSliceState>,
  ): TypedCompositionBuilder<
    TSchema,
    TMounted | K,
    TParentActions,
    TParentEvents,
    TConnections,
    TChildCores,
    TSlotSlices &
      ComponentSliceState<TComponent> &
      SlotDerivedSlice<K, TSliceState>
  >;

  withSlot<
    K extends keyof TSchema,
    TComponent extends Type<Pluggable<SlotSchemaConfig<TSchema[K]>>>,
    TSliceState extends Record<string, unknown> | undefined = undefined,
  >(
    slot: K,
    component: TComponent,
    options?: SlotSchemaConfig<TSchema[K]> extends Record<string, never>
      ? SlotMountOptions<TSliceState>
      : never,
  ): TypedCompositionBuilder<
    TSchema,
    TMounted | K,
    TParentActions,
    TParentEvents,
    TConnections,
    TChildCores,
    TSlotSlices &
      ComponentSliceState<TComponent> &
      SlotDerivedSlice<K, TSliceState>
  >;

  withSlot<
    K extends keyof TSchema,
    TComponent extends Type<Pluggable<SlotSchemaConfig<TSchema[K]>>>,
    TSliceState extends Record<string, unknown> | undefined = undefined,
  >(
    slot: K,
    component: TComponent,
    configOrOptions?:
      | SlotSchemaConfig<TSchema[K]>
      | SlotMountOptions<TSliceState>,
    optionsArg?: SlotMountOptions<TSliceState>,
  ): TypedCompositionBuilder<
    TSchema,
    TMounted | K,
    TParentActions,
    TParentEvents,
    TConnections,
    TChildCores,
    TSlotSlices &
      ComponentSliceState<TComponent> &
      SlotDerivedSlice<K, TSliceState>
  > {
    const isOptionsOnly =
      optionsArg === undefined && this.#isSlotOptions(configOrOptions);
    const config = (
      isOptionsOnly ? {} : (configOrOptions ?? {})
    ) as SlotSchemaConfig<TSchema[K]>;
    const options = (isOptionsOnly ? configOrOptions : optionsArg) as
      | SlotMountOptions<TSliceState>
      | undefined;

    this.#slots.set(slot, {
      ...createPluggableConfig(
        options?.id ?? `${String(slot)}-${component.name}`,
        component,
        config,
      ),
      cssClass: options?.cssClass,
      slotSlice: options?.sliceInitialState
        ? {
            key: String(slot),
            initialState: options.sliceInitialState,
          }
        : undefined,
    });

    return this as unknown as TypedCompositionBuilder<
      TSchema,
      TMounted | K,
      TParentActions,
      TParentEvents,
      TConnections,
      TChildCores,
      TSlotSlices &
        ComponentSliceState<TComponent> &
        SlotDerivedSlice<K, TSliceState>
    >;
  }

  #isSlotOptions(value: unknown): value is {
    id?: string;
    cssClass?: string;
    sliceInitialState?: Record<string, unknown>;
  } {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return Object.keys(candidate).every(
      (key) =>
        key === 'id' || key === 'cssClass' || key === 'sliceInitialState',
    );
  }

  withChildCore<
    K extends keyof TSchema,
    TChildActions extends ActionCreatorRecord,
    TChildEvents extends ActionCreatorRecord,
    TChildState extends object,
  >(
    slot: K,
    endpoint: ConnectionPort<TChildActions, TChildEvents, TChildState>,
  ): TypedCompositionBuilder<
    TSchema,
    TMounted,
    TParentActions,
    TParentEvents,
    TConnections,
    TChildCores &
      Record<K, ConnectionPort<TChildActions, TChildEvents, TChildState>>,
    TSlotSlices
  > {
    this.#childPorts.set(
      slot,
      endpoint as unknown as ConnectionPort<
        ActionCreatorRecord,
        ActionCreatorRecord,
        object
      >,
    );
    return this as unknown as TypedCompositionBuilder<
      TSchema,
      TMounted,
      TParentActions,
      TParentEvents,
      TConnections,
      TChildCores &
        Record<K, ConnectionPort<TChildActions, TChildEvents, TChildState>>,
      TSlotSlices
    >;
  }

  connectChild<
    K extends keyof TChildCores & keyof TSchema,
    const TSliceKey extends string = DefaultProjectionKey<K>,
    TProjectedState extends object = never,
  >(
    slot: K,
    define: (
      context: ConnectionDefinitionContext<
        TParentActions,
        TParentEvents,
        PortActionsOf<TChildCores[K]>,
        PortEventsOf<TChildCores[K]>,
        PortStateOf<TChildCores[K]>
      >,
    ) => ChildConnectionDefinition<
      TParentActions,
      PortActionsOf<TChildCores[K]>,
      PortEventsOf<TChildCores[K]>,
      PortStateOf<TChildCores[K]>,
      | ChildProjectionDefinition<
          PortStateOf<TChildCores[K]>,
          TSliceKey,
          TProjectedState
        >
      | undefined
    >,
  ): TypedCompositionBuilder<
    TSchema,
    TMounted,
    TParentActions,
    TParentEvents,
    TConnections &
      Record<
        K,
        ChildConnectionDefinition<
          TParentActions,
          PortActionsOf<TChildCores[K]>,
          PortEventsOf<TChildCores[K]>,
          PortStateOf<TChildCores[K]>,
          | ChildProjectionDefinition<
              PortStateOf<TChildCores[K]>,
              TSliceKey,
              TProjectedState
            >
          | undefined
        >
      >,
    TChildCores,
    TSlotSlices
  > {
    if (!this.#parentPort) {
      throw new Error(
        'connectChild requires a parentPort configured in createComposition options.',
      );
    }

    const childPort = this.#childPorts.get(slot) as
      | ConnectionPort<
          PortActionsOf<TChildCores[K]>,
          PortEventsOf<TChildCores[K]>,
          PortStateOf<TChildCores[K]>
        >
      | undefined;
    if (!childPort) {
      throw new Error(
        `connectChild requires withChildCore for slot "${String(slot)}" before registering connections.`,
      );
    }

    const connection = define({
      parent: this.#parentPort as ConnectionPort<
        TParentActions,
        TParentEvents,
        object
      >,
      child: childPort as unknown as ConnectionPort<
        PortActionsOf<TChildCores[K]>,
        PortEventsOf<TChildCores[K]>,
        PortStateOf<TChildCores[K]>
      >,
      link: createConnectionLink as ConnectionLinkFactory,
    });

    const projectionKey = `${String(slot)}Projection` as TSliceKey;
    const normalizedConnection = connection.projection
      ? {
          ...connection,
          projection: {
            ...connection.projection,
            sliceKey: (connection.projection.sliceKey ??
              projectionKey) as TSliceKey,
          },
        }
      : connection;

    this.#childConnections[String(slot)] = normalizedConnection;
    return this as unknown as TypedCompositionBuilder<
      TSchema,
      TMounted,
      TParentActions,
      TParentEvents,
      TConnections &
        Record<
          K,
          ChildConnectionDefinition<
            TParentActions,
            PortActionsOf<TChildCores[K]>,
            PortEventsOf<TChildCores[K]>,
            PortStateOf<TChildCores[K]>,
            | ChildProjectionDefinition<
                PortStateOf<TChildCores[K]>,
                TSliceKey,
                TProjectedState
              >
            | undefined
          >
        >,
      TChildCores,
      TSlotSlices
    >;
  }

  withEditorTabs(tabs: EditorTabRegistration[]): this {
    this.#editorTabs.push(...tabs);
    return this;
  }

  #buildConnectionRuntime(): CompositionConnectionRuntime | undefined {
    if (!this.#parentPort || !Object.keys(this.#childConnections).length) {
      return undefined;
    }

    const parentPort = this.#parentPort as unknown as ConnectionPort<
      ActionCreatorRecord,
      ActionCreatorRecord,
      object
    >;
    const childConnections = this.#childConnections as Record<
      string,
      ChildConnectionDefinition<
        ActionCreatorRecord,
        ActionCreatorRecord,
        ActionCreatorRecord,
        object
      >
    >;
    const active = new Map<string, () => void>();

    const bindLinks = (
      specs: Array<{
        sourceType: string;
        targetType: string;
        map: (event: EngineEvent) => Record<string, unknown>;
      }>,
      sourcePort: ConnectionPort<
        ActionCreatorRecord,
        ActionCreatorRecord,
        object
      >,
      targetPort: ConnectionPort<
        ActionCreatorRecord,
        ActionCreatorRecord,
        object
      >,
    ): (() => void) => {
      const unsubscribers = specs.map((spec) =>
        sourcePort.subscribe((event) => {
          if (event.type !== spec.sourceType) {
            return;
          }

          const payload = spec.map(event);
          targetPort.dispatch({
            type: spec.targetType,
            ...payload,
          });
        }),
      );

      return () => {
        for (const unsubscribe of unsubscribers) {
          unsubscribe();
        }
      };
    };

    const enable = (slot: string): void => {
      if (active.has(slot)) {
        return;
      }

      const definition = childConnections[slot];
      if (!definition) {
        throw new Error(`No child connection defined for slot "${slot}".`);
      }

      const childPort = this.#childPorts.get(slot as keyof TSchema);
      if (!childPort) {
        throw new Error(
          `No child core endpoint registered for slot "${slot}".`,
        );
      }

      const cleanups: Array<() => void> = [];

      if (definition.parentToChild?.length) {
        cleanups.push(
          bindLinks(
            definition.parentToChild,
            parentPort,
            childPort as ConnectionPort<
              ActionCreatorRecord,
              ActionCreatorRecord,
              object
            >,
          ),
        );
      }

      if (definition.childToParent?.length) {
        cleanups.push(
          bindLinks(
            definition.childToParent,
            childPort as ConnectionPort<
              ActionCreatorRecord,
              ActionCreatorRecord,
              object
            >,
            parentPort,
          ),
        );
      }

      if (definition.projection) {
        const projection = definition.projection;
        const projectionSliceKey = projection.sliceKey ?? `${slot}Projection`;
        if (!parentPort.registerSlice || !parentPort.setSliceState) {
          throw new Error(
            `Parent connection port must implement registerSlice/setSliceState to use projection for slot "${slot}".`,
          );
        }

        if (!childPort.getState) {
          throw new Error(
            `Child connection port must implement getState to use projection for slot "${slot}".`,
          );
        }

        parentPort.registerSlice(
          projectionSliceKey,
          projection.initialState as Record<string, unknown>,
        );

        const updateProjection = () => {
          const nextChildState = childPort.getState?.();
          if (!nextChildState) {
            return;
          }
          parentPort.setSliceState?.(
            projectionSliceKey,
            projection.select(nextChildState) as Record<string, unknown>,
          );
        };

        updateProjection();
        cleanups.push(childPort.subscribe(() => updateProjection()));
        cleanups.push(() => {
          parentPort.unregisterSlice?.(projectionSliceKey);
        });
      }

      active.set(slot, () => {
        for (const cleanup of cleanups) {
          cleanup();
        }
      });
    };

    return {
      enable,
      disable: (slot: string) => {
        const cleanup = active.get(slot);
        if (cleanup) {
          cleanup();
          active.delete(slot);
        }
      },
      enableAll: () => {
        for (const slot of Object.keys(childConnections)) {
          enable(slot);
        }
      },
      disableAll: () => {
        for (const slot of Array.from(active.keys())) {
          const cleanup = active.get(slot);
          if (cleanup) {
            cleanup();
          }
          active.delete(slot);
        }
      },
      isEnabled: (slot: string) => active.has(slot),
    };
  }

  build(
    this: MissingRequiredSlots<TSchema, TMounted> extends never
      ? TypedCompositionBuilder<
          TSchema,
          TMounted,
          TParentActions,
          TParentEvents,
          TConnections,
          TChildCores,
          TSlotSlices
        >
      : never,
  ): TypedComposition<TSchema, TConnections, TSlotSlices> {
    const slots = {} as TypedCompositionSlots<TSchema>;
    this.#slots.forEach((config, slot) => {
      (slots as unknown as Record<string, PluggableConfig>)[String(slot)] =
        config;
    });

    const slotIds = {} as TypedComposition<
      TSchema,
      TConnections,
      TSlotSlices
    >['slotIds'];
    for (const key of Object.keys(this.#schema) as Array<keyof TSchema>) {
      slotIds[key] = key;
    }

    return {
      slots,
      slotIds,
      editorTabs: this.#editorTabs.length ? [...this.#editorTabs] : undefined,
      childConnections: this.#childConnections as TConnections,
      slotSlices: {} as TSlotSlices,
      connectionRuntime: this.#buildConnectionRuntime(),
    };
  }
}

export function createComposition<
  const TSchema extends CompositionSchema,
  TParentActions extends ActionCreatorRecord = ActionCreatorRecord,
  TParentEvents extends ActionCreatorRecord = ActionCreatorRecord,
>(
  schema: TSchema,
  options?: CreateCompositionOptions<TParentActions, TParentEvents>,
): TypedCompositionBuilder<TSchema, never, TParentActions, TParentEvents> {
  return new TypedCompositionBuilder<
    TSchema,
    never,
    TParentActions,
    TParentEvents
  >(schema, options?.parentPort);
}
