# MachineStateComponent

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/owFLYtY4Zf)

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve demo-app
```

To create a production bundle:

```sh
npx nx build demo-app
```

To see all available targets to run for a project, run:

````sh
# Machine State Component (Nx + Angular + Signals)

Monorepo com Nx (Angular 21, SCSS) demonstrando um controle complexo guiado por máquina de estados explícita e sinais. Inclui uma lib de design `@zardui/angular` (implementação interna inspirada em shadcn) e uma lib de UI (`ui-state`) que orquestra a máquina.

## Estrutura
- `apps/demo-app`: app Angular standalone consumindo a máquina de estado.
- `libs/zard-ui`: primitives de UI internas (`zui-button`, `zui-card`, etc.) exportadas como `@zardui/angular`.
- `libs/ui-state`: componente `UiStatePanel` com máquina de estados explícita + sinais, storybook e testes com Vitest.

## Rodar
```sh
npm install --legacy-peer-deps
npm start            # nx serve demo-app
npm run e2e          # nx e2e demo-app (Cypress)
npm test             # nx test ui-state (Vitest executor)
npm run storybook    # nx storybook ui-state
npm run build        # nx build demo-app
````

## Lint, formato e hooks

- `npm run lint` executa ESLint (Angular + cypress rules).
- `npm run format` usa `nx format:write`.
- Husky + lint-staged: `pre-commit` roda `npx lint-staged` nos arquivos staged.

## Notas

- `@zardui/angular` é fornecida localmente em `libs/zard-ui` porque não há pacote público disponível.
- Storybook 8 é usado com Angular 21 sob `--legacy-peer-deps`; esperar avisos de peer dependency.
- A máquina de estados é coberta por testes Vitest em `libs/ui-state/src/lib/ui-state/ui-state.spec.ts`.
