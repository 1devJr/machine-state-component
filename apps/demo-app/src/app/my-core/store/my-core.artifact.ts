import type { Signal } from '@angular/core';
import {
  createComposition,
  createCoreArtifact,
  defineCompositionSchema,
  defineSelections,
  optionalSlot,
  requiredSlot,
} from '@machine-state-component/ui-state';
import {
  createMyCoreChildDemo,
  MyCoreChildDemo,
} from '../child-demo/my-core-child-demo.artifact';
import { MyCoreControlsPluggableComponent } from '../pluggables/controls/my-core-controls.pluggable';
import { MyCoreDiagnosticsPluggableComponent } from '../pluggables/diagnostics/my-core-diagnostics.pluggable';
import { MyCoreDocsPluggableComponent } from '../pluggables/docs/my-core-docs.pluggable';
import { myCoreAdvancedFeatures, myCoreFileRules } from './my-core.docs';
import {
  myCoreAdvancedFeaturesPtBr,
  myCoreFileRulesPtBr,
} from './my-core.docs.pt-br';
import { myCoreKernel } from './my-core.kernel';
import {
  MyCoreControlsConfig,
  MyCoreDiagnosticsConfig,
  MyCoreDocsConfig,
  MyCoreFlowSummary,
  MyCoreServices,
  MyCoreState,
} from './my-core.types';

type MyCoreComposedState = MyCoreState & {
  controls?: {
    lastScenario: string | null;
  };
  diagnostics?: {
    pinnedTimeline: boolean;
  };
  docs?: {
    lastMode: string;
  };
  scratchpad?: {
    mountedAt: string;
    toggles: number;
  };
  childDemoProjection?: {
    status: string;
    eventCount: number;
    lastEventType: string | null;
  };
};

export interface MyCoreRuntimeInspector {
  getEventTimeline: () => readonly {
    id: number;
    type: string;
    summary: string;
  }[];
  getStateSnapshot: () => Record<string, unknown>;
  getSelectionSnapshot: () => Record<string, unknown>;
  getSliceKeys: () => readonly string[];
  getEffects: () => ReadonlyArray<{
    id: string;
    event: string;
    priority: number;
  }>;
  getFlowSummary: () => MyCoreFlowSummary;
}

export const myCoreCompositionSchema = defineCompositionSchema({
  controls: requiredSlot<MyCoreControlsConfig>(),
  diagnostics: requiredSlot<MyCoreDiagnosticsConfig>(),
  docs: requiredSlot<MyCoreDocsConfig>(),
  childDemo: optionalSlot<Record<string, never>>(),
});

export function createMyCoreArtifact(
  demoApi: MyCoreServices['demoApi'],
  runtimeBridge: MyCoreServices['runtimeBridge'],
  childDemoCore: MyCoreChildDemo = createMyCoreChildDemo(),
  runtimeInspector?: MyCoreRuntimeInspector,
) {
  return createCoreArtifact(myCoreKernel, {
    services: {
      demoApi,
      runtimeBridge,
    },
    selections: defineSelections((state: Signal<MyCoreComposedState>) => ({
      ...myCoreKernel.selections(state as unknown as Signal<MyCoreState>),
      registeredSliceKeys: () =>
        [
          'controls',
          'diagnostics',
          'docs',
          'childDemoProjection',
          'scratchpad',
        ].filter(
          (key) => state()[key as keyof MyCoreComposedState] !== undefined,
        ),
      hasChildProjection: () => !!state().childDemoProjection,
      childProjectionSummary: () => {
        const projection = state().childDemoProjection;
        if (!projection) {
          return state().lang === 'pt-br'
            ? 'A projecao do core filho ainda nao foi montada.'
            : 'The child-core projection is not mounted yet.';
        }

        return state().lang === 'pt-br'
          ? `${projection.status} | ${projection.eventCount} evento(s) | ultimo: ${projection.lastEventType ?? 'nenhum'}`
          : `${projection.status} | ${projection.eventCount} event(s) | last: ${projection.lastEventType ?? 'none'}`;
      },
    })),
    composition: (ctx) =>
      createComposition(myCoreCompositionSchema, {
        parentPort: ctx.parentPort,
      })
        .withSlot(
          'controls',
          MyCoreControlsPluggableComponent,
          {
            title: 'Interactive playground',
            subtitle:
              'Dispatch one action and inspect the result before moving to the next concept.',
            successLabel: 'Run success flow',
            errorLabel: 'Run error flow',
            resetLabel: 'Reset',
          },
          {
            sliceInitialState: {
              lastScenario: null as string | null,
            },
          },
        )
        .withSlot(
          'diagnostics',
          MyCoreDiagnosticsPluggableComponent,
          {
            getEventTimeline: runtimeInspector?.getEventTimeline ?? (() => []),
            getStateSnapshot:
              runtimeInspector?.getStateSnapshot ?? (() => ({})),
            getSelectionSnapshot:
              runtimeInspector?.getSelectionSnapshot ?? (() => ({})),
            getSliceKeys: runtimeInspector?.getSliceKeys ?? (() => []),
            getEffects: runtimeInspector?.getEffects ?? (() => []),
            getFlowSummary:
              runtimeInspector?.getFlowSummary ??
              (() => ({
                action: 'none',
                transition: 'No transition yet.',
                effect: 'none',
                changedFields: [],
                message: 'No runtime activity yet.',
              })),
          },
          {
            sliceInitialState: {
              pinnedTimeline: false,
            },
          },
        )
        .withSlot(
          'docs',
          MyCoreDocsPluggableComponent,
          {
            fileRules: myCoreFileRules,
            fileRulesPtBr: myCoreFileRulesPtBr,
            advancedFeatures: myCoreAdvancedFeatures,
            advancedFeaturesPtBr: myCoreAdvancedFeaturesPtBr,
          },
          {
            sliceInitialState: {
              lastMode: 'flow',
            },
          },
        )
        .withChildCore('childDemo', childDemoCore.connectionPort)
        .connectChild('childDemo', ({ parent, child, link }) => ({
          parentToChild: [
            link(
              parent.actions.runDemoAction,
              child.actions.recordParentEvent,
            ).map((event) => ({
              eventType: event.type,
              note: `Parent dispatched "${event.label}".`,
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

export type MyCoreArtifact = ReturnType<typeof createMyCoreArtifact>;
