import { Tree } from '@nx/devkit';
import { CoreComponentGeneratorSchema, runTemplateGenerator } from '../shared';

export default async function coreComponentGenerator(
  tree: Tree,
  options: CoreComponentGeneratorSchema,
) {
  await runTemplateGenerator(tree, options, __dirname);
}
