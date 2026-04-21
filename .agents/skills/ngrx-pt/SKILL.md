---
name: ngrx-pt
description: Guia em portugues para NgRx no Angular, cobrindo Store classico, Effects, Entity, ComponentStore e SignalStore com @ngrx/signals. Use quando a tarefa envolver reducers, actions, selectors, provideStore, provideEffects, ComponentStore, signalStore, withState, withComputed, withMethods, withEntities, rxMethod, ou criacao e revisao de arquivos *-store.ts e *-store.spec.ts. Nao use para estado local simples com signal() puro; nesses casos use a skill angular-signals.
---

# NgRx em Portugues

Skill guarda-chuva para tarefas com NgRx no Angular. Ela cobre quatro frentes:

- Store classico com `@ngrx/store`, `@ngrx/effects` e `@ngrx/entity`
- `ComponentStore` para escopo local ou de feature
- `SignalStore` com `@ngrx/signals` e `@ngrx/signals/entities`
- Testes e fluxo CRUD de stores baseadas em signals

## Matriz de decisao

| Opcao            | Quando usar                                                                         | Evite quando                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `signal()` puro  | Estado local, curto e sem compartilhamento real                                     | A feature precisa de API propria, CRUD, entidades ou regras assincronas consistentes |
| `ComponentStore` | Escopo isolado com menos cerimonia que store global                                 | Ha eventos globais, devtools, reducers ou integracao forte com actions               |
| NgRx classico    | Eventos globais, effects, reducers, devtools e feature state duravel                | A feature pode ser resolvida melhor com composicao baseada em signals                |
| `SignalStore`    | Estado de feature, composicao moderna, `rxMethod`, entidades e API publica de store | O estado e apenas local ao component e cabe bem em `signal()` puro                   |

## Quando usar cada abordagem

- Use NgRx classico para `actions`, `reducers`, `selectors`, `effects`, `provideStore`, `provideEffects` e `Entity`.
- Use `ComponentStore` quando quiser isolamento, API local e menos overhead do que store global.
- Use `SignalStore` para stores modernas com `withState`, `withComputed`, `withMethods`, `withEntities`, `rxMethod` e testes de `*-store.spec.ts`.
- Se o pedido for apenas estado local simples com Angular signals, use `angular-signals` em vez desta skill.

## Regras globais

- Modele o estado ao redor das necessidades da feature, nao ao redor da API.
- Prefira tipagem explicita, defaults significativos e atualizacoes imutaveis.
- Mantenha leitura reativa no component e regra de negocio dentro da store.
- Effects, `rxMethod` e chamadas de service cuidam de IO; derivacoes ficam em selectors, `computed` ou `withComputed`.
- Escolha a ferramenta mais simples que resolva o problema sem perder clareza operacional.

## Fluxo rapido por abordagem

### NgRx classico

1. Defina actions com `createActionGroup`.
2. Modele reducer e selectors com `createFeature`.
3. Coloque IO em `Effects`.
4. Exponha estado no component com `selectSignal()`.

### ComponentStore

1. Defina estado inicial pequeno e orientado a uso.
2. Exponha leituras com `selectSignal()`.
3. Centralize comandos e efeitos da feature na store.

### SignalStore

1. Defina interface de estado e `initialState`.
2. Adicione `withEntities` quando houver colecao.
3. Modele derivacoes com `withComputed`.
4. Modele comandos com `withMethods`.
5. Use `rxMethod` para servicos baseados em `Observable`.
6. Teste estado inicial, computeds, sucesso, erro e concorrencia relevante.

## Referencias detalhadas

- [`references/ngrx-classico.md`](references/ngrx-classico.md): Store classico, Effects, Entity, `selectSignal()`, DevTools e `ComponentStore`.
- [`references/ngrx-signal-store.md`](references/ngrx-signal-store.md): arquitetura, composicao e boas praticas de `SignalStore`.
- [`references/ngrx-signal-store-testes.md`](references/ngrx-signal-store-testes.md): padroes de teste para stores baseadas em signals.
- [`references/ngrx-signal-store-crud.md`](references/ngrx-signal-store-crud.md): guia prescritivo para criar uma Signal Store completa com CRUD.

## Antipadroes de escolha

- Usar store global para estado puramente local de UI.
- Introduzir `SignalStore` quando `signal()` puro resolveria com menos custo cognitivo.
- Forcar NgRx classico em uma feature que so precisa de composicao local com signals.
- Espalhar regras de loading, erro e selecao entre component, service e store sem uma API clara.
