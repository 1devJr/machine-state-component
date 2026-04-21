# NgRx SignalStore

Use esta referencia quando a tarefa envolver `signalStore`, `withState`, `withComputed`, `withMethods`, `withEntities`, `rxMethod` ou arquitetura de store baseada em signals.

## Quando aplicar

- Arquivos `*-store.ts`
- Features com Signal Store v21+
- Stores que combinam estado de feature, entidades e chamadas HTTP
- Refatoracao de estado compartilhado para uma API baseada em signals

## Regras principais

| Regra                                                           | Prioridade | Orientacao                                                                      |
| --------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| Use `SignalStore` para estado de feature e estado compartilhado | Alta       | Evite Store classico quando a composicao com signals resolve com menos overhead |
| Use `withComputed` para estado derivado                         | Media      | Coloque agregacoes, filtros e selecoes na store                                 |
| Use `rxMethod` para RxJS e APIs baseadas em `Observable`        | Media      | Debounce, cancelamento, `switchMap` e erro ficam mais previsiveis               |
| Use `withEntities` para colecoes                                | Media      | Prefira operacoes atomicas e acesso por mapa                                    |

## Heuristicas

- Mantenha o estado inicial tipado e com defaults significativos.
- Atualize com `patchState`, nunca com mutacao direta.
- Reserve `computed` para derivacao; efeitos colaterais ficam em `rxMethod`, hooks ou metodos bem definidos.
- Se o estado for estritamente local a um component, prefira `signal()` puro antes de introduzir uma store.
- Se a colecao precisar de busca por id, selecao, contagem e CRUD, `withEntities` tende a ser a melhor base.

## Principios de arquitetura

- Modele a store ao redor das necessidades da feature, nao ao redor da API.
- Mantenha o estado em estrutura hierarquica e tipada.
- Use `computed` para derivacoes e `patchState` para atualizacoes imutaveis.
- Prefira composicao com `withState`, `withComputed`, `withMethods`, `withEntities`, `withProps`, `withHooks`, `withFeature` e `withLinkedState`.
- Para side effects baseados em `Observable`, use `rxMethod`.
- Para efeitos leves dirigidos por signal, `signalMethod` pode ser suficiente.

## Estrutura recomendada

```typescript
export interface UserState {
  selectedUserId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  selectedUserId: null,
  loading: false,
  error: null,
};
```

- O estado raiz deve ser um objeto.
- Defaults devem ser significativos.
- Evite arrays soltos como raiz da store.

## Configurando Signal Store

```typescript
export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(...),
  withMethods(...),
);
```

Boas praticas:

- Use `{ providedIn: 'root' }` para estado compartilhado da app.
- Use providers de feature ou component quando o escopo nao precisar ser global.
- Prefixe membros privados com `_`.
- Garanta nomes unicos entre estado, computeds e metodos.

## Entity management

Quando a feature gerencia colecoes, prefira `withEntities`.

```typescript
const userEntityConfig = entityConfig({
  entity: type<User>(),
  collection: 'users',
  selectId: (user: User) => user.id,
});
```

Regras:

- Sempre defina `selectId`.
- Prefira `addEntity`, `updateEntity`, `removeEntity` e `setAllEntities`.
- Evite sobrescrever a colecao inteira quando uma operacao atomica resolve.
- Use computed para selecoes como item selecionado, total e relacoes derivadas.

## withComputed

Use `withComputed` para:

- item selecionado
- totais e contagens
- flags como `hasData`, `isEmpty`, `canSave`
- relacoes entre entidades

Nao use `withComputed` para:

- IO
- `patchState`
- chamada de service

## withMethods

Defina metodos de negocio dentro de `withMethods`.

```typescript
withMethods((store, userService = inject(UserService)) => ({
  selectUser(userId: string | null) {
    patchState(store, { selectedUserId: userId });
  },
}));
```

Regras:

- Metodos devem ter nomes claros e orientados a acao.
- Injete dependencias com `inject()`.
- Mantenha os updates centralizados na store.
- Evite misturar logica de template dentro dos metodos.

## rxMethod

Use `rxMethod` quando um metodo precisar consumir `Observable`.

```typescript
loadUsers: rxMethod<void>(
  pipe(
    switchMap(() => {
      patchState(store, { loading: true, error: null });

      return userService.getUsers().pipe(
        tapResponse({
          next: (users) =>
            patchState(store, setAllEntities(users, userEntityConfig), {
              loading: false,
            }),
          error: () =>
            patchState(store, {
              loading: false,
              error: 'Falha ao carregar usuarios',
            }),
        }),
      );
    }),
  ),
),
```

Regras:

- Se o service retorna `Observable`, use `rxMethod`.
- Nao converta para `Promise` so para usar `async` e `await`.
- Zere erro antigo ao iniciar nova carga quando fizer sentido.
- Atualize `loading` em todos os ramos de sucesso e erro.

## Recursos avancados

Use quando houver necessidade real:

- `withProps`: expor dependencias, observables ou configuracoes
- `withHooks`: inicializacao e teardown da store
- `withFeature`: compor blocos reutilizaveis entre stores
- `withLinkedState`: resetar estado derivado a partir de outra signal

## Integracao com components

- O component deve ler signals da store, nao criar subscriptions manuais desnecessarias.
- O template deve consumir computeds e metodos da store.
- Components container podem apenas orquestrar chamadas e renderizacao.

## Checklist rapido

- A store tem interface de estado explicita.
- Os nomes dos metodos sao orientados a acao.
- Erros e loading sao tratados de forma consistente.
- O template le signals da store em vez de assinaturas manuais.
- A store nao mistura logica de apresentacao com logica de acesso a dados.

## Antipadroes

- Colocar side effect em `computed`.
- Usar `Promise` quando a fonte ja e `Observable`.
- Espalhar regra de loading e erro em varios componentes.
- Recriar a mesma logica de selecao em varios lugares.
- Atualizar arrays de entidades manualmente sem necessidade.
