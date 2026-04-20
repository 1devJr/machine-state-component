import {
  createChildComposedEngine,
  createComposition,
  defineCompositionSchema,
} from '@machine-state-component/ui-state';
import { liveDocsChildDemoKernel } from './store/live-docs-child-demo.kernel';

const liveDocsChildDemoSchema = defineCompositionSchema({});

export function createLiveDocsChildDemo() {
  return createChildComposedEngine(liveDocsChildDemoKernel, {
    composition: () => createComposition(liveDocsChildDemoSchema).build(),
  });
}

export type LiveDocsChildDemo = ReturnType<typeof createLiveDocsChildDemo>;
