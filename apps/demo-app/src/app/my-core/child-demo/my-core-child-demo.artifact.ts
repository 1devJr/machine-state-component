import {
  createChildComposedEngine,
  createComposition,
  defineCompositionSchema,
} from '@machine-state-component/ui-state';
import { myCoreChildDemoKernel } from './store/my-core-child-demo.kernel';

const myCoreChildDemoSchema = defineCompositionSchema({});

export function createMyCoreChildDemo() {
  return createChildComposedEngine(myCoreChildDemoKernel, {
    composition: () => createComposition(myCoreChildDemoSchema).build(),
  });
}

export type MyCoreChildDemo = ReturnType<typeof createMyCoreChildDemo>;
