import type { EngineEvent } from '../store/engine-store.types';

export type PayloadFactory = (...args: never[]) => Record<string, unknown>;

export type ActionDefinition = {
  type: string;
  payload?: PayloadFactory;
};

export type ActionDefinitions = Record<string, ActionDefinition>;

export type ActionCreatorFromDefinition<TDefinition extends ActionDefinition> =
  TDefinition extends { payload: (...args: infer TArgs) => infer TPayload }
    ? TPayload extends Record<string, unknown>
      ? ((...args: TArgs) => { type: TDefinition['type'] } & TPayload) & {
          readonly actionType: TDefinition['type'];
        }
      : never
    : (() => { type: TDefinition['type'] }) & {
        readonly actionType: TDefinition['type'];
      };

export type ActionCreatorsFromDefinitions<
  TDefinitions extends ActionDefinitions,
> = {
  [K in keyof TDefinitions]: ActionCreatorFromDefinition<TDefinitions[K]>;
};

export type ActionTypesFromDefinitions<TDefinitions extends ActionDefinitions> =
  {
    [K in keyof TDefinitions]: TDefinitions[K]['type'];
  };

export interface ActionCatalog<TDefinitions extends ActionDefinitions> {
  definitions: TDefinitions;
  types: ActionTypesFromDefinitions<TDefinitions>;
  creators: ActionCreatorsFromDefinitions<TDefinitions>;
}

export type InferActionEvent<
  TCatalog extends {
    creators: Record<string, (...args: never[]) => EngineEvent>;
  },
> = ReturnType<TCatalog['creators'][keyof TCatalog['creators']]>;
