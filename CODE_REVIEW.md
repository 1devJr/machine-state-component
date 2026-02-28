# Code Review — Engine (`libs/ui-state/src/lib/engine`)

> **Revisão focada exclusivamente na engine de state management "artifact-first".**
> Branch: `feat/poc-structure`
> Escopo: `libs/ui-state/src/lib/engine/` (core, facade, pluggables, effects, store, registries, editor, devtools)

---

## Índice

1. [O que está BOM ✅](#o-que-está-bom-)
2. [O que pode MELHORAR 🟡](#o-que-pode-melhorar-)
3. [O que está RUIM 🔴](#o-que-está-ruim-)
4. [Resumo por Módulo](#resumo-por-módulo)
5. [Cobertura de Testes da Engine](#cobertura-de-testes-da-engine)
6. [Ações Prioritárias](#ações-prioritárias)

---

## O que está BOM ✅

### 1. Arquitetura geral — muito bem pensada

A separação de responsabilidades é clara e coerente:

- **`core/`** — orquestração de artifacts e composição (kernel → artifact → engine)
- **`facade/`** — API única para os consumidores interagirem com a engine
- **`pluggables/`** — sistema de slots e composição tipada de componentes
- **`effects/`** — efeitos colaterais desacoplados do estado
- **`store/`** — reducer puro baseado em signals do Angular
- **`registries/`** — registros modulares para hooks, effects, slices, transitions
- **`editor/`** — abstração reutilizável de edição com draft/save/cancel
- **`devtools/`** — inspector e overlay para observabilidade

Cada módulo tem sua pasta, seus tipos, seus exports. O `index.ts` de cada um controla a superfície pública. Isso facilita muito a manutenção.

### 2. Reducer baseado em Signals — elegante e idiomático

```typescript
// engine.reducer.ts
const state = signal<TState>(initialState);

const dispatch = (event: TEvent) => {
  const current = state();
  hookRegistry.runBefore(current, event);
  const transition = transitionRegistry.resolve(current, event);
  const nextState = transition ? transition(current, event) : current;
  state.set(nextState);
  hookRegistry.runAfter(nextState, event);
};
```

Usar `signal()` do Angular diretamente como store é simples, performático e totalmente integrado com o change detection. Sem overhead de bibliotecas externas como NgRx. O dispatch é síncrono e previsível.

### 3. Sistema de composição tipada (CompositionBuilder)

O `TypedCompositionBuilder` é a peça mais sofisticada da engine e funciona muito bem:

- **Required/optional slots com verificação em compile-time** — o `build()` só compila se todos os slots obrigatórios foram preenchidos (usando o trick do `this: never`)
- **Schema tipado** — `defineCompositionSchema({ input: requiredSlot<Config>() })` dá autocomplete e type-check
- **Conexão parent↔child** — `connectChild()` com links tipados entre portas de ações
- **Projeção de estado** — estado do child é projetado como slice no parent automaticamente

Exemplo do pattern de conexão:
```typescript
.connectChild('history', ({ parent, child, link }) => ({
  parentToChild: [link(parent.actions.historyRecorded, child.actions.ingestSearch)],
  childToParent: [],
  projection: { sliceKey: 'historyProjection', initialState: {...}, select: (s) => ({...}) },
}))
```

É type-safe, explícito e composicional. Muito bom design.

### 4. Action Catalog — pattern factory limpo

```typescript
// action-catalog.ts
const creator = ((...args) => ({ type: definition.type, ...payloadFactory(...args) }));
Object.defineProperty(creator, 'actionType', { value: definition.type, writable: false });
```

Cada action creator carrega o `actionType` como property imutável. Isso permite que transições e efeitos façam matching por tipo sem strings mágicas soltas. O `defineActionCatalog()` produz `types` e `creators` de uma vez, mantendo tudo sincronizado.

### 5. Transições imutáveis + padrão chain

O `TransitionChainRuntime` permite definir transições de forma fluent:

```typescript
chainTransitions<State, Status, Actions>(actions)
  .on('idle', actions.submit, (state) => ({ ...state, status: 'loading' }))
  .on('loading', actions.success, (state, event) => ({ ...state, results: event.results, status: 'ready' }))
  .globalOn(actions.reset, () => createInitialState())
  .done()
```

Todas as transições usam spread operator — sem mutação. A distinção entre transições por status e globais é clara.

### 6. Sistema de registries — desacoplado e extensível

Os quatro registries (`effect`, `hook`, `slice`, `transition`) seguem o mesmo padrão:
- Retornam uma função de cleanup quando algo é registrado
- Permitem registro dinâmico (pluggables podem adicionar transições/efeitos em runtime)
- São independentes entre si

O `transition.registry` permite que slots de pluggables adicionem suas próprias transições ao estado existente — isso é poderoso para extensibilidade.

### 7. Editor abstrato — reutilizável

`createEditorTransitions()` + `EditorSlice<TDraft>` + `EditorSelections` formam um pacote completo para qualquer feature que precise de edição inline:
- Abre draft baseado no estado atual
- Track dirty state
- Save aplica draft ao estado, cancel descarta
- Transições são globais (funcionam em qualquer status)

### 8. Devtools — inspector + overlay com boa observabilidade

O sistema de devtools é surpreendentemente completo para uma POC:
- **Inspector** registra hooks antes/depois de cada transição e mantém log de actions + transitions
- **Overlay** é um componente Angular standalone com painel lateral configurável
- **Manager** conecta facades ao inspector com snapshot de selections
- **Estado** é reativo via signals, com truncation de histórico

### 9. Testes existentes — bons cenários cobertos

Os testes da engine cobrem cenários não-triviais:
- `composed-engine.spec.ts` — composição com child, projeção de estado, e cleanup
- `engine.facade.spec.ts` — dispatch, transitions por status, efeitos com prioridade e `when` guards
- `composition.builder.spec.ts` — slots tipados, extensão, conexões child, e runtime enable/disable
- `editor.types.spec.ts` — lifecycle completo open→update→save/cancel
- `devtools.state.spec.ts` — truncation de histórico e API pública

### 10. Slot Directive — lifecycle management correto

A `EngineSlotDirective` gerencia corretamente:
- Registro de slices, transições, efeitos e módulos quando um pluggable é montado
- Cleanup de tudo quando o pluggable é desmontado ou substituído
- Reuso do componente quando só a config muda (sem destruir/recriar)
- Injeção de contexto (`ENGINE_PLUGGABLE_CONTEXT`) para cada pluggable

---

## O que pode MELHORAR 🟡

### 1. Hooks disparam para eventos sem transição registrada

**Arquivo:** `engine.reducer.ts`

```typescript
const transition = transitionRegistry.resolve(current, event);
const nextState = transition ? transition(current, event) : current;
state.set(nextState);
hookRegistry.runAfter(nextState, event); // roda SEMPRE, mesmo sem transição
```

Se nenhuma transição existe para aquele evento naquele status, o estado não muda, mas `runAfter` **é chamado mesmo assim**. Isso significa que **efeitos registrados para aquele event type vão executar** mesmo que o estado não tenha mudado. Pode ser intencional (efeitos "fire regardless"), mas é contra-intuitivo e deveria ser documentado ou ter um flag de controle.

**Sugestão:** Adicionar opção `runAfterOnNoTransition: boolean` no config, ou documentar explicitamente esse comportamento.

### 2. `reset()` não dispara hooks — inconsistência

**Arquivo:** `engine.reducer.ts`

```typescript
reset(nextState) {
  state.set(nextState ?? initialState); // sem runBefore/runAfter
}
```

`dispatch()` executa `runBefore` → transição → `set` → `runAfter`. Mas `reset()` faz direto `set()`. Isso significa que mudanças via `registerSlice`, `setSliceState`, `unregisterSlice` (que usam `reset`) **não trigam efeitos**. Para o consumidor, é difícil saber quais mudanças de estado disparam efeitos e quais não.

**Sugestão:** Criar `resetWithHooks()` ou documentar claramente no JSDoc do `reset()` que hooks são bypassados intencionalmente.

### 3. `#buildConnectionRuntime` muito longo (~95 linhas)

**Arquivo:** `composition.builder.ts`

Esse método privado do `TypedCompositionBuilder` faz tudo: valida ports, cria subscriptions de links, registra slices de projeção, gerencia cleanup arrays, e expõe enable/disable/enableAll/disableAll.

São muitas responsabilidades num único método. Se uma projeção falhar, o cleanup parcial precisa ser gerenciado manualmente dentro de arrays. Alta complexidade ciclomática.

**Sugestão:** Extrair para uma classe `ConnectionRuntime` dedicada com lifecycle próprio.

### 4. `component.name` para gerar IDs

**Arquivo:** `composition.builder.ts`

```typescript
options?.id ?? `${String(slot)}-${component.name}`
```

Após minificação em build de produção, `component.name` vira `a`, `t`, etc. Se dois pluggables diferentes são montados no mesmo slot em momentos diferentes, podem gerar o mesmo ID, causando colisões silenciosas.

**Sugestão:** Sempre exigir `id` explícito, ou gerar um UUID. O `component.name` pode ficar como fallback apenas em dev mode.

### 5. `destroy()` do `ComposedEngineResult` incompleto

**Arquivo:** `composed-engine.ts`

```typescript
const destroy = () => {
  composition.connectionRuntime?.disableAll();
  effectsCleanup();
  baseFacade.destroy();
};
```

Após `destroy()`, as referências `facade`, `actions`, `selections`, `connectionPort`, e `composition` continuam vivas no objeto retornado. Se algum consumidor mantém referência ao `ComposedEngineResult`, ele pode continuar chamando `actions.submit()` ou lendo `selections.query()` — ambos vão operar sobre um facade destruído sem aviso.

**Sugestão:** Adicionar flag `#destroyed` e fazer no-op/throw em chamadas após destroy.

### 6. Hook e slice registries sem isolamento de erros

**Arquivo:** `hook.registry.ts`

```typescript
runAfter(state, event) {
  for (const hook of hooks) {
    hook.onAfterTransition?.(state, event); // se lançar exceção, para aqui
  }
}
```

Se um hook lança exceção, os hooks seguintes não executam. O mesmo vale para `effect.registry.ts` que faz `effects.push(...)` e `effects.splice(idx, 1)` — se `splice` é chamado durante iteração (um hook remove outro), pode pular elementos.

**Sugestão:** `try/catch` individual por hook, e snapshot do array antes de iterar (`[...hooks].forEach`).

### 7. Slice registry lança exceção em registro duplicado sem escape

**Arquivo:** `slice.registry.ts`

```typescript
if (registrations.has(slice.key)) {
  throw new Error(`Slice "${slice.key}" is already registered.`);
}
```

Em cenários de HMR (Hot Module Replacement) ou re-montagem de componentes, o mesmo slice pode ser registrado duas vezes. Sem flag de idempotência, a engine crash.

**Sugestão:** Permitir re-registro silencioso ou adicionar opção `{ allowReplace: true }`.

### 8. `PluggableBase.state` sempre retorna `Signal<TState | undefined>`

**Arquivo:** `pluggable.base.ts`

```typescript
readonly state: Signal<TState | undefined> = computed(() => this.context?.state());
```

Mesmo quando o pluggable está dentro de uma engine (tem contexto), `state()` retorna `TState | undefined`. Todo pluggable concreto precisa fazer `this.state()?.results` com optional chaining. É verbose e esconde o fato de que, dentro de um slot, o contexto **sempre** existe.

**Sugestão:** Criar `assertedState(): Signal<TState>` que lança erro se contexto é null, ou usar `input.required` para o contexto.

### 9. Transition registry usa modelo stack implícito

**Arquivo:** `transition.registry.ts`

```typescript
register(registration) {
  const previousTransitions = transitions;      // snapshot
  const previousGlobalTransitions = globalTransitions;
  // ... merge registration ...
  return () => {
    transitions = previousTransitions;           // restaura snapshot
    globalTransitions = previousGlobalTransitions;
  };
}
```

Se registros A, B, C acontecem nessa ordem e B é removido, as transições voltam para o estado antes de B — mas C's transições são **perdidas**. É um modelo stack (LIFO) mas não está documentado. Se a ordem de cleanup não for LIFO, transições podem sumir silenciosamente.

**Sugestão:** Documentar que cleanup deve ser feito em ordem LIFO, ou usar modelo de merge que remove apenas as transições registradas (não restaura snapshot).

### 10. `devtools.state.ts` não verifica flag `enable`

**Arquivo:** `devtools.state.ts`

```typescript
logTransition(event: TEvent, prevState: TState, nextState: TState): void {
  const entry = createEngineLogEntry(event, prevState, nextState);
  this.#entries.update(entries => truncateEngineHistory([...entries, entry], this.config.maxHistory));
  logEngineTransition(entry, this.config, this.instanceName);
}
```

O `logger` verifica `config.display`, mas `logTransition` **não verifica `config.enable`**. Mesmo com `enable: false`, o log de entradas continua sendo acumulado no signal `#entries` e o `logEngineTransition` é chamado (que no caso de `display: 'console'` vai logar no console).

**Sugestão:** Adicionar `if (!this.config.enable) return;` no início de `logTransition`.

### 11. Devtools overlay sem `ChangeDetectionStrategy.OnPush`

**Arquivo:** `devtools-overlay.component.ts`

O componente usa `signal()` e `computed()` para estado local, mas **não tem `changeDetection: ChangeDetectionStrategy.OnPush`**. Isso significa que ele re-renderiza em cada ciclo de change detection, não apenas quando inputs mudam.

**Sugestão:** Adicionar `changeDetection: ChangeDetectionStrategy.OnPush` ao decorator `@Component`.

### 12. `EditorActions` — dois padrões de dispatch competindo

**Arquivos:** `editor.actions.ts` e `action-catalog.ts`

A engine tem dois mecanismos para disparar ações:
- **`ActionCatalog`** com `defineActionCatalog()` — produz creators tipados com `actionType`
- **`EditorActions` class** — classe com métodos que fazem `dispatch({ type: 'editor/open' } as TEvent)`

São padrões diferentes para o mesmo fim. O `EditorActions` usa casts perigosos (`as TEvent`) que bypassam type safety, enquanto o `ActionCatalog` é type-safe por design.

**Sugestão:** Migrar o editor para usar `ActionCatalog` exclusivamente, eliminando a classe `EditorActions`.

### 13. `JSON.parse(JSON.stringify())` para deep clone

**Arquivos:** `engine.facade.ts`, `editor.types.ts`

```typescript
// facade - getStateSnapshot
if (typeof structuredClone === 'function') {
  return structuredClone(currentState);
}
return JSON.parse(JSON.stringify(currentState)) as TState;

// editor - createEditorTransitions
const baseDraft = state.config
  ? (JSON.parse(JSON.stringify(state.config)) as TDraft)
  : createDefaultDraft();
```

O fallback `JSON.parse(JSON.stringify())` **perde** valores `undefined`, objetos `Date`, `Map`, `Set`, funções e referências circulares silenciosamente. Na facade pelo menos tem o fallback com `structuredClone`, mas no editor não.

**Sugestão:** Usar `structuredClone()` em ambos os lugares (é suportado em todos os browsers modernos e Node 17+).

### 14. `updateProjection()` roda em cada evento do child

**Arquivo:** `composition.builder.ts`

```typescript
cleanups.push(childPort.subscribe(() => updateProjection()));
```

A cada evento do child, `updateProjection()` recalcula a projeção e chama `parentPort.setSliceState()` que por sua vez chama `store.reset()`. Se o child dispara muitos eventos e a projeção não muda, estamos fazendo re-renders desnecessários no parent.

**Sugestão:** Adicionar deep-equal check antes de `setSliceState`, ou usar `Object.is` no nível do objeto projetado.

### 15. Devtools overlay — `track` expression fraca

**Arquivo:** `devtools-overlay.component.ts`

```html
@for (item of section.items; track item.title + item.meta) {
```

Concatenar `title + meta` como chave de tracking é frágil. Se dois itens têm o mesmo title+meta (ex: duas ações iguais no mesmo timestamp), o Angular não consegue diferenciar e pode ter rendering incorreto.

**Sugestão:** Usar `$index` ou adicionar um `id` único a cada item.

---

## O que está RUIM 🔴

### 1. `Signal<any>` na API pública do kernel

**Arquivo:** `core-kernel.ts`

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */

export function defineSelections<TSelections extends Record<string, unknown>>(
  selections: (state: Signal<any>) => TSelections,
): (state: Signal<any>) => TSelections {
  return selections;
}
```

O `Signal<any>` destrói completamente a type safety das selections. Quando o consumidor escreve:

```typescript
defineSelections((state) => ({
  query: computed(() => state().querrry), // typo — NÃO dá erro!
}))
```

O compilador aceita qualquer acesso sem reclamar. Isso anula todo o trabalho de tipagem feito nos types. O `eslint-disable` no topo do arquivo confirma que é uma decisão consciente, mas é a pior trade-off possível — sacrificar safety no ponto mais usado da API.

**Correção:** Adicionar generic parameter:
```typescript
export function defineSelections<TState, TSelections extends Record<string, unknown>>(
  selections: (state: Signal<TState>) => TSelections,
): (state: Signal<TState>) => TSelections {
  return selections;
}
```

### 2. Double casts `as unknown as` em código de produção

**Arquivos:** `composed-engine.ts`, `slot.directive.ts`, `composition.builder.ts`, `engine.facade.ts`, `editor.actions.ts`

São 6+ ocorrências de double casts que "mentem" para o type system:

```typescript
// composed-engine.ts — facade com tipo errado
const facade = baseFacade as unknown as EngineFacade<
  CompositionState<TState, TComposition>, TStatus, EventFromActions<TActions>, TServices
>;
```

O `baseFacade` foi criado com `TState`, não com `CompositionState<TState, TComposition>`. O signal interno ainda aponta para `TState`. O cast diz ao TypeScript que é `CompositionState`, mas em runtime o signal pode não ter as propriedades de composição até os slices serem registrados. **É uma mentira ao type system.**

```typescript
// slot.directive.ts — component cast perigoso
const artifacts = (
  pluggable.component as unknown as PluggableWithArtifacts<TState, TStatus, TEvent, TServices>
).storeArtifacts;
```

Se o componente não tem `storeArtifacts`, o resultado é `undefined`. O cast implica que É um `PluggableWithArtifacts` quando pode não ser.

```typescript
// engine.facade.ts — event cast para never
subscribe: (listener) => this.subscribeEvents((event) => listener(event as never))
```

`as never` é o cast mais perigoso possível — qualquer tipo satisfaz `never`. O listener do child pode esperar um evento com shape específico e receber algo completamente diferente.

```typescript
// editor.actions.ts — objeto cru cast como TEvent
this.commands.dispatch({ type: 'editor/open' } as TEvent);
```

Se `TEvent` requerer campos além de `type`, esse cast produz um evento inválido em runtime.

**Correção:** Criar funções de normalização/assertion em vez de casts. Exemplo:
```typescript
function assertCompositionFacade<TState, TComposition>(
  facade: EngineFacade<TState, ...>
): asserts facade is EngineFacade<CompositionState<TState, TComposition>, ...> {
  // Pode ser no-op em produção, mas documenta a intenção
}
```

### 3. Efeitos assíncronos fire-and-forget

**Arquivo:** `engine-effects.runtime.ts`

```typescript
const result = effect.handler(state, effectEvent, context);
if (result instanceof Promise) {
  void result.catch((error) => {
    console.error(`[EngineEffectsRuntime] Effect "${effect.id}" failed`, error);
  });
}
```

Problemas graves:
1. **`console.error` é o único tratamento** — o consumidor não tem como saber que um efeito falhou
2. **Race conditions** — se dois efeitos assíncronos para o mesmo evento fazem dispatch, a ordem é indeterminada
3. **Estado stale** — dentro do handler async, `getState()` pode retornar estado diferente do que era quando o efeito começou
4. **Sem cancelamento** — se a engine é destruída enquanto um efeito async está rodando, o dispatch do handler vai para um facade destruído

**Correção:** Implementar:
- Um `onEffectError` callback no config da facade
- `AbortController`/`DestroyRef` para cancelamento
- Ou, no mínimo, guardar as Promises e expor `awaitPendingEffects()`

### 4. `createConnectionLink.map` — dual-behavior perigoso

**Arquivo:** `composition.builder.ts`

```typescript
return {
  source, target, sourceType, targetType,
  map: ((input: unknown) => {
    if (typeof input === 'function') {
      return new ResolvedConnectionLink(source, target, input as ...);
    }
    // quando input é um evento, extrai payload
    const payload = { ...(input as Record<string, unknown>) };
    delete payload['type'];
    return payload;
  }) as unknown,  // <-- double cast para unknown!
} as unknown as ConnectionLink<...>;  // <-- outro double cast!
```

Uma única propriedade `map` tem **dois comportamentos completamente diferentes**:
- Se recebe uma **função**, retorna um `ResolvedConnectionLink` (builder pattern)
- Se recebe um **evento**, retorna o payload (transformer pattern)

Isso requer dois `as unknown` casts para funcionar e a assinatura de tipo no `ConnectionLink` esconde essa dualidade. Para quem lê o código ou usa a API, é impossível saber qual comportamento esperar sem ler a implementação.

**Correção:** Separar em métodos explícitos:
```typescript
interface ConnectionLink<S, T> {
  resolved: ConnectionLinkResolved<S, T>; // quando payloads são compatíveis
  mapWith(fn: (event: ...) => ...): ConnectionLinkResolved<S, T>; // quando precisam transformação
}
```

### 5. `window.engineDevTools` exposto globalmente sem proteção

**Arquivo:** `devtools.registry.ts`

```typescript
const instances = new Map<string, EngineDevToolsAPI>(); // singleton de módulo

export function setupGlobalEngineDevTools(): void {
  if (typeof window === 'undefined') return;
  const target = window as unknown as { engineDevTools?: EngineDevToolsGlobal };
  if (!target.engineDevTools) {
    target.engineDevTools = globalDevTools;
  }
}
```

Dois problemas:
1. **Segurança** — `window.engineDevTools` é acessível por qualquer script na página (XSS, extensões, third-party scripts). As funções `clearHistory()` e `exportHistory()` podem vazar dados do estado da aplicação ou manipular o estado de debug.
2. **Singleton de módulo** — `const instances = new Map()` é um singleton no escopo do módulo. Em cenários de SSR ou testes com múltiplos `TestBed.resetTestingModule()`, essa Map persiste entre instâncias da aplicação, causando vazamento de estado.

**Correção:**
```typescript
import { isDevMode } from '@angular/core';

export function setupGlobalEngineDevTools(): void {
  if (typeof window === 'undefined' || !isDevMode()) return;
  // ...
}
```

E mover o `instances` Map para dentro de um Injectable Angular para respeitar o lifecycle da aplicação.

### 6. `effects.filter().sort()` em cada dispatch — O(n log n) desnecessário

**Arquivo:** `engine-effects.runtime.ts`

```typescript
execute(state, event, dispatch, getState): void {
  const effects = this.effectRegistry
    .listByEvent(event.type)
    .filter(effect => !effect.when || effect.when(state, effectEvent))
    .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
  // ...
}
```

A cada `dispatch`, a engine:
1. Filtra efeitos por event type — O(n)
2. Filtra por `when` guard — O(n)
3. Ordena por prioridade — O(n log n)

Para uma aplicação com muitos efeitos registrados e dispatches frequentes, isso é trabalho desnecessário. A lista de efeitos por event type raramente muda (só quando pluggables são montados/desmontados).

**Correção:** Pré-indexar efeitos por event type no registro (Map<eventType, effect[]>), e pré-ordenar por prioridade no momento do registro.

---

## Resumo por Módulo

| Módulo | Veredicto | Destaques |
|--------|-----------|-----------|
| **core/** | ⭐⭐⭐⭐ Bom | Boa orquestração, mas double casts no `composed-engine.ts` e `Signal<any>` no kernel |
| **facade/** | ⭐⭐⭐ Razoável | API completa, mas `event as never` no connection port, `reset` sem hooks, destroy incompleto |
| **pluggables/** | ⭐⭐⭐⭐ Muito bom | CompositionBuilder é excelente, mas `map` dual-behavior e `#buildConnectionRuntime` longo |
| **effects/** | ⭐⭐ Fraco | Fire-and-forget sem error handling, sort por dispatch, sem cancelamento |
| **store/** | ⭐⭐⭐⭐⭐ Excelente | `createEngineStore` é simples, correto e elegante. `ActionCatalog` limpo |
| **registries/** | ⭐⭐⭐ Razoável | Sem error isolation em hooks, model stack implícito em transitions, throw em duplicatas |
| **editor/** | ⭐⭐⭐ Razoável | Conceito bom, mas `EditorActions` compete com `ActionCatalog`, casts `as TEvent` perigosos |
| **devtools/** | ⭐⭐⭐⭐ Bom | Feature completa, mas `window` exposto, overlay sem OnPush, `enable` flag não verificado |

---

## Cobertura de Testes da Engine

### Com testes ✅
| Arquivo | Testes | Qualidade |
|---------|--------|-----------|
| `composed-engine.ts` | 2 testes (composição + erro de slice duplicado) | Boa — cobre happy path e error path |
| `engine.facade.ts` | 2 testes extensos (dispatch/transitions, slices/effects com prioridade) | Muito boa — cenários complexos |
| `composition.builder.ts` | 4 testes (slots, extensão, child connections, runtime enable/disable) | Muito boa |
| `editor.types.ts` | 2 testes (open→update→save, open→update→cancel) | Boa — lifecycle completo |
| `devtools.state.ts` | 2 testes (truncation + API pública) | Razoável |

### Sem testes ❌
| Arquivo | Risco | Motivo |
|---------|-------|--------|
| **`slot.directive.ts`** | 🔴 Alto | Lógica complexa de lifecycle (registra slices, transitions, effects, cleanup) — é o ponto de integração mais crítico |
| **`engine-effects.runtime.ts`** | 🔴 Alto | Comportamento async, error handling, prioridade — precisa de testes com Promises |
| **`hook.registry.ts`** | 🟡 Médio | Mutation during iteration, error propagation |
| **`transition.registry.ts`** | 🟡 Médio | Stack-based unregister, merge behavior |
| **`pluggable.base.ts`** | 🟡 Médio | Context null handling, mergedConfig shallow merge |
| **`devtools-inspector.ts`** | 🟡 Médio | Hook attachment, log truncation, render payload |
| **`devtools-overlay.component.ts`** | 🟢 Baixo | Componente de UI, menos crítico |
| **`devtools-overlay.service.ts`** | 🟡 Médio | Dynamic component creation, SSR guard |

### Gaps nos testes existentes
- `engine.facade.spec.ts` — não testa `unregisterSlice`, nem `dispatchMany([])` vazio, nem efeito que lança exceção
- `composition.builder.spec.ts` — não testa `optionalSlot` não preenchido, nem `connectChild` sem `withChildCore` prévio
- `devtools.state.spec.ts` — não testa `enable: false` config

---

## Ações Prioritárias

Por ordem de impacto e facilidade de correção:

| # | Ação | Severidade | Esforço |
|---|------|------------|---------|
| 1 | Substituir `Signal<any>` por `Signal<TState>` em `defineSelections` | 🔴 Crítico | Baixo |
| 2 | Adicionar `isDevMode()` guard em `setupGlobalEngineDevTools` | 🔴 Crítico | Mínimo |
| 3 | Adicionar error handler customizável ao `EngineEffectsRuntime` | 🔴 Crítico | Médio |
| 4 | Separar dual-behavior do `createConnectionLink.map` em métodos distintos | 🔴 Crítico | Médio |
| 5 | Usar `structuredClone()` em vez de `JSON.parse(JSON.stringify())` no editor | 🟡 Médio | Mínimo |
| 6 | Adicionar `try/catch` individual em `hook.registry.runBefore/runAfter` | 🟡 Médio | Baixo |
| 7 | Documentar/resolver o modelo stack do `transition.registry` | 🟡 Médio | Baixo |
| 8 | Adicionar `ChangeDetectionStrategy.OnPush` no devtools overlay | 🟡 Médio | Mínimo |
| 9 | Verificar `config.enable` em `devtools.state.logTransition` | 🟡 Médio | Mínimo |
| 10 | Pré-indexar efeitos por event type para evitar sort por dispatch | 🟡 Médio | Médio |
| 11 | Adicionar testes para `slot.directive.ts` e `engine-effects.runtime.ts` | 🟡 Médio | Médio |
| 12 | Extrair `#buildConnectionRuntime` para classe `ConnectionRuntime` | 🟡 Médio | Médio |
| 13 | Eliminar double casts `as unknown as` com assertion functions | 🔴 Crítico | Alto |
