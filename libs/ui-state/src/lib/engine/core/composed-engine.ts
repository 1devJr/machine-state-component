import { EngineFacade } from '../facade/engine.facade';
import type {
  ActionCreatorRecord,
  CompositionState,
  CompositionWithConnections,
  ConnectionPort,
} from '../pluggables/pluggable.types';
import type { EngineState } from '../store/engine.types';
import type {
  BoundActionPort,
  ComposedEngineResult,
  CoreArtifact,
  CoreTransitionDefinition,
  EventFromActions,
} from '../types/core';

class CoreArtifactRuntime<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown>,
  TComposition extends CompositionWithConnections,
  TSelections extends Record<string, unknown>,
> {
  readonly #artifact: CoreArtifact<
    TState,
    TStatus,
    TActions,
    TServices,
    TComposition,
    TSelections
  >;

  constructor(
    artifact: CoreArtifact<
      TState,
      TStatus,
      TActions,
      TServices,
      TComposition,
      TSelections
    >,
  ) {
    this.#artifact = artifact;
  }

  get id(): string {
    return this.#artifact.id;
  }

  get artifact(): CoreArtifact<
    TState,
    TStatus,
    TActions,
    TServices,
    TComposition,
    TSelections
  > {
    return this.#artifact;
  }

  get services(): TServices {
    return (this.#artifact.services ?? {}) as TServices;
  }

  normalizeTransitions(): CoreTransitionDefinition<
    TState,
    TStatus,
    EventFromActions<TActions>
  > {
    const transitions = this.#artifact.transitions as CoreTransitionDefinition<
      TState,
      TStatus,
      EventFromActions<TActions>
    >;

    return {
      transitions: transitions.transitions,
      globalTransitions: transitions.globalTransitions,
    };
  }

  createBaseFacade(): EngineFacade<
    TState,
    TStatus,
    EventFromActions<TActions>,
    TServices
  > {
    const transitions = this.normalizeTransitions();

    return new EngineFacade<
      TState,
      TStatus,
      EventFromActions<TActions>,
      TServices
    >({
      initialState: this.#artifact.store.initialState,
      transitions: transitions.transitions,
      globalTransitions: transitions.globalTransitions,
      services: this.services,
    });
  }
}

class ComposedEngineRuntime<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown>,
  TComposition extends CompositionWithConnections,
  TSelections extends Record<string, unknown>,
> {
  readonly #runtime: CoreArtifactRuntime<
    TState,
    TStatus,
    TActions,
    TServices,
    TComposition,
    TSelections
  >;

  constructor(
    artifact: CoreArtifact<
      TState,
      TStatus,
      TActions,
      TServices,
      TComposition,
      TSelections
    >,
  ) {
    this.#runtime = new CoreArtifactRuntime(artifact);
  }

  create(): ComposedEngineResult<
    TState,
    TStatus,
    TActions,
    TServices,
    TComposition,
    TSelections
  > {
    const artifact = this.#runtime.artifact;

    const baseFacade = this.#runtime.createBaseFacade();
    const effectsCleanup = baseFacade.registerEffects(artifact.effects);

    const connectionPort = baseFacade.createConnectionPort(
      artifact.actions,
      artifact.actions,
    ) as ConnectionPort<TActions, TActions, TState>;

    const composition = artifact.composition({
      facade: baseFacade,
      parentPort: connectionPort,
      actions: artifact.actions,
      services: this.#runtime.services,
    });

    composition.connectionRuntime?.enableAll();

    const facade = baseFacade as unknown as EngineFacade<
      CompositionState<TState, TComposition>,
      TStatus,
      EventFromActions<TActions>,
      TServices
    >;

    const actions = bindActionPort<
      TActions,
      EventFromActions<TActions>,
      TState,
      TStatus,
      TServices
    >(artifact.actions, baseFacade);

    const selections = artifact.selections(facade.state);

    const destroy = () => {
      composition.connectionRuntime?.disableAll();
      effectsCleanup();
      baseFacade.destroy();
    };

    return {
      id: this.#runtime.id,
      artifact,
      facade,
      baseFacade,
      actions,
      selections,
      composition,
      connectionPort,
      destroy,
    };
  }
}

function bindActionPort<
  TActions extends ActionCreatorRecord,
  TEvent extends EventFromActions<TActions>,
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TServices extends Record<string, unknown>,
>(
  actions: TActions,
  facade: EngineFacade<TState, TStatus, TEvent, TServices>,
): BoundActionPort<TActions> {
  const port = {} as BoundActionPort<TActions>;

  for (const actionName of Object.keys(actions) as Array<keyof TActions>) {
    const creator = actions[actionName];
    port[actionName] = ((...args: Parameters<typeof creator>) => {
      facade.commands.dispatch(creator(...args) as TEvent);
    }) as BoundActionPort<TActions>[typeof actionName];
  }

  return port;
}

export function createComposedEngine<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TActions extends ActionCreatorRecord,
  TServices extends Record<string, unknown>,
  TComposition extends CompositionWithConnections,
  TSelections extends Record<string, unknown>,
>(
  artifact: CoreArtifact<
    TState,
    TStatus,
    TActions,
    TServices,
    TComposition,
    TSelections
  >,
): ComposedEngineResult<
  TState,
  TStatus,
  TActions,
  TServices,
  TComposition,
  TSelections
> {
  return new ComposedEngineRuntime(artifact).create();
}
