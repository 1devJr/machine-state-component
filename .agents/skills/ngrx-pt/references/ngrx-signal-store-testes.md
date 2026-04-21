# Testes de NgRx SignalStore

Use esta referencia ao criar ou revisar `*-store.spec.ts`, principalmente quando houver `rxMethod`, entidades, cancelamento ou API publica de store.

## Objetivo

Testar Signal Stores pela API publica, com `TestBed`, tipagem forte e validacao clara de estado, computeds e metodos.

## Regras gerais

- Use `TestBed` para instanciar a store.
- Prefira Vitest quando o projeto suportar.
- Mantenha mocks no nivel de provider.
- Teste API publica primeiro; use `unprotected` apenas quando precisar preparar estado.
- Cubra estado inicial, computeds, metodos sincronos e fluxos assincronos.

## Setup basico

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [MoviesStore, provideZonelessChangeDetection()],
  });
});
```

## Estado inicial

```typescript
it('inicia com defaults esperados', () => {
  const store = TestBed.inject(MoviesStore);

  expect(store.loading()).toBe(false);
  expect(store.movies()).toEqual([]);
});
```

## Uso de `unprotected`

Use `unprotected` para mutar estado protegido apenas em testes.

```typescript
const store = TestBed.inject(CounterStore);
patchState(unprotected(store), { count: 10 });
expect(store.doubleCount()).toBe(20);
```

Quando usar:

- preparar cenarios rapidamente
- validar recomputacao
- simular estado intermediario sem chamar toda a cadeia de metodos

Quando nao usar:

- para esconder falha na API publica
- como substituto de testes de metodos reais

## Computeds

Cada computed relevante merece teste proprio.

```typescript
it('calcula quantidade corretamente', () => {
  const store = TestBed.inject(MoviesStore);
  expect(store.moviesCount()).toBe(3);
});
```

## Metodos e async

- Teste transicao de `loading`.
- Teste dados no sucesso.
- Teste erro e limpeza de estado quando aplicavel.

```typescript
it('carrega filmes', fakeAsync(() => {
  const store = TestBed.inject(MoviesStore);

  store.load('Warner Bros');
  expect(store.loading()).toBe(true);

  tick();

  expect(store.moviesCount()).toBe(2);
  expect(store.loading()).toBe(false);
}));
```

## `rxMethod` com Observables

O teste deve validar tambem cancelamento, debounce ou troca de requisicao quando isso fizer parte da regra.

```typescript
it('cancela requisicao anterior', fakeAsync(() => {
  const store = setup();
  const studio$ = new Subject<string>();

  store.load(studio$);
  studio$.next('Warner Bros');
  tick(50);
  studio$.next('Universal');
  tick(100);

  expect(store.movies()).toEqual([{ id: 2, name: 'Jurassic Park' }]);
}));
```

## `rxMethod` com signals

Se o metodo aceitar signal como entrada:

- teste valor inicial
- teste alteracao posterior da signal
- use `tick()` ou `TestBed.tick()` conforme o fluxo do projeto

```typescript
it('reage a mudancas da signal', fakeAsync(() => {
  const store = setup();
  const studio = signal('Warner Bros');

  store.load(studio);
  tick(100);
  expect(store.movies()).toEqual([{ id: 1, name: 'Harry Potter' }]);

  studio.set('Universal');
  tick(100);
  expect(store.movies()).toEqual([{ id: 2, name: 'Jurassic Park' }]);
}));
```

## Mocks

- Mocke services com `vi.fn()`.
- Retorne `Observable` reais usando `of`, `throwError`, `Subject` e `delay`.
- Limpe mocks entre testes.

## Checklist

- Estado inicial coberto
- Computeds principais cobertos
- Metodo de sucesso coberto
- Metodo de erro coberto
- `loading` e `error` verificados
- Regras de cancelamento ou concorrencia cobertas quando existirem
