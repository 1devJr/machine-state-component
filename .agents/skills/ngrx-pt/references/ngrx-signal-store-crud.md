# SignalStore CRUD

Use esta referencia quando o pedido for criar ou revisar uma store completa de feature com CRUD, entidades, service e testes.

## Objetivo

Criar uma Signal Store completa para uma feature, seguindo a organizacao do projeto e cobrindo modelagem, API da store e testes.

## Perguntas que precisam estar claras

- Qual e o dominio da feature?
- A store e global, de feature ou de component?
- Existe colecao de entidades?
- Quais operacoes assincronas existem?
- Quais computeds a UI precisa?

## Pre-requisitos

- Modelo da entidade definido
- Nome da store definido
- Nome da entidade definido
- Service HTTP existente ou escopo claro para cria-lo

## Arquivos tipicos

- `data/models/*.model.ts`
- `data/infrastructure/*-api.ts`
- `data/state/*-store.ts`
- `data/state/*-store.spec.ts`

## Estrutura base

```typescript
export interface TaskState {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

const initialTaskState: TaskState = {
  loading: false,
  error: null,
  selectedId: null,
};

const taskEntityConfig = entityConfig({
  entity: type<Task>(),
  collection: 'tasks',
  selectId: (task: Task) => task.id,
});

export const TaskStore = signalStore(
  { providedIn: 'root' },
  withState(initialTaskState),
  withEntities(taskEntityConfig),
  withComputed(...),
  withMethods(...),
);
```

## Fluxo rapido

1. Levante os requisitos da feature.
2. Crie ou ajuste models, se ainda nao existirem.
3. Crie ou ajuste o service de infraestrutura.
4. Implemente a store com `withState`, `withEntities`, `withComputed` e `withMethods`.
5. Use `rxMethod` para operacoes assincronas baseadas em `Observable`.
6. Crie testes de estado inicial, computeds, CRUD, loading e erro.
7. Valide a integracao com o component.

## Metodos CRUD esperados

- `loadTasks`
- `loadTaskById`
- `createTask`
- `updateTask`
- `deleteTask`
- `selectTask`

Todos os metodos assincronos devem usar `rxMethod`.

## Computeds minimos

- `selectedTask`
- `totalTaskCount`
- `hasData`
- `isEmpty`

## Regras de implementacao

- `signalStore` como base
- `withState` para estado base
- `withEntities` para colecoes
- `withComputed` para derivacoes
- `withMethods` para comandos
- `inject()` para dependencias
- `rxMethod` para APIs com `Observable`
- `patchState` para toda atualizacao

## Tratamento de erro

- Use `tapResponse`.
- Limpe erro antigo quando iniciar nova operacao, se fizer sentido.
- Atualize `loading` em sucesso e erro.
- Gere mensagens de erro coerentes com o dominio.

## Operacoes com entidades

- `setAllEntities` para carga total
- `addEntity` para criacao
- `updateEntity` para atualizacao
- `removeEntity` para remocao

## Integracao com component

O component deve:

- injetar a store
- ler signals para dados, loading e erro
- chamar metodos da store em acoes de UI
- evitar subscriptions manuais quando a store ja entrega signal

## Regras de teste

- validar estado inicial
- validar computeds
- validar transicoes de loading e erro
- validar operacoes CRUD
- usar `unprotected` apenas para preparar cenarios de teste

## Antes de finalizar

- confira tipagem
- confira `selectId`
- confira nomes consistentes de entidade e colecao
- confira testes de sucesso e erro

## Quando parar e simplificar

Se a feature nao precisa de compartilhamento real, CRUD, selecao ou coordenacao assincrona consistente, provavelmente `signal()` puro resolve melhor do que uma store completa.
