# Slices e Store Global

## Objetivo

Permitir que cada slot (ou child core projetado) adicione estado no pai sem acoplamento direto entre componentes.

## Slot slices

`withSlot(..., { sliceInitialState })` cria um slice com chave igual ao nome do slot.

Exemplo:

```ts
.withSlot('details', MovieSearchDetailsPluggableComponent, { emptyMessage: '...' }, {
  sliceInitialState: {
    activeTab: 'overview',
    density: 'comfortable',
  },
})
```

Nesse caso, `facade.state().details` fica disponivel com IntelliSense.

## Projection slices

`connectChild(...projection...)` projeta parte do estado do child core no pai.

Sem `sliceKey`, a chave e derivada automaticamente como `${slotName}Projection`.

Exemplo:

```ts
.connectChild('history', ({ parent, child, link }) => ({
  parentToChild: [link(parent.actions.historyRecorded, child.actions.ingestSearch)],
  projection: {
    initialState: { totalSearches: 0, latestTerm: null as string | null },
    select: (childState) => ({
      totalSearches: childState.totalSearches,
      latestTerm: childState.recentTerms[0] ?? null,
    }),
  },
}))
```

Nesse caso, `facade.state().historyProjection` fica disponivel no pai.

## Ciclo de vida

1. `EngineSlotDirective` monta o slot e registra slice/configuracoes.
2. runtime de composicao ativa conexoes de child core.
3. projection atualiza via `setSliceState` conforme eventos do child.
4. no unmount, slice/projection sao removidos da store.

## Referencias

- Runtime de slot: `libs/ui-state/src/lib/engine/pluggables/slot.directive.ts`
- Runtime de conexao/projection: `libs/ui-state/src/lib/engine/pluggables/composition.builder.ts`
- API de registro no facade: `libs/ui-state/src/lib/engine/facade/engine.facade.ts`
- Exemplo real: `apps/demo-app/src/app/movie-search/store/movie-search.artifact.ts`
