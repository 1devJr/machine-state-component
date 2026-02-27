# Transitions

## Objetivo

Transitions sao a unica camada autorizada a alterar estado.

## API implementada

A DSL atual usa `defineKernelTransitions` + `chain()`:

```ts
transitions: defineKernelTransitions<MyState>()(
  myActions,
  ({ chain, actions }) =>
    chain()
      .globalOn(actions.loaded, (state, event) => ({ ...state, data: event.data }))
      .done(),
),
```

Referencias:

- DSL: `libs/ui-state/src/lib/engine/core/core-artifact.ts`
- Registry: `libs/ui-state/src/lib/engine/registries/transition.registry.ts`
- Exemplo real: `apps/demo-app/src/app/movie-search/store/movie-search.transitions.ts`

## Modelo mental

- `on(status, action, handler)`: transition por status.
- `globalOn(action, handler)`: transition global.
- `done()`: materializa tabela de transitions.

## Regras

1. transition deve ser pura;
2. sem chamada de API;
3. sem efeitos colaterais;
4. sem mutacao in-place.

## Checklist

- [ ] todo evento relevante tem transition correspondente;
- [ ] transitions usam action creators tipados;
- [ ] reset retorna estado consistente.
