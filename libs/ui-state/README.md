# @machine-state-component/ui-state

Artifact-first Angular state engine with explicit actions, transitions,
effects, selections, composition slots, child cores, and optional devtools.

## Install

```bash
npm install @machine-state-component/ui-state
```

Peer dependencies:

- `@angular/common ~21.0.0`
- `@angular/core ~21.0.0`

## What It Provides

- Explicit action catalogs
- Transition-driven state updates
- Ordered effect execution
- Derived selections
- Composed cores and child cores
- Slot-based pluggable UI composition
- Optional runtime devtools overlay

## Basic Example

```ts
import { createComposedEngine, createCoreArtifact, createFacadeBindings, defineActionCatalog, defineCoreKernel, defineKernelTransitions, defineSelections } from '@machine-state-component/ui-state';

type Status = 'idle' | 'ready';

interface CounterState {
  status: Status;
  count: number;
}

const counterActions = defineActionCatalog({
  increment: () => ({ type: 'counter/increment' as const }),
  reset: () => ({ type: 'counter/reset' as const }),
});

type CounterEvent = ReturnType<typeof counterActions.increment> | ReturnType<typeof counterActions.reset>;

const counterKernel = defineCoreKernel<CounterState, Status, CounterEvent>({
  id: 'counter',
  store: {
    initialState: {
      status: 'ready',
      count: 0,
    },
  },
  actions: counterActions,
  transitions: defineKernelTransitions({
    on: {
      'counter/increment': (state) => ({
        ...state,
        count: state.count + 1,
      }),
      'counter/reset': (state) => ({
        ...state,
        count: 0,
      }),
    },
  }),
  effects: [],
  selections: defineSelections({
    doubled: (state) => state.count * 2,
  }),
});

const counterArtifact = createCoreArtifact(counterKernel, {
  composition: () => ({ slots: {}, slotIds: {} }),
});

const counterCore = createComposedEngine(counterArtifact);
const counterFacade = createFacadeBindings(counterCore);
```

## Build This Package Locally

From this repository:

```bash
npm run build:ui-state
npm run pack:ui-state
```

The distributable package is generated in `dist/libs/ui-state`.

## Version And Publish

Bump the package version locally:

```bash
npm run version:ui-state -- patch
```

You can also provide an explicit version:

```bash
npm run version:ui-state -- 0.1.0
```

Validate the publish output without pushing to npm:

```bash
npm run publish:ui-state:dry-run
```

Publish the package:

```bash
npm run publish:ui-state
```

## GitHub Actions Publish Flow

The repository includes a manual workflow at
`.github/workflows/publish-ui-state.yml`.

Required setup:

- Add an `NPM_TOKEN` repository secret with publish permission for
  `@machine-state-component/ui-state`.
- Run the workflow manually from GitHub Actions.
- Optionally pass `patch`, `minor`, `major`, or an explicit version before
  publishing.

When the workflow runs with a real publish and a version input, it updates
`libs/ui-state/package.json`, creates a git tag in the format
`ui-state-v<version>`, and pushes both back to the repository.
