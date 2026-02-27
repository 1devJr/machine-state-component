# Facade na Arquitetura Atual

## Papel da facade

A facade exposta para o componente e para os pluggables vem de:

1. `createComposedEngine(artifact)`
2. `createFacadeBindings(core)`

Isso centraliza:

- `state`
- `actions`
- `selections`
- `composition`
- `engineFacade` (instancia interna da engine para slot directive)

Referencias:

- Runtime da facade: `libs/ui-state/src/lib/engine/facade/engine.facade.ts`
- Bindings: `libs/ui-state/src/lib/engine/core/facade-bindings.ts`
- Exemplo movie facade: `apps/demo-app/src/app/movie-search/facade/movie-search-facade.service.ts`

## Padrao recomendado

```ts
@Injectable()
export class DashboardFacadeService implements OnDestroy {
  readonly core = createComposedEngine(createDashboardArtifact(this.api));
  readonly bindings = createFacadeBindings(this.core);

  readonly state = this.bindings.state;
  readonly actions = this.bindings.actions;
  readonly selections = this.bindings.selections;
  readonly composition = this.bindings.composition;
  readonly engineFacade = this.bindings.engineFacade;

  ngOnDestroy(): void {
    this.bindings.destroy();
  }
}
```

## O que nao vai na facade

- regra de transicao de estado;
- logica pesada de efeito colateral (vai para effects/services);
- mutacao direta de estado.

## Boas praticas

1. Componente casca e pluggables devem usar facade/actions/selections.
2. Evitar dispatch de objetos manuais; usar sempre action creators.
3. Encapsular cleanup no `ngOnDestroy`.
