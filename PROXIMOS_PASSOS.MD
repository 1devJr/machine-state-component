# PROXIMOS PASSOS

## Plano: Selections Contextuais + Guardrails de Tipagem + Performance para Core Grande

Este documento consolida o plano de evolucao da engine para a proxima fase.

## Objetivo

Melhorar a camada de selections para:

1. ficar mais legivel e previsivel para quem desenvolve cores complexos;
2. evitar degradacao de tipo causada por casts amplos;
3. reduzir recomputacao desnecessaria em stores grandes com muitos slices/projections.

## Direcao tecnica aprovada

### 1) Selections contextuais

Evoluir `defineSelections` para receber contexto:

```ts
defineSelections(({ state, computed, helpers }) => ({
  alertarMudanca: computed(() => {
    const input = state.input();
    const filtro = state.filtroAvancado();
    return {
      inputTermo: input?.termo ?? '',
      inputStatus: input?.status ?? 'idle',
      filtro: filtro?.filtro ?? '',
      filtroTermo: filtro?.termo ?? '',
      filtroStatus: filtro?.status ?? 'idle',
    };
  }),
}));
```

- `state`: acesso controlado a `base`, `slices` e `projections`.
- `computed`: API padrao para derivacoes.
- `helpers`: utilitarios sem comportamento temporal.

### 2) Helpers utilitarios (sem temporal)

Implementar helpers focados em legibilidade e composicao:

- `map(source, projector)`
- `withDefault(source, fallback)`
- `combine(recordOfSignals)`
- `equals(left, right, compare?)`
- `pick(source, key)`

Nao implementar helper temporal nesta fase (`debounce`, `notChanged`, etc).

### 3) Guardrails de tipagem

- remover pontos de `Signal<any>` no fluxo de selections;
- evitar casts amplos no caminho `kernel -> artifact -> composed engine`;
- adicionar regras de lint para bloquear `as any`/casts amplos em arquivos criticos da engine.

### 4) Performance para core grande

Segmentar internamente o estado para reduzir invalidacao global:

- sinais por segmento (base, slices, projections);
- manter `facade.state()` como visao agregada;
- manter API de consumo atual para nao piorar DX.

## Escopo de implementacao

1. contratos de tipo (`SelectionContext`, resultado de selections);
2. runtime de selections e helpers;
3. segmentacao interna da store;
4. atualizacao de docs e exemplos;
5. testes de paridade e performance.

## Validacoes obrigatorias

1. `tsc --noEmit` para app e lib;
2. suites existentes da engine e demo-app;
3. testes novos de recomputacao:
   - selection multi-slice so recomputa quando dependencias mudam;
   - alteracao em slice nao relacionado nao recomputa selection alvo.

## Riscos conhecidos e mitigacao

1. **Aumento de complexidade interna**
   - mitigar com testes de paridade no runtime.
2. **Quebra por cast amplo em consumidor**
   - mitigar com lint + docs de boas praticas.
3. **Sobrecarga de sinais**
   - mitigar segmentando apenas onde houver ganho real e medindo recomputacao.

## Criterio de pronto

1. `facade.selections` tipado e legivel para base + slices + projections;
2. estado grande com menos invalidacao cruzada;
3. docs refletindo o fluxo atual da engine sem referencias legadas.
