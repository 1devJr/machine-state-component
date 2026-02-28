import type {
  ActionCatalog,
  ActionCreatorsFromDefinitions,
  ActionDefinitions,
  ActionTypesFromDefinitions,
} from '../types/actions';

export type * from '../types/actions';

export function defineActionCatalog<
  const TDefinitions extends ActionDefinitions,
>(definitions: TDefinitions): ActionCatalog<TDefinitions> {
  const types = {} as ActionTypesFromDefinitions<TDefinitions>;
  const creators = {} as ActionCreatorsFromDefinitions<TDefinitions>;

  (Object.keys(definitions) as Array<keyof TDefinitions>).forEach((key) => {
    const definition = definitions[key];
    types[key] =
      definition.type as ActionTypesFromDefinitions<TDefinitions>[typeof key];

    const payloadFactory = definition.payload;
    if (typeof payloadFactory === 'function') {
      const creator = ((...args: Parameters<typeof payloadFactory>) => ({
        type: definition.type,
        ...payloadFactory(...args),
      })) as ActionCreatorsFromDefinitions<TDefinitions>[typeof key];
      Object.defineProperty(creator, 'actionType', {
        value: definition.type,
        enumerable: true,
        writable: false,
      });
      creators[key] = creator;
      return;
    }

    const creator = (() => ({
      type: definition.type,
    })) as ActionCreatorsFromDefinitions<TDefinitions>[typeof key];
    Object.defineProperty(creator, 'actionType', {
      value: definition.type,
      enumerable: true,
      writable: false,
    });
    creators[key] = creator;
  });

  return {
    definitions,
    types,
    creators,
  };
}
