import type { Signal } from '@angular/core';
import {
  createComposition,
  createCoreArtifact,
  defineCompositionSchema,
  defineSelections,
  optionalSlot,
  requiredSlot,
} from '@machine-state-component/ui-state';
import { PrimaryActionButtonConfig } from '../../../shared/pluggables/primary-action-button/primary-action-button.pluggable';
import { PrimaryActionButtonPluggableComponent } from '../../../shared/pluggables/primary-action-button/primary-action-button.pluggable';
import {
  createLiveDocsChildDemo,
  LiveDocsChildDemo,
} from '../child-demo/live-docs-child-demo.artifact';
import { liveDocsActions } from './live-docs.actions';
import { liveDocsKernel } from './live-docs.kernel';
import {
  LiveDocsChildProjection,
  LiveDocsState,
  LiveDocsTask,
} from './live-docs.types';

type LiveDocsComposedState = LiveDocsState & {
  primaryAction?: Record<string, never>;
  historyProjection?: LiveDocsChildProjection;
};

const liveDocsCompositionSchema = defineCompositionSchema({
  primaryAction: requiredSlot<PrimaryActionButtonConfig>(),
  history: optionalSlot<Record<string, never>>(),
});

function getVisibleTasks(state: LiveDocsComposedState): LiveDocsTask[] {
  switch (state.filter) {
    case 'open':
      return state.tasks.filter((task) => task.status === 'open');
    case 'done':
      return state.tasks.filter((task) => task.status === 'done');
    default:
      return state.tasks;
  }
}

export function createLiveDocsArtifact(
  demoApi: {
    persistTask: (
      title: string,
      mode: LiveDocsComposedState['nextSaveMode'],
      lang: LiveDocsComposedState['lang'],
    ) => Promise<LiveDocsTask>;
    buildSuccessMessage: (
      title: string,
      lang: LiveDocsComposedState['lang'],
    ) => string;
    buildErrorMessage: (lang: LiveDocsComposedState['lang']) => string;
    buildBlankDraftMessage: (lang: LiveDocsComposedState['lang']) => string;
  },
  childDemoCore: LiveDocsChildDemo = createLiveDocsChildDemo(),
) {
  return createCoreArtifact(liveDocsKernel, {
    services: {
      demoApi,
    },
    selections: defineSelections((state: Signal<LiveDocsComposedState>) => ({
      ...liveDocsKernel.selections(state as unknown as Signal<LiveDocsState>),
      visibleTasks: () => getVisibleTasks(state()),
      canSave: () =>
        state().draftTitle.trim().length > 0 && state().status !== 'saving',
      taskSummary: () => {
        const open = state().tasks.filter(
          (task) => task.status === 'open',
        ).length;
        const done = state().tasks.filter(
          (task) => task.status === 'done',
        ).length;
        const deleted = state().tasks.filter(
          (task) => task.status === 'deleted',
        ).length;

        return {
          total: state().tasks.length,
          open,
          done,
          deleted,
        };
      },
      childProjectionSummary: () => {
        const projection = state().historyProjection;
        if (!projection) {
          return state().lang === 'pt-br'
            ? 'A projection slice so aparece quando voce entra em Composition.'
            : 'The projection slice only appears when you open Composition.';
        }

        return state().lang === 'pt-br'
          ? `${projection.status} | ${projection.eventCount} evento(s) | ultimo: ${projection.lastEventType ?? 'nenhum'}`
          : `${projection.status} | ${projection.eventCount} event(s) | last: ${projection.lastEventType ?? 'none'}`;
      },
    })),
    composition: ({ parentPort }) =>
      createComposition(liveDocsCompositionSchema, { parentPort })
        .withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
          title: 'PrimaryActionButtonPluggable',
          hint: 'A UI do botao continua igual; o core decide quando salvar e como reagir.',
          buttonLabel: 'Salvar tarefa',
          createEvent: () => liveDocsActions.requestSave(),
        })
        .withChildCore('history', childDemoCore.connectionPort)
        .connectChild('history', ({ parent, child, link }) => ({
          parentToChild: [
            link(
              parent.actions.requestSave,
              child.actions.recordParentEvent,
            ).map((event) => ({
              eventType: event.type,
              note: 'O pai disparou requestSave e o child acompanhou o fluxo.',
            })),
          ],
          projection: {
            initialState: {
              status: 'idle',
              eventCount: 0,
              lastEventType: null as string | null,
            },
            select: (childState) => ({
              status: childState.status,
              eventCount: childState.eventCount,
              lastEventType: childState.lastEventType,
            }),
          },
        }))
        .build(),
  });
}

export type LiveDocsArtifact = ReturnType<typeof createLiveDocsArtifact>;
