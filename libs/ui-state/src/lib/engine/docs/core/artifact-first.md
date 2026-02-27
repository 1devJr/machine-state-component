# Artifact-First (V3 2-Phase)

A API V3 usa fluxo em duas etapas:

1. `defineCoreKernel(...)`
2. `createCoreArtifact(kernel, { composition, services? })`

## Fluxo recomendado

1. Defina `store`, `actions`, `transitions`, `effects` e `selections` no kernel.
2. Exponha `PluggableBase` a partir do kernel.
3. Crie o artifact com `createCoreArtifact(...)` e declare a `composition`.
4. Suba o core com `createComposedEngine(artifact)`.
5. Leia estado composto em `core.facade.state()` (base + slot slices + projections).

## Exemplo minimo

```ts
const movieKernel = defineCoreKernel({
  id: 'movie-search-core',
  store: defineStore({ initialState }),
  actions: movieActions,
  transitions: defineKernelTransitions<MovieState>()(movieActions, ({ chain, actions }) =>
    chain()
      .globalOn(actions.queryChanged, (state, event) => ({ ...state, query: event.query }))
      .done(),
  ),
  effects: defineKernelEffects<MovieState>()(movieActions, () => []),
  selections: defineSelections((state) => ({ query: () => state().query })),
});

const artifact = createCoreArtifact(movieKernel, {
  composition: (ctx) =>
    createComposition(schema, { parentPort: ctx.parentPort })
      .withSlot(
        'input',
        InputComponent,
        { placeholder: 'Buscar' },
        {
          sliceInitialState: { lastSubmittedTerm: null },
        },
      )
      .build(),
});

const core = createComposedEngine(artifact);
```

## Child core + projection

- `createChildComposedEngine(historyKernel, { composition })`
- `withChildCore('history', historyCore.connectionPort)`
- `connectChild('history', ({ parent, child, link }) => ({ projection: { initialState, select } }))`

Se `sliceKey` não for informado na projection, a engine usa `${slotName}Projection`.

## Referencia de implementacao

- `apps/demo-app/src/app/movie-search/store/movie-search.kernel.ts`
- `apps/demo-app/src/app/movie-search/store/movie-search.artifact.ts`
- `apps/demo-app/src/app/movie-search/history-core/store/history.kernel.ts`
- `apps/demo-app/src/app/movie-search/history-core/history-core.artifact.ts`
- `libs/ui-state/src/lib/engine/core/core-kernel.ts`
- `libs/ui-state/src/lib/engine/core/core-artifact.ts`
