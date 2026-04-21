# NgRx Classico e ComponentStore

Use esta referencia quando a tarefa envolver Store classico, Effects, Entity, `selectSignal()` ou `ComponentStore`.

## Quando aplicar

- Criar ou alterar `actions`, `reducers`, `selectors` e `effects`
- Registrar feature state com `provideStore`
- Integrar store classico com componentes Angular
- Modelar colecoes com `@ngrx/entity`
- Usar `ComponentStore` como alternativa leve a um store global

## Setup basico

```typescript
// app.config.ts
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export const appConfig: ApplicationConfig = {
  providers: [provideStore({ users: usersReducer }), provideEffects([UsersEffects]), provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })],
};
```

## Actions

Prefira `createActionGroup` em vez de criadores soltos.

```typescript
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),
    'Add User': props<{ user: User }>(),
    'Remove User': props<{ id: number }>(),
  },
});
```

## Reducers e feature

Prefira `createFeature` para encapsular reducer e selectors gerados.

```typescript
import { createFeature, createReducer, on } from '@ngrx/store';

export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UsersActions.loadUsers, (state) => ({ ...state, loading: true, error: null })),
    on(UsersActions.loadUsersSuccess, (state, { users }) => ({
      ...state,
      users,
      loading: false,
    })),
    on(UsersActions.loadUsersFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })),
  ),
});

export const { selectUsers, selectLoading, selectError } = usersFeature;
```

## Effects

- Effects cuidam de IO, APIs, navegacao e outros efeitos colaterais.
- Reducers permanecem puros.
- Prefira retornar actions do effect em vez de disparar cascatas manuais.

```typescript
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';

export class UsersEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      exhaustMap(() =>
        this.userService.getUsers().pipe(
          map((users) => UsersActions.loadUsersSuccess({ users })),
          catchError((error) => of(UsersActions.loadUsersFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
```

## Entity

Use `@ngrx/entity` quando a feature trabalha com colecoes grandes, lookup por id ou atualizacoes atomicas frequentes.

- Prefira adapters para `addOne`, `setAll`, `updateOne` e `removeOne`.
- Mantenha selectors de lista, ids e entidades no mesmo dominio da feature.
- Nao recrie arrays manualmente quando o adapter ja resolve a operacao.

## Integracao com components

Em components modernos, prefira `selectSignal()` para leitura reativa.

```typescript
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

@Component({
  standalone: true,
  template: `
    @if (loading()) {
      <app-spinner />
    }

    @for (user of users(); track user.id) {
      <app-user-card [user]="user" (delete)="remove(user.id)" />
    }
  `,
})
export class UsersComponent {
  private store = inject(Store);

  users = this.store.selectSignal(selectUsers);
  loading = this.store.selectSignal(selectLoading);

  constructor() {
    this.store.dispatch(UsersActions.loadUsers());
  }

  remove(id: number) {
    this.store.dispatch(UsersActions.removeUser({ id }));
  }
}
```

## ComponentStore

Use `ComponentStore` quando quiser isolamento e menos cerimonia do que um store global.

```typescript
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { switchMap } from 'rxjs';

interface UsersState {
  users: User[];
  loading: boolean;
}

@Injectable()
export class UsersStore extends ComponentStore<UsersState> {
  constructor(private userService: UserService) {
    super({ users: [], loading: false });
  }

  readonly users = this.selectSignal((state) => state.users);
  readonly loading = this.selectSignal((state) => state.loading);

  readonly loadUsers = this.effect<void>((trigger$) =>
    trigger$.pipe(
      switchMap(() => {
        this.patchState({ loading: true });
        return this.userService.getUsers().pipe(
          tapResponse(
            (users) => this.patchState({ users, loading: false }),
            () => this.patchState({ loading: false }),
          ),
        );
      }),
    ),
  );
}
```

## Antipadroes

| Antipadrao                                 | Problema                         | Preferivel                     |
| ------------------------------------------ | -------------------------------- | ------------------------------ |
| Usar Store global para estado de UI local  | Overengineering                  | `signal()` ou `ComponentStore` |
| Fazer side effects em reducer              | Viola pureza                     | Mover para `Effects`           |
| Assinar selectors manualmente no component | Mais boilerplate e risco de leak | `selectSignal()`               |
| Nao usar `createActionGroup`               | API verbosa e dispersa           | Consolidar actions por dominio |

## Diagnostico rapido

| Sintoma                      | Causa comum                           | Correcao                                |
| ---------------------------- | ------------------------------------- | --------------------------------------- |
| Estado nao atualiza          | Mutacao acidental                     | Retorne novo objeto ou array no reducer |
| Effect nao dispara           | `ofType()` errado ou provider ausente | Verifique action e `provideEffects()`   |
| Selector retorna `undefined` | Feature nao registrada                | Revise `provideStore()`                 |
| DevTools nao aparece         | Provider ausente                      | Adicione `provideStoreDevtools()`       |
