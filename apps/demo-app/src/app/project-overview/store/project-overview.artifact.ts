import {
  createComposition,
  createCoreArtifact,
  defineCompositionSchema,
  requiredSlot,
} from '@machine-state-component/ui-state';
import { PrimaryActionButtonConfig } from '../../shared/pluggables/primary-action-button/primary-action-button.pluggable';
import { PrimaryActionButtonPluggableComponent } from '../../shared/pluggables/primary-action-button/primary-action-button.pluggable';
import { projectOverviewActions } from './project-overview.actions';
import { projectOverviewKernel } from './project-overview.kernel';
import { ProjectOverviewServices } from './project-overview.types';

const projectOverviewSchema = defineCompositionSchema({
  primaryAction: requiredSlot<PrimaryActionButtonConfig>(),
});

export function createProjectOverviewArtifact(
  navigation: ProjectOverviewServices['navigation'],
) {
  return createCoreArtifact(projectOverviewKernel, {
    services: {
      navigation,
    },
    composition: ({ parentPort }) =>
      createComposition(projectOverviewSchema, { parentPort })
        .withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
          title: 'Reusable pluggable',
          hint: 'The same pluggable is used in Task Board, but here the core turns it into navigation.',
          buttonLabel: 'Add task',
          createEvent: () => projectOverviewActions.goToTaskCreationPage(),
        })
        .build(),
  });
}

export type ProjectOverviewArtifact = ReturnType<
  typeof createProjectOverviewArtifact
>;
