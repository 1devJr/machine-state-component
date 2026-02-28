# Machine State Component

Workspace Nx focado na extração da engine Angular plugável.

## Projetos ativos

- `libs/ui-state`: contém apenas a engine em `libs/ui-state/src/lib/engine`.
- `apps/demo-app`: app Angular mínimo (casca vazia).

## Comandos principais

```sh
npm run test
npm run lint
npm start
```

Notas:

- Os scripts usam `NX_DAEMON=false` e `NX_ISOLATE_PLUGINS=false` para contornar falha de plugin worker no ambiente atual.
- O build do app pode falhar em `Node v25.x` por incompatibilidade do toolchain Angular/Nx. Para build estável, use Node LTS (20/22).
