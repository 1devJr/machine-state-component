import {
  createComposition,
  createCoreArtifact,
  defineCompositionSchema,
  requiredSlot,
} from '@machine-state-component/ui-state';
import { PrimaryActionButtonConfig } from '../../shared/pluggables/primary-action-button/primary-action-button.pluggable';
import { PrimaryActionButtonPluggableComponent } from '../../shared/pluggables/primary-action-button/primary-action-button.pluggable';
import { taskBoardActions } from './task-board.actions';
import { taskBoardKernel } from './task-board.kernel';

const taskBoardSchema = defineCompositionSchema({
  primaryAction: requiredSlot<PrimaryActionButtonConfig>(),
});

export const taskBoardArtifact = createCoreArtifact(taskBoardKernel, {
  composition: ({ parentPort }) =>
    createComposition(taskBoardSchema, { parentPort })
      .withSlot('primaryAction', PrimaryActionButtonPluggableComponent, {
        title: 'Reusable pluggable',
        hint: 'The same pluggable is used in another core, but here it opens a local modal.',
        buttonLabel: 'Add task',
        createEvent: () => taskBoardActions.openCreateTaskModal(),
      })
      .build(),
});
