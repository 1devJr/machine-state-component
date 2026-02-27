# Base Component Engine (Artifact-First)

Nucleo para componentes Angular com estado explicito e composicao por slots.

## Contrato atual

1. `defineCoreKernel(...)` define store, actions, transitions, effects e selections.
2. `createCoreArtifact(kernel, { composition, services? })` conecta kernel com composicao.
3. `createComposedEngine(artifact)` sobe facade + runtime composto.
4. `createFacadeBindings(core)` expõe API curta para o componente Angular.

## Principios

- Escrita de estado apenas por transitions.
- Efeitos colaterais apenas em effects.
- Slots adicionam slices dinamicos na store global.
- Child cores compartilham apenas projection slice no pai.
- Comunicacao entre filhos sempre via actions do pai.

## Estrutura

- `core`: kernel/artifact/composed-engine/facade-bindings.
- `store`: tipos de evento/estado e reducer runtime.
- `effects`: registro e execucao ordenada por prioridade.
- `facade`: commands, selections e registries de runtime.
- `pluggables`: schema de composicao, slots e links pai-filho.
- `devtools`: overlay global opcional para observabilidade.
- `docs`: guias de uso e exemplos da API atual.

## Exemplo rapido

```ts
const kernel = defineCoreKernel({
  id: 'movie-search-core',
  store: defineStore({ initialState }),
  actions: movieActions,
  transitions: createMovieTransitions(),
  effects: createMovieEffects(),
  selections: createMovieSelections(),
});

const artifact = createCoreArtifact(kernel, {
  composition: ({ parentPort }) => createComposition(schema, { parentPort }).withSlot('input', InputPluggableComponent, { placeholder: 'Buscar' }).build(),
});

const core = createComposedEngine(artifact);
const bindings = createFacadeBindings(core);
```
