import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import * as path from 'path';

export interface CoreComponentGeneratorSchema {
  name: string;
  project?: string;
  directory?: string;
  prefix?: string;
  skipFormat?: boolean;
}

export interface NormalizedSchema extends CoreComponentGeneratorSchema {
  targetRoot: string;
  fileName: string;
  className: string;
  propertyName: string;
  constantName: string;
  selector: string;
}

function resolveBaseDirectory(
  tree: Tree,
  options: CoreComponentGeneratorSchema,
): string {
  if (options.directory?.trim()) {
    return options.directory.trim().replace(/\/+$/, '');
  }

  if (options.project?.trim()) {
    const project = readProjectConfiguration(tree, options.project.trim());
    if (project.sourceRoot) {
      return project.projectType === 'application'
        ? joinPathFragments(project.sourceRoot, 'app')
        : joinPathFragments(project.sourceRoot, 'lib');
    }

    return project.root;
  }

  return 'apps/demo-app/src/app';
}

export function normalizeOptions(
  tree: Tree,
  options: CoreComponentGeneratorSchema,
): NormalizedSchema {
  const resolvedNames = names(options.name);
  const baseDirectory = resolveBaseDirectory(tree, options);
  const targetRoot = joinPathFragments(baseDirectory, resolvedNames.fileName);
  const prefix = options.prefix?.trim() || 'app';

  return {
    ...options,
    targetRoot,
    fileName: resolvedNames.fileName,
    className: resolvedNames.className,
    propertyName: resolvedNames.propertyName,
    constantName: resolvedNames.constantName,
    selector: `${prefix}-${resolvedNames.fileName}-core`,
  };
}

export async function runTemplateGenerator(
  tree: Tree,
  options: CoreComponentGeneratorSchema,
  templateRoot: string,
) {
  const normalized = normalizeOptions(tree, options);

  generateFiles(tree, path.join(templateRoot, 'files'), normalized.targetRoot, {
    ...normalized,
    tmpl: '',
  });

  if (!normalized.skipFormat) {
    await formatFiles(tree);
  }
}
