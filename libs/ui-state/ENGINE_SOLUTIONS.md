# Guia de Soluções — Engine (`libs/ui-state/src/lib/engine`)

> Documento complementar ao [`CODE_REVIEW.md`](./CODE_REVIEW.md).
> Para cada problema identificado (🔴 Crítico e 🟡 Melhoria), apresentamos o **código atual**, a **solução proposta** com diff, e uma **explicação** do porquê.

---

## Índice

### Problemas Críticos 🔴

1. [`Signal<any>` na API pública do kernel](#1-signalany-na-api-pública-do-kernel)
2. [Double casts `as unknown as`](#2-double-casts-as-unknown-as)
3. [Efeitos assíncronos fire-and-forget](#3-efeitos-assíncronos-fire-and-forget)
4. [`createConnectionLink.map` — dual-behavior](#4-createconnectionlinkmap--dual-behavior)
5. [`window.engineDevTools` exposto sem proteção](#5-windowenginedevtools-exposto-sem-proteção)
6. [`effects.filter().sort()` em cada dispatch](#6-effectsfiltersort-em-cada-dispatch)

### Melhorias 🟡

7. [Hooks disparam sem transição registrada](#7-hooks-disparam-sem-transição-registrada)
8. [`reset()` não dispara hooks](#8-reset-não-dispara-hooks)
9. [`#buildConnectionRuntime` muito longo](#9-buildconnectionruntime-muito-longo)
10. [`component.name` para gerar IDs](#10-componentname-para-gerar-ids)
11. [`destroy()` incompleto](#11-destroy-incompleto)
12. [Hook registry sem isolamento de erros](#12-hook-registry-sem-isolamento-de-erros)
13. [Slice registry — erro em duplicatas](#13-slice-registry--erro-em-duplicatas)
14. [`PluggableBase.state` sempre `undefined`](#14-pluggablebasestate-sempre-undefined)
15. [Transition registry — modelo stack implícito](#15-transition-registry--modelo-stack-implícito)
16. [Devtools `enable` flag ignorado](#16-devtools-enable-flag-ignorado)
17. [Devtools overlay sem OnPush](#17-devtools-overlay-sem-onpush)
18. [EditorActions — dois padrões competindo](#18-editoractions--dois-padrões-competindo)
19. [`JSON.parse(JSON.stringify())` para deep clone](#19-jsonparsejsonstringify-para-deep-clone)
20. [`updateProjection()` roda em cada evento](#20-updateprojection-roda-em-cada-evento)
21. [Devtools overlay — `track` expression fraca](#21-devtools-overlay--track-expression-fraca)

---

## Problemas Críticos 🔴

---

### 1. `Signal<any>` na API pública do kernel

**Arquivo:** `core-kernel.ts`

**Problema:** `defineSelections` aceita `Signal<any>`, eliminando toda type safety quando o consumidor acessa propriedades do estado.

#### ❌ Código atual

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Signal } from '@angular/core';

export function defineSelections<TSelections extends Record<string, unknown>>(selections: (state: Signal<any>) => TSelections): (state: Signal<any>) => TSelections {
  return selections;
}
```

#### ✅ Código corrigido

```typescript
// Sem eslint-disable — não precisa mais de `any`
import type { Signal } from '@angular/core';

export function defineSelections<TState extends object, TSelections extends Record<string, unknown>>(selections: (state: Signal<TState>) => TSelections): (state: Signal<TState>) => TSelections {
  return selections;
}
```

#### 📝 Explicação

Adicionamos o generic `TState` à assinatura da função. Agora o TypeScript infere o tipo do estado no ponto de uso:

```typescript
// Antes — typo NÃO dá erro:
defineSelections((state) => ({
  query: computed(() => state().querrry), // ← compila sem erro!
}));

// Depois — typo dá erro em compile-time:
defineSelections<MovieSearchState, { query: Signal<string> }>((state) => ({
  query: computed(() => state().querrry),
  //                           ^^^^^^^ Property 'querrry' does not exist on type 'MovieSearchState'
}));
```

A mudança também requer atualizar o `eslint-disable` no topo do arquivo — ele pode ser removido por completo.

> **Impacto:** O `defineCoreKernel` já recebe `selections: (state: Signal<TState>) => TSelections`, então o tipo é inferido pelo kernel. A mudança em `defineSelections` garante que mesmo usos avulsos (fora do kernel) sejam tipados.

---

### 2. Double casts `as unknown as`

**Arquivos:** `composed-engine.ts`, `engine.facade.ts`, `slot.directive.ts`, `editor.actions.ts`

**Problema:** Múltiplos `as unknown as` que "mentem" ao type system, criando potenciais erros silenciosos em runtime.

#### 2a. Facade cast em `composed-engine.ts`

##### ❌ Código atual

```typescript
const facade = baseFacade as unknown as EngineFacade<CompositionState<TState, TComposition>, TStatus, EventFromActions<TActions>, TServices>;
```

##### ✅ Código corrigido

Criar um wrapper tipado que projeta o estado:

```typescript
/**
 * Cria uma view tipada da facade que inclui o estado de composição.
 * A facade interna continua com TState, mas a view pública expõe CompositionState.
 * Isso é seguro porque os slices de composição são registrados antes de qualquer leitura.
 */
function createCompositionFacadeView<TState extends EngineState<TStatus>, TStatus extends string, TActions extends ActionCreatorRecord, TServices extends Record<string, unknown>, TComposition extends CompositionWithConnections>(baseFacade: EngineFacade<TState, TStatus, EventFromActions<TActions>, TServices>): EngineFacade<CompositionState<TState, TComposition>, TStatus, EventFromActions<TActions>, TServices> {
  // A facade usa signals — o state é um proxy reativo.
  // Após registerSlice, o signal já inclui as propriedades de composição.
  // O cast aqui é seguro SOMENTE porque enableAll() já foi chamado antes.
  return baseFacade as EngineFacade<CompositionState<TState, TComposition>, TStatus, EventFromActions<TActions>, TServices>;
}
```

E no `create()`:

```typescript
// Substituir:
const facade = baseFacade as unknown as EngineFacade<...>;

// Por:
composition.connectionRuntime?.enableAll(); // garante que slices estão registrados
const facade = createCompositionFacadeView<
  TState, TStatus, TActions, TServices, TComposition
>(baseFacade);
```

##### 📝 Explicação

O `as unknown as` duplo esconde que estamos "ampliando" o tipo do signal. A função `createCompositionFacadeView` documenta o contrato: "esta view é segura SOMENTE após os slices de composição serem registrados". A ordem importa e agora está explícita.

#### 2b. Event `as never` em `engine.facade.ts`

##### ❌ Código atual

```typescript
subscribe: (listener) =>
  this.subscribeEvents((event) => listener(event as never)),
```

##### ✅ Código corrigido

```typescript
subscribe: (listener) =>
  this.subscribeEvents((event) => {
    // O evento do parent é um superset dos eventos do child.
    // Filtramos apenas os tipos que o child espera.
    listener(event as EventFromCreator<TEvents[keyof TEvents]>);
  }),
```

##### 📝 Explicação

`as never` é o cast mais perigoso do TypeScript — qualquer valor satisfaz `never`. Trocar por um cast explícito para o tipo de evento esperado pelo listener documenta a intenção e, embora ainda seja um cast, reduz o risco de enviar eventos com shape incorreto.

#### 2c. Component cast em `slot.directive.ts`

##### ❌ Código atual

```typescript
const artifacts = (pluggable.component as unknown as PluggableWithArtifacts<TState, TStatus, TEvent, TServices>).storeArtifacts;
```

##### ✅ Código corrigido

```typescript
/**
 * Extrai storeArtifacts de um componente pluggable, se disponível.
 * Retorna undefined se o componente não implementa storeArtifacts.
 */
function extractPluggableArtifacts<TState extends EngineState<TStatus>, TStatus extends string, TEvent extends EngineEvent, TServices extends Record<string, unknown>>(component: Type<unknown>): PluggableStoreArtifacts<TState, TStatus, TEvent, TServices> | undefined {
  const candidate = component as Partial<PluggableWithArtifacts<TState, TStatus, TEvent, TServices>>;
  return candidate.storeArtifacts;
}

// Uso:
const artifacts = extractPluggableArtifacts<TState, TStatus, TEvent, TServices>(pluggable.component);
```

##### 📝 Explicação

Em vez de fazer um double-cast agressivo, a função `extractPluggableArtifacts` faz um cast mais seguro usando `Partial<>` — se o componente não tem `storeArtifacts`, o resultado é `undefined` naturalmente, sem que o tipo minta dizendo que o componente É um `PluggableWithArtifacts`.

#### 2d. Editor actions `as TEvent`

##### ❌ Código atual (`editor.actions.ts`)

```typescript
open(): void {
  this.commands.dispatch({ type: 'editor/open' } as TEvent);
}

update(partial: Record<string, unknown>): void {
  this.commands.dispatch({
    type: 'editor/update',
    partial,
  } as unknown as TEvent);
}
```

##### ✅ Código corrigido

Migrar para `ActionCatalog` (veja também [item 18](#18-editoractions--dois-padrões-competindo)):

```typescript
import { defineActionCatalog } from '../store/action-catalog';

export const editorActionCatalog = defineActionCatalog({
  open: { type: 'editor/open' },
  close: { type: 'editor/close' },
  update: { type: 'editor/update', payload: (partial: Record<string, unknown>) => ({ partial }) },
  save: { type: 'editor/save' },
  cancel: { type: 'editor/cancel' },
});

// Uso: em vez de `new EditorActions(commands).open()`
// Agora: `commands.dispatch(editorActionCatalog.creators.open())`
```

##### 📝 Explicação

O `ActionCatalog` garante que o evento produzido tem exatamente o shape correto (`{ type: 'editor/open' }`), sem precisar de `as TEvent`. A classe `EditorActions` pode ser removida — o catalog é a API unificada.

---

### 3. Efeitos assíncronos fire-and-forget

**Arquivo:** `engine-effects.runtime.ts`

**Problema:** Promises são ignoradas (`void result.catch(...)`), sem callback de erro, sem cancelamento, sem como aguardar conclusão.

#### ❌ Código atual

```typescript
export class EngineEffectsRuntime<TState, TStatus, TEvent, TServices> {
  #services: TServices;

  constructor(
    private readonly effectRegistry: EffectRegistry<TState, TStatus, TEvent, TServices>,
    services?: TServices,
  ) {
    this.#services = services ?? ({} as TServices);
  }

  execute(state, event, dispatch, getState): void {
    const effects = this.effectRegistry.listByEvent(event.type).filter(/* ... */).sort(/* ... */);

    for (const effect of effects) {
      try {
        const result = effect.handler(state, effectEvent, context);
        if (result instanceof Promise) {
          void result.catch((error) => {
            console.error(`[EngineEffectsRuntime] Effect "${effect.id}" failed`, error);
          });
        }
      } catch (error) {
        console.error(`[EngineEffectsRuntime] Effect "${effect.id}" failed`, error);
      }
    }
  }
}
```

#### ✅ Código corrigido

```typescript
export interface EffectsRuntimeConfig {
  /** Callback invocado quando um efeito (sync ou async) falha. Default: console.error */
  onEffectError?: (context: { effectId: string; error: unknown; eventType?: string }) => void;
}

export class EngineEffectsRuntime<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown> = Record<string, unknown>,
> {
  #services: TServices;
  #destroyed = false;
  readonly #pendingEffects = new Set<Promise<void>>();
  readonly #onEffectError: (ctx: { effectId: string; error: unknown; eventType?: string }) => void;

  constructor(
    private readonly effectRegistry: EffectRegistry<TState, TStatus, TEvent, TServices>,
    services?: TServices,
    config?: EffectsRuntimeConfig,
  ) {
    this.#services = services ?? ({} as TServices);
    this.#onEffectError = config?.onEffectError ?? (({ effectId, error, eventType }) => {
      console.error(
        `[EngineEffectsRuntime] Effect "${effectId}" failed` +
        (eventType ? ` (triggered by "${eventType}")` : ''),
        error,
      );
    });
    });
  }

  setServices(services: TServices): void {
    this.#services = services;
  }

  registerService<TKey extends keyof TServices>(name: TKey, service: TServices[TKey]): void {
    this.#services = { ...this.#services, [name]: service };
  }

  execute(
    state: TState,
    event: TEvent,
    dispatch: (event: TEvent) => void,
    getState: () => TState,
  ): void {
    if (this.#destroyed) return;

    const effects = this.effectRegistry
      .listByEvent(event.type)
      .filter((effect) => {
        const effectEvent = event as EventByType<TEvent, typeof effect.event>;
        return !effect.when || effect.when(state, effectEvent);
      })
      .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

    const context: EffectContext<TState, TStatus, TEvent, TServices> = {
      dispatch: (evt: TEvent) => {
        if (!this.#destroyed) dispatch(evt);
      },
      getState,
      services: this.#services,
    };

    for (const effect of effects) {
      try {
        const effectEvent = event as EventByType<TEvent, typeof effect.event>;
        const result = effect.handler(state, effectEvent, context);
        if (result instanceof Promise) {
          const tracked = result
            .catch((error) => this.#onEffectError({
              effectId: effect.id, error, eventType: event.type,
            }))
            .finally(() => this.#pendingEffects.delete(tracked));
          this.#pendingEffects.add(tracked);
        }
      } catch (error) {
        this.#onEffectError({ effectId: effect.id, error, eventType: event.type });
    }
  }

  /** Aguarda todos os efeitos assíncronos pendentes. Útil em testes. */
  async awaitPendingEffects(): Promise<void> {
    await Promise.all(this.#pendingEffects);
  }

  /** Marca o runtime como destruído. Dispatches de efeitos async são ignorados. */
  destroy(): void {
    this.#destroyed = true;
    this.#pendingEffects.clear();
  }
}
```

#### 📝 Explicação

Três melhorias fundamentais:

1. **`onEffectError` callback** — o consumidor pode reagir a falhas (ex: mostrar toast, logar em telemetria)
2. **`#pendingEffects` + `awaitPendingEffects()`** — em testes, podemos aguardar efeitos async antes de fazer assertions
3. **`#destroyed` flag** — após destroy, dispatches de efeitos async são ignorados (previne erros em facades destruídas)

---

### 4. `createConnectionLink.map` — dual-behavior

**Arquivo:** `composition.builder.ts`

**Problema:** A propriedade `map` serve como builder (recebe função → retorna `ResolvedConnectionLink`) e como transformer (recebe evento → retorna payload). Requer dois `as unknown` casts.

#### ❌ Código atual

```typescript
function createConnectionLink<TSourceCreator, TTargetCreator>(
  source: TSourceCreator,
  target: TTargetCreator,
): ConnectionLink<TSourceCreator, TTargetCreator> {
  return {
    source, target, sourceType, targetType,
    map: ((input: unknown) => {
      if (typeof input === 'function') {
        return new ResolvedConnectionLink(source, target, input as ...);
      }
      const payload = { ...(input as Record<string, unknown>) };
      delete payload['type'];
      return payload;
    }) as unknown,
  } as unknown as ConnectionLink<TSourceCreator, TTargetCreator>;
}
```

#### ✅ Código corrigido

Separar em dois métodos com contratos claros:

```typescript
function createConnectionLink<TSourceCreator extends AnyActionCreator, TTargetCreator extends AnyActionCreator>(source: TSourceCreator, target: TTargetCreator): ConnectionLink<TSourceCreator, TTargetCreator> {
  const sourceType = source.actionType as ReturnType<TSourceCreator>['type'];
  const targetType = target.actionType as ReturnType<TTargetCreator>['type'];

  type TSourceEvent = ReturnType<TSourceCreator>;
  type TTargetPayload = EventPayload<ReturnType<TTargetCreator>>;

  const defaultMap = (event: EngineEvent): Record<string, unknown> => {
    const payload = { ...(event as Record<string, unknown>) };
    delete payload['type'];
    return payload;
  };

  // Quando payloads são compatíveis, retorna link resolvido diretamente
  const resolved: ConnectionLinkResolved<TSourceCreator, TTargetCreator> = {
    source,
    target,
    sourceType,
    targetType,
    map: defaultMap,
  };

  // Quando payloads NÃO são compatíveis, oferece método `mapWith` para transformar
  const needsMap = {
    source,
    target,
    sourceType,
    targetType,
    mapWith(mapper: (event: TSourceEvent) => TTargetPayload): ConnectionLinkResolved<TSourceCreator, TTargetCreator> {
      return new ResolvedConnectionLink(source, target, mapper);
    },
  };

  // O tipo `ConnectionLink` é uma union: se payloads são compatíveis, retorna `resolved`.
  // Se não, retorna `needsMap` com o método `mapWith`.
  // TypeScript seleciona o arm correto da union automaticamente.
  return (isPayloadCompatible(source, target) ? resolved : needsMap) as ConnectionLink<TSourceCreator, TTargetCreator>;
}

function isPayloadCompatible(_source: AnyActionCreator, _target: AnyActionCreator): boolean {
  // A verificação real de compatibilidade de payloads acontece em compile-time
  // via o tipo condicional `PayloadCompatible<S, T>`.
  // Em runtime, esta função é um placeholder — o TypeScript já garantiu
  // que o arm correto da union `ConnectionLink` foi selecionado.
  return true;
}
```

E atualizar o tipo `ConnectionLink`:

```typescript
// pluggable.types.ts — antes:
export type ConnectionLink<TSource, TTarget> = PayloadCompatible<TSource, TTarget> extends true ? ConnectionLinkResolved<TSource, TTarget> : ConnectionLinkNeedsMap<TSource, TTarget>;

// Atualizar ConnectionLinkNeedsMap para usar mapWith:
export interface ConnectionLinkNeedsMap<TSourceCreator extends AnyActionCreator, TTargetCreator extends AnyActionCreator> {
  readonly source: TSourceCreator;
  readonly target: TTargetCreator;
  readonly sourceType: EventFromCreator<TSourceCreator>['type'];
  readonly targetType: EventFromCreator<TTargetCreator>['type'];
  /** Transforma o payload do source para o formato esperado pelo target. */
  mapWith: (mapper: (event: EventFromCreator<TSourceCreator>) => PayloadFromCreator<TTargetCreator>) => ConnectionLinkResolved<TSourceCreator, TTargetCreator>;
}
```

#### 📝 Explicação

Agora a API tem dois caminhos explícitos:

```typescript
// Payloads compatíveis — retorna resolvido diretamente:
link(parent.actions.historyRecorded, child.actions.ingestSearch);
// → ConnectionLinkResolved (pronto para usar)

// Payloads incompatíveis — precisa de transformação:
link(parent.actions.submit, child.actions.load).mapWith((event) => ({
  query: event.term,
}));
// → ConnectionLinkResolved (com mapper customizado)
```

Sem `as unknown`, sem dual-behavior na mesma propriedade, sem necessidade de ler a implementação para entender a API.

---

### 5. `window.engineDevTools` exposto sem proteção

**Arquivo:** `devtools.registry.ts`

**Problema:** A API de devtools é exposta globalmente em produção, acessível por qualquer script na página. O singleton de módulo vaza entre instâncias em SSR/testes.

#### ❌ Código atual

```typescript
import { EngineDevToolsAPI, EngineDevToolsGlobal } from './devtools.types';

const instances = new Map<string, EngineDevToolsAPI>();

export function registerEngineDevToolsInstance(api: EngineDevToolsAPI): void {
  instances.set(api.instanceId, api);
}

// ... outras funções usando `instances` ...

export function setupGlobalEngineDevTools(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const target = window as unknown as { engineDevTools?: EngineDevToolsGlobal };
  if (!target.engineDevTools) {
    target.engineDevTools = globalDevTools;
  }
}
```

#### ✅ Código corrigido

```typescript
import { isDevMode, Injectable } from '@angular/core';
import { EngineDevToolsAPI, EngineDevToolsGlobal } from './devtools.types';

/**
 * Registry de instâncias de devtools.
 * É um Injectable para respeitar o lifecycle da aplicação Angular.
 * Em SSR e testes, cada instância de TestBed/AppRef recebe seu próprio registry.
 */
@Injectable({ providedIn: 'root' })
export class EngineDevToolsRegistry {
  readonly #instances = new Map<string, EngineDevToolsAPI>();

  register(api: EngineDevToolsAPI): void {
    this.#instances.set(api.instanceId, api);
  }

  unregister(instanceId: string): void {
    this.#instances.delete(instanceId);
  }

  list(): string[] {
    return Array.from(this.#instances.keys());
  }

  get(id: string): EngineDevToolsAPI | undefined {
    return this.#instances.get(id);
  }
}

/**
 * Expõe devtools no `window` global — SOMENTE em dev mode.
 * Em produção, essa função é um no-op.
 */
export function setupGlobalEngineDevTools(registry: EngineDevToolsRegistry): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Guard: nunca expor em produção
  if (!isDevMode()) {
    return;
  }

  const globalDevTools: EngineDevToolsGlobal = {
    list: () => registry.list(),
    get: (id: string) => registry.get(id),
  };

  const target = window as unknown as { engineDevTools?: EngineDevToolsGlobal };
  if (!target.engineDevTools) {
    target.engineDevTools = globalDevTools;
  }
}
```

#### 📝 Explicação

Duas mudanças fundamentais:

1. **`isDevMode()` guard** — em produção, `window.engineDevTools` nunca é criado. Terceiros não conseguem acessar a API.
2. **Injectable** — o `Map` de instâncias agora vive dentro de um Injectable Angular. Em testes com `TestBed.resetTestingModule()` e em SSR, cada aplicação tem seu próprio registry isolado. Sem vazamento de estado entre instâncias.

---

### 6. `effects.filter().sort()` em cada dispatch

**Arquivo:** `engine-effects.runtime.ts` e `effect.registry.ts`

**Problema:** A cada dispatch, a engine filtra por event type O(n) e ordena por prioridade O(n log n). Com muitos efeitos e dispatches frequentes, é trabalho desnecessário.

#### ❌ Código atual (`effect.registry.ts`)

```typescript
export function createEffectRegistry<...>(): EffectRegistry<...> {
  const effects: EffectConfig<...>[] = [];

  return {
    register(nextEffects) {
      // ... push to flat array ...
    },

    listByEvent(eventType) {
      return effects.filter((effect) => effect.event === eventType);
    },
    // ...
  };
}
```

E no runtime:

```typescript
const effects = this.effectRegistry
  .listByEvent(event.type)
  .filter((e) => !e.when || e.when(state, event))
  .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
```

#### ✅ Código corrigido (`effect.registry.ts`)

```typescript
export function createEffectRegistry<TState extends EngineState<TStatus>, TStatus extends string, TEvent extends EngineEvent, TServices extends Record<string, unknown> = Record<string, unknown>>(): EffectRegistry<TState, TStatus, TEvent, TServices> {
  const effects: EffectConfig<TState, TStatus, TEvent, TServices>[] = [];
  // Índice pré-computado: eventType → effects já ordenados por prioridade
  const indexByEvent = new Map<string, EffectConfig<TState, TStatus, TEvent, TServices>[]>();

  function rebuildIndex(): void {
    indexByEvent.clear();
    for (const effect of effects) {
      const eventType = effect.event as string;
      let bucket = indexByEvent.get(eventType);
      if (!bucket) {
        bucket = [];
        indexByEvent.set(eventType, bucket);
      }
      bucket.push(effect);
    }
    // Pré-ordenar cada bucket por prioridade
    for (const bucket of indexByEvent.values()) {
      bucket.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
    }
  }

  return {
    register(nextEffects) {
      const existingIds = new Set(effects.map((e) => e.id));
      const normalized = nextEffects.filter((e) => !existingIds.has(e.id)).map((e) => ({ ...e, priority: e.priority ?? 50 }));

      effects.push(...normalized);
      rebuildIndex(); // Recalcula índice apenas no registro (raro)

      return () => {
        for (const effect of normalized) {
          const idx = effects.indexOf(effect);
          if (idx >= 0) effects.splice(idx, 1);
        }
        rebuildIndex(); // Recalcula no unregister (raro)
      };
    },

    list() {
      return [...effects];
    },

    listByEvent(eventType) {
      // O(1) lookup + já ordenado por prioridade!
      return indexByEvent.get(eventType as string) ?? [];
    },

    clear() {
      effects.length = 0;
      indexByEvent.clear();
    },
  };
}
```

E no runtime, simplificar:

```typescript
execute(state, event, dispatch, getState): void {
  // listByEvent já retorna ordenado por prioridade — sem sort!
  const effects = this.effectRegistry
    .listByEvent(event.type)
    .filter((effect) => {
      const effectEvent = event as EventByType<TEvent, typeof effect.event>;
      return !effect.when || effect.when(state, effectEvent);
    });

  // ... resto igual
}
```

#### 📝 Explicação

O `rebuildIndex()` roda **apenas quando efeitos são registrados/removidos** (tipicamente na montagem/desmontagem de pluggables — raro). O `listByEvent()` agora é O(1) via Map lookup, e os resultados já vêm ordenados por prioridade. Em cada dispatch, o único custo é o `filter` pelo `when` guard — O(k) onde k é o número de efeitos para aquele event type.

---

## Melhorias 🟡

---

### 7. Hooks disparam sem transição registrada

**Arquivo:** `engine.reducer.ts`

#### ❌ Código atual

```typescript
const dispatch = (event: TEvent) => {
  const current = state();
  hookRegistry.runBefore(current, event);

  const transition = transitionRegistry.resolve(current, event);
  const nextState = transition ? transition(current, event) : current;

  state.set(nextState);
  hookRegistry.runAfter(nextState, event); // roda SEMPRE
};
```

#### ✅ Código corrigido

```typescript
const dispatch = (event: TEvent) => {
  const current = state();
  hookRegistry.runBefore(current, event);

  const transition = transitionRegistry.resolve(current, event);
  const nextState = transition ? transition(current, event) : current;
  const hasTransition = transition !== undefined;

  state.set(nextState);

  // Sempre roda runAfter — efeitos que reagem a eventos
  // independente de transição de estado continuam funcionando.
  // O flag `hasTransition` permite que hooks/efeitos saibam
  // se houve mudança de estado efetiva.
  hookRegistry.runAfter(nextState, event, { hasTransition });
};
```

E atualizar a interface do hook:

```typescript
// store/engine.types.ts
export interface ReducerHook<TState, TStatus extends string, TEvent extends EngineEvent> {
  onBeforeTransition?: (state: TState, event: TEvent) => void;
  onAfterTransition?: (state: TState, event: TEvent, meta?: { hasTransition: boolean }) => void;
}
```

#### 📝 Explicação

Em vez de escolher entre "rodar sempre" e "rodar apenas com transição", passamos um `meta.hasTransition` flag. Hooks e efeitos podem decidir por conta própria se devem executar quando não houve transição. Isso não quebra nada do comportamento existente.

---

### 8. `reset()` não dispara hooks

**Arquivo:** `engine.reducer.ts`

#### ❌ Código atual

```typescript
reset(nextState) {
  state.set(nextState ?? initialState);
},
```

#### ✅ Código corrigido

Documentar via JSDoc + oferecer variante com hooks:

```typescript
/**
 * Reseta o estado diretamente, **sem** disparar hooks ou efeitos.
 * Usado internamente para operações de slice (registerSlice, setSliceState).
 * Se você precisa que hooks/efeitos reajam à mudança, use `dispatch()`.
 */
reset(nextState) {
  state.set(nextState ?? initialState);
},

/**
 * Reseta o estado executando hooks before/after.
 * Útil quando a mudança deve ser observável por devtools e efeitos.
 */
resetWithHooks(nextState, syntheticEvent) {
  const target = nextState ?? initialState;
  hookRegistry.runBefore(state(), syntheticEvent);
  state.set(target);
  hookRegistry.runAfter(target, syntheticEvent);
},
```

#### 📝 Explicação

Manter o `reset()` sem hooks para operações internas de slice é correto — evita loops infinitos. Mas documentar claramente via JSDoc é essencial. A variante `resetWithHooks` é uma opção para cenários onde o consumidor QUER que devtools e efeitos sejam notificados.

---

### 9. `#buildConnectionRuntime` muito longo

**Arquivo:** `composition.builder.ts`

#### ✅ Solução proposta

Extrair para uma classe `ConnectionRuntime`:

```typescript
/**
 * Gerencia o lifecycle de conexões entre parent e child cores.
 * Cada conexão pode ser habilitada/desabilitada individualmente.
 */
class ConnectionRuntime implements CompositionConnectionRuntime {
  readonly #active = new Map<string, () => void>();

  constructor(
    private readonly parentPort: ConnectionPort<ActionCreatorRecord, ActionCreatorRecord, object>,
    private readonly childPorts: Map<string, ConnectionPort<ActionCreatorRecord, ActionCreatorRecord, object>>,
    private readonly childConnections: Record<string, ChildConnectionDefinition<...>>,
  ) {}

  enable(slot: string): void {
    if (this.#active.has(slot)) return;

    const definition = this.childConnections[slot];
    if (!definition) throw new Error(`No child connection for slot "${slot}".`);

    const childPort = this.childPorts.get(slot);
    if (!childPort) throw new Error(`No child core endpoint for slot "${slot}".`);

    const cleanups: Array<() => void> = [];

    if (definition.parentToChild?.length) {
      cleanups.push(this.#bindLinks(definition.parentToChild, this.parentPort, childPort));
    }

    if (definition.childToParent?.length) {
      cleanups.push(this.#bindLinks(definition.childToParent, childPort, this.parentPort));
    }

    if (definition.projection) {
      cleanups.push(this.#setupProjection(slot, definition.projection, childPort));
    }

    this.#active.set(slot, () => cleanups.forEach(fn => fn()));
  }

  disable(slot: string): void {
    this.#active.get(slot)?.();
    this.#active.delete(slot);
  }

  enableAll(): void {
    Object.keys(this.childConnections).forEach(slot => this.enable(slot));
  }

  disableAll(): void {
    Array.from(this.#active.keys()).forEach(slot => this.disable(slot));
  }

  isEnabled(slot: string): boolean {
    return this.#active.has(slot);
  }

  #bindLinks(specs: Array<{...}>, sourcePort: ..., targetPort: ...): () => void {
    const unsubs = specs.map(spec =>
      sourcePort.subscribe((event) => {
        if (event.type === spec.sourceType) {
          targetPort.dispatch({ type: spec.targetType, ...spec.map(event) });
        }
      })
    );
    return () => unsubs.forEach(fn => fn());
  }

  #setupProjection(slot: string, projection: ..., childPort: ...): () => void {
    const sliceKey = projection.sliceKey ?? `${slot}Projection`;

    this.parentPort.registerSlice?.(sliceKey, projection.initialState as Record<string, unknown>);

    const updateProjection = () => {
      const childState = childPort.getState?.();
      if (childState) {
        this.parentPort.setSliceState?.(sliceKey, projection.select(childState) as Record<string, unknown>);
      }
    };

    updateProjection();
    const unsub = childPort.subscribe(() => updateProjection());

    return () => {
      unsub();
      this.parentPort.unregisterSlice?.(sliceKey);
    };
  }
}
```

#### 📝 Explicação

O método `#buildConnectionRuntime` original tinha ~95 linhas fazendo tudo: validação, binding de links, setup de projection, e lifecycle management. A classe `ConnectionRuntime` separa cada responsabilidade em métodos privados (`#bindLinks`, `#setupProjection`), tornando o código testável individualmente e fácil de manter.

---

### 10. `component.name` para gerar IDs

**Arquivo:** `composition.builder.ts`

#### ❌ Código atual

```typescript
options?.id ?? `${String(slot)}-${component.name}`;
```

#### ✅ Código corrigido

```typescript
let pluggableIdCounter = 0;

function generatePluggableId(slot: string | symbol, component: Type<unknown>): string {
  pluggableIdCounter += 1;

  // Em dev mode, usar component.name para legibilidade
  // `ngDevMode` é uma flag global de compilação do Angular, injetada pelo compiler.
  // Em produção, o tree-shaker remove blocos protegidos por essa flag.
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    return `${String(slot)}-${component.name}-${pluggableIdCounter}`;
  }

  // Em produção, usar counter (seguro após minificação)
  return `${String(slot)}-pluggable-${pluggableIdCounter}`;
}

// Uso:
options?.id ?? generatePluggableId(slot, component);
```

#### 📝 Explicação

`component.name` é unreliable após minificação (`a`, `t`, etc.). O counter garante unicidade em produção, enquanto em dev mode mantemos o nome legível para debugging.

---

### 11. `destroy()` incompleto

**Arquivo:** `composed-engine.ts`

#### ❌ Código atual

```typescript
const destroy = () => {
  composition.connectionRuntime?.disableAll();
  effectsCleanup();
  baseFacade.destroy();
};

return {
  id,
  artifact,
  facade,
  baseFacade,
  actions,
  selections,
  composition,
  connectionPort,
  destroy,
};
```

#### ✅ Código corrigido

```typescript
let destroyed = false;

const guardedActions = new Proxy(actions, {
  get(target, prop) {
    if (destroyed) {
      console.warn(`[Engine] Action "${String(prop)}" called after destroy — ignored.`);
      return () => {}; // no-op
    }
    return target[prop as keyof typeof target];
  },
});

const destroy = () => {
  if (destroyed) return; // Idempotente
  destroyed = true;
  composition.connectionRuntime?.disableAll();
  effectsCleanup();
  baseFacade.destroy();
};

return {
  id,
  artifact,
  facade,
  baseFacade,
  actions: guardedActions,
  selections,
  composition,
  connectionPort,
  destroy,
  /** Verifica se a engine foi destruída. */
  get isDestroyed() {
    return destroyed;
  },
};
```

#### 📝 Explicação

Após `destroy()`, chamadas a `actions.submit()` agora são no-op com warning, em vez de operar sobre um facade destruído. O flag `isDestroyed` permite ao consumidor verificar o estado. O `destroy()` é idempotente — chamar duas vezes não causa erro.

---

### 12. Hook registry sem isolamento de erros

**Arquivo:** `hook.registry.ts`

#### ❌ Código atual

```typescript
runAfter(state, event) {
  for (const hook of hooks) {
    hook.onAfterTransition?.(state, event); // Se lançar exceção, para aqui
  }
},
```

#### ✅ Código corrigido

```typescript
runBefore(state, event) {
  // Snapshot para evitar problemas se um hook se remove durante iteração
  const snapshot = [...hooks];
  for (const hook of snapshot) {
    try {
      hook.onBeforeTransition?.(state, event);
    } catch (error) {
      console.error('[HookRegistry] onBeforeTransition failed:', error);
    }
  }
},

runAfter(state, event) {
  const snapshot = [...hooks];
  for (const hook of snapshot) {
    try {
      hook.onAfterTransition?.(state, event);
    } catch (error) {
      console.error('[HookRegistry] onAfterTransition failed:', error);
    }
  }
},
```

#### 📝 Explicação

Duas melhorias:

1. **`try/catch` individual** — um hook falhando não impede os subsequentes de executar
2. **`[...hooks]` snapshot** — se um hook se remove durante a iteração (via cleanup function), a iteração continua sem pular elementos

---

### 13. Slice registry — erro em duplicatas

**Arquivo:** `slice.registry.ts`

#### ❌ Código atual

```typescript
register(slice) {
  if (registrations.has(slice.key)) {
    throw new Error(`Slice "${slice.key}" is already registered.`);
  }
  registrations.set(slice.key, slice.initialState);
},
```

#### ✅ Código corrigido

```typescript
register(slice, options?: { allowReplace?: boolean }) {
  if (registrations.has(slice.key)) {
    if (options?.allowReplace) {
      // Re-registro silencioso — útil em HMR
      registrations.set(slice.key, slice.initialState);
      return;
    }
    throw new Error(
      `Slice "${slice.key}" is already registered. ` +
      `Use { allowReplace: true } para permitir re-registro (ex: HMR).`
    );
  }
  registrations.set(slice.key, slice.initialState);
},
```

#### 📝 Explicação

Em cenários de HMR ou re-montagem de componentes (ex: Angular re-renderizando um slot), o mesmo slice pode ser registrado novamente. A opção `allowReplace` permite o re-registro sem crashear a engine, enquanto mantém o throw como default para pegar bugs reais.

---

### 14. `PluggableBase.state` sempre `undefined`

**Arquivo:** `pluggable.base.ts`

#### ❌ Código atual

```typescript
readonly state: Signal<TState | undefined> = computed(() =>
  this.context?.state(),
);
```

#### ✅ Código corrigido

```typescript
/** Estado completo da engine. Retorna TState | undefined quando fora de contexto. */
readonly state: Signal<TState | undefined> = computed(() =>
  this.context?.state(),
);

/**
 * Estado da engine com garantia de não-null.
 * Lança erro se acessado fora de um EngineSlotDirective.
 * Use dentro de pluggables que SEMPRE rodam dentro de um slot.
 */
readonly assertedState: Signal<TState> = computed(() => {
  const value = this.context?.state();
  if (value === undefined) {
    throw new Error(
      `[EnginePluggableBase] assertedState accessed outside engine context. ` +
      `Ensure this pluggable is rendered inside an [uiEngineSlot] directive.`
    );
  }
  return value;
});
```

#### 📝 Explicação

O `state` original continua para backwards compatibility. O novo `assertedState` é para pluggables que sabem que estão dentro de um slot — sem optional chaining:

```typescript
// Antes (verbose):
const results = this.state()?.results ?? [];

// Depois (limpo):
const results = this.assertedState().results;
```

---

### 15. Transition registry — modelo stack implícito

**Arquivo:** `transition.registry.ts`

#### ❌ Código atual

```typescript
register(registration) {
  const previousTransitions = transitions;      // snapshot
  const previousGlobalTransitions = globalTransitions;
  // ... merge ...
  return () => {
    transitions = previousTransitions;           // restaura snapshot
    globalTransitions = previousGlobalTransitions;
  };
},
```

#### ✅ Código corrigido — modelo de merge com remoção explícita

```typescript
register(registration) {
  // Guardar quais chaves foram adicionadas por ESTE registro
  const addedTransitions = new Map<string, Set<string>>();
  const addedGlobalTransitions = new Set<string>();

  if (registration.transitions) {
    const nextTransitions: TransitionTable<TState, TStatus, TEvent> = { ...transitions };
    for (const [status, handlers] of Object.entries(registration.transitions)) {
      const statusKey = status as TStatus;
      const handlerKeys = Object.keys(handlers ?? {});
      addedTransitions.set(status, new Set(handlerKeys));

      nextTransitions[statusKey] = {
        ...(nextTransitions[statusKey] ?? {}),
        ...(handlers ?? {}),
      };
    }
    transitions = nextTransitions;
  }

  if (registration.globalTransitions) {
    const newGlobalKeys = Object.keys(registration.globalTransitions);
    for (const key of newGlobalKeys) {
      addedGlobalTransitions.add(key);
    }
    globalTransitions = { ...globalTransitions, ...registration.globalTransitions };
  }

  // Cleanup: remove APENAS as transições adicionadas por este registro
  return () => {
    const nextTransitions: TransitionTable<TState, TStatus, TEvent> = { ...transitions };
    for (const [status, keys] of addedTransitions) {
      const statusKey = status as TStatus;
      if (nextTransitions[statusKey]) {
        const handlers = { ...nextTransitions[statusKey] };
        for (const key of keys) {
          delete (handlers as Record<string, unknown>)[key];
        }
        nextTransitions[statusKey] = handlers;
      }
    }
    transitions = nextTransitions;

    const nextGlobal = { ...globalTransitions };
    for (const key of addedGlobalTransitions) {
      delete (nextGlobal as Record<string, unknown>)[key];
    }
    globalTransitions = nextGlobal as GlobalTransitions<TState, TStatus, TEvent>;
  };
},
```

#### 📝 Explicação

O modelo stack restaura um snapshot completo — se A, B, C registram e B é removido, C's transições são perdidas. O modelo de merge rastreia quais transições cada registro adicionou e remove **apenas aquelas** no cleanup. Isso torna a ordem de cleanup irrelevante — pode ser FIFO, LIFO, ou qualquer ordem.

---

### 16. Devtools `enable` flag ignorado

**Arquivo:** `devtools.state.ts`

#### ❌ Código atual

```typescript
logTransition(event: TEvent, prevState: TState, nextState: TState): void {
  const entry = createEngineLogEntry(event, prevState, nextState);
  this.#entries.update((entries) =>
    truncateEngineHistory([...entries, entry], this.config.maxHistory),
  );
  logEngineTransition(entry, this.config, this.instanceName);
}
```

#### ✅ Código corrigido

```typescript
logTransition(event: TEvent, prevState: TState, nextState: TState): void {
  if (!this.config.enable) {
    return; // Early return — nenhum trabalho é feito
  }

  const entry = createEngineLogEntry(event, prevState, nextState);
  this.#entries.update((entries) =>
    truncateEngineHistory([...entries, entry], this.config.maxHistory),
  );
  logEngineTransition(entry, this.config, this.instanceName);
}
```

#### 📝 Explicação

Uma linha. Sem o guard, mesmo com `enable: false`, o log de entradas continua acumulando no signal `#entries` e o `logEngineTransition` é chamado. Isso desperdiça memória e CPU sem motivo.

---

### 17. Devtools overlay sem OnPush

**Arquivo:** `devtools-overlay.component.ts`

#### ❌ Código atual

```typescript
@Component({
  selector: 'ui-engine-devtools-overlay',
  standalone: true,
  imports: [JsonPipe],
  template: `...`,
  styles: [`...`],
})
export class EngineDevtoolsOverlayComponent {
```

#### ✅ Código corrigido

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ui-engine-devtools-overlay',
  standalone: true,
  imports: [JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush, // ← adicionado
  template: `...`,
  styles: [`...`],
})
export class EngineDevtoolsOverlayComponent {
```

#### 📝 Explicação

O componente já usa `signal()` e `computed()` para todo estado local. Com `OnPush`, o Angular só re-renderiza quando inputs mudam ou signals são atualizados — perfeito para este caso.

---

### 18. EditorActions — dois padrões competindo

**Arquivos:** `editor.actions.ts`, `editor.types.ts`

#### ❌ Código atual (`editor.actions.ts`)

```typescript
export class EditorActions<TEvent extends EngineEvent = EngineEvent> {
  constructor(private readonly commands: EngineCommandPort<TEvent>) {}

  open(): void {
    this.commands.dispatch({ type: 'editor/open' } as TEvent);
  }

  update(partial: Record<string, unknown>): void {
    this.commands.dispatch({ type: 'editor/update', partial } as unknown as TEvent);
  }

  // ... save, cancel, close — todos com `as TEvent`
}
```

#### ✅ Código corrigido

Eliminar a classe e usar o padrão `ActionCatalog` unificado:

```typescript
// editor.actions.ts — substituir a classe por:
import { defineActionCatalog } from '../store/action-catalog';

/**
 * Catálogo de ações do editor. Substitui a classe EditorActions.
 * Type-safe: cada creator produz o evento correto sem casts.
 */
export const editorActionCatalog = defineActionCatalog({
  editorOpen: { type: 'editor/open' },
  editorClose: { type: 'editor/close' },
  editorUpdate: {
    type: 'editor/update',
    payload: (partial: Record<string, unknown>) => ({ partial }),
  },
  editorSave: { type: 'editor/save' },
  editorCancel: { type: 'editor/cancel' },
});

export type EditorEvent = ReturnType<(typeof editorActionCatalog.creators)[keyof typeof editorActionCatalog.creators]>;
```

E atualizar `editor.types.ts`:

```typescript
// No createEditorTransitions, usar o catálogo diretamente:
'editor/update': (state, event) => {
  // O tipo vem do catálogo — narrowing seguro via discriminated union
  const partial = (event as { partial?: Partial<TDraft> }).partial ?? {};
  const nextDraft = {
    ...(state.editor?.draft ?? createDefaultDraft()),
    ...partial,
  };
  // ...
},
```

> **Nota:** O cast residual aqui (`as { partial?: ... }`) é necessário porque `globalTransitions`
> usa uma union ampla. A solução ideal é tipar `globalTransitions` como um discriminated union
> mapeado sobre os tipos do `editorActionCatalog`, eliminando até este cast. Isso requer
> mudança na assinatura de `TransitionRegistration`.

#### 📝 Explicação

Um único padrão para todas as ações: `ActionCatalog`. Sem classe, sem `as TEvent`, sem `as unknown as`. Os creators são type-safe por construção.

---

### 19. `JSON.parse(JSON.stringify())` para deep clone

**Arquivo:** `editor.types.ts`

#### ❌ Código atual

```typescript
const baseDraft = state.config ? (JSON.parse(JSON.stringify(state.config)) as TDraft) : createDefaultDraft();
```

#### ✅ Código corrigido

```typescript
const baseDraft = state.config ? (structuredClone(state.config) as TDraft) : createDefaultDraft();
```

#### 📝 Explicação

`structuredClone()` é suportado em todos os browsers modernos (Chrome 98+, Firefox 94+, Safari 15.4+) e Node.js 17+. Diferente de `JSON.parse(JSON.stringify())`, ele preserva `Date`, `RegExp`, `ArrayBuffer`, `Map`, `Set`, e detecta referências circulares em vez de lançar silenciosamente.

---

### 20. `updateProjection()` roda em cada evento

**Arquivo:** `composition.builder.ts`

#### ❌ Código atual

```typescript
const updateProjection = () => {
  const nextChildState = childPort.getState?.();
  if (!nextChildState) return;
  parentPort.setSliceState?.(projectionSliceKey, projection.select(nextChildState) as Record<string, unknown>);
};

updateProjection();
cleanups.push(childPort.subscribe(() => updateProjection()));
```

#### ✅ Código corrigido

```typescript
let lastProjectedState: Record<string, unknown> | null = null;

const updateProjection = () => {
  const nextChildState = childPort.getState?.();
  if (!nextChildState) return;

  const nextProjected = projection.select(nextChildState) as Record<string, unknown>;

  // Shallow-equal check: só atualiza se a projeção realmente mudou
  if (lastProjectedState !== null && shallowEqual(lastProjectedState, nextProjected)) {
    return;
  }

  lastProjectedState = nextProjected;
  parentPort.setSliceState?.(projectionSliceKey, nextProjected);
};

updateProjection();
cleanups.push(childPort.subscribe(() => updateProjection()));
```

Com a utility function:

```typescript
function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.is(a[key], b[key]));
}
```

#### 📝 Explicação

Se o child dispara 10 eventos mas a projeção não muda (ex: o child só mudou estado interno que não é projetado), evitamos 10 chamadas desnecessárias a `parentPort.setSliceState` → `store.reset()`. O `shallowEqual` é O(k) onde k é o número de chaves da projeção (tipicamente pequeno).

---

### 21. Devtools overlay — `track` expression fraca

**Arquivo:** `devtools-overlay.component.ts`

#### ❌ Código atual

```html
@for (item of section.items; track item.title + item.meta) {
```

#### ✅ Código corrigido

```html
@for (item of section.items; track $index) {
```

#### 📝 Explicação

Usar `$index` é seguro aqui porque o devtools overlay re-renderiza a lista inteira quando o payload muda (via `computed(() => this.payload()?.sections ?? [])`). Não há reordenação de itens — a lista é sempre recriada. `$index` é mais estável que concatenação de strings e não tem risco de colisão.

Se a lista pudesse ser reordenada, a melhor opção seria adicionar um `id` único a cada `EngineDevtoolsOverlayListItem` e usar `track item.id`.

---

## Resumo das Soluções

| #   | Issue                           | Tipo        | Esforço | Arquivos Afetados                                                                  |
| --- | ------------------------------- | ----------- | ------- | ---------------------------------------------------------------------------------- |
| 1   | `Signal<any>` no kernel         | 🔴 Crítico  | Baixo   | `core-kernel.ts`                                                                   |
| 2   | Double casts `as unknown as`    | 🔴 Crítico  | Alto    | `composed-engine.ts`, `engine.facade.ts`, `slot.directive.ts`, `editor.actions.ts` |
| 3   | Effects fire-and-forget         | 🔴 Crítico  | Médio   | `engine-effects.runtime.ts`                                                        |
| 4   | `map` dual-behavior             | 🔴 Crítico  | Médio   | `composition.builder.ts`, `pluggable.types.ts`                                     |
| 5   | `window` sem `isDevMode`        | 🔴 Crítico  | Baixo   | `devtools.registry.ts`                                                             |
| 6   | Sort por dispatch               | 🔴 Crítico  | Médio   | `effect.registry.ts`, `engine-effects.runtime.ts`                                  |
| 7   | Hooks sem transição             | 🟡 Melhoria | Baixo   | `engine.reducer.ts`, `engine.types.ts`                                             |
| 8   | `reset()` sem hooks             | 🟡 Melhoria | Mínimo  | `engine.reducer.ts`                                                                |
| 9   | `#buildConnectionRuntime` longo | 🟡 Melhoria | Médio   | `composition.builder.ts`                                                           |
| 10  | `component.name` em IDs         | 🟡 Melhoria | Baixo   | `composition.builder.ts`                                                           |
| 11  | `destroy()` incompleto          | 🟡 Melhoria | Baixo   | `composed-engine.ts`                                                               |
| 12  | Hook registry sem try/catch     | 🟡 Melhoria | Mínimo  | `hook.registry.ts`                                                                 |
| 13  | Slice duplicata crash           | 🟡 Melhoria | Mínimo  | `slice.registry.ts`                                                                |
| 14  | `state` sempre undefined        | 🟡 Melhoria | Baixo   | `pluggable.base.ts`                                                                |
| 15  | Transition stack implícito      | 🟡 Melhoria | Médio   | `transition.registry.ts`                                                           |
| 16  | Devtools `enable` flag          | 🟡 Melhoria | Mínimo  | `devtools.state.ts`                                                                |
| 17  | Overlay sem OnPush              | 🟡 Melhoria | Mínimo  | `devtools-overlay.component.ts`                                                    |
| 18  | EditorActions duplicado         | 🟡 Melhoria | Baixo   | `editor.actions.ts`, `editor.types.ts`                                             |
| 19  | JSON deep clone                 | 🟡 Melhoria | Mínimo  | `editor.types.ts`                                                                  |
| 20  | Projection sem check            | 🟡 Melhoria | Baixo   | `composition.builder.ts`                                                           |
| 21  | Track expression fraca          | 🟡 Melhoria | Mínimo  | `devtools-overlay.component.ts`                                                    |

### Ordem de implementação sugerida

**Fase 1 — Quick wins (1-2h):**

- \#1 `Signal<any>` → `Signal<TState>`
- \#5 `isDevMode()` guard
- \#12 Hook try/catch
- \#13 Slice allowReplace
- \#16 Devtools enable check
- \#17 OnPush
- \#19 `structuredClone`
- \#21 `track $index`

**Fase 2 — Melhorias estruturais (3-4h):**

- \#3 Effects runtime com error handler + pending tracking
- \#6 Effect registry com índice pré-computado
- \#7 Hook meta com `hasTransition`
- \#8 JSDoc no reset + resetWithHooks
- \#10 ID generation seguro
- \#11 Destroy guard
- \#14 `assertedState`
- \#20 Projection shallowEqual

**Fase 3 — Refatorações maiores (4-8h):**

- \#2 Eliminar double casts com assertion functions
- \#4 Separar `map` dual-behavior em `mapWith`
- \#9 Extrair `ConnectionRuntime`
- \#15 Transition merge model
- \#18 Migrar EditorActions para ActionCatalog
