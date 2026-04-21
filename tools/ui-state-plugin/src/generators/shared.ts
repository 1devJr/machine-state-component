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

export interface LazyRouteDefinition {
  routePath: string;
  componentImportPath: string;
  componentClassName: string;
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

function ensureRelativeImportPath(targetPath: string): string {
  return targetPath.startsWith('.') ? targetPath : `./${targetPath}`;
}

function findNearestAppRoutesPath(
  tree: Tree,
  startPath: string,
): string | null {
  let currentPath = startPath.replace(/\/+$/, '');

  while (currentPath) {
    const candidatePath = joinPathFragments(currentPath, 'app.routes.ts');
    if (tree.exists(candidatePath)) {
      return candidatePath;
    }

    const parentPath = path.posix.dirname(currentPath);
    if (parentPath === currentPath || parentPath === '.') {
      break;
    }

    currentPath = parentPath;
  }

  return tree.exists('app.routes.ts') ? 'app.routes.ts' : null;
}

export function buildLazyRouteDefinition(
  targetRoot: string,
  componentFileName: string,
  componentClassName: string,
  appRoutesPath: string,
): LazyRouteDefinition {
  const appDirectory = path.posix.dirname(appRoutesPath);
  const routePath = path.posix.relative(appDirectory, targetRoot);
  const componentFilePath = joinPathFragments(
    targetRoot,
    componentFileName.replace(/\.ts$/, ''),
  );
  const componentImportPath = ensureRelativeImportPath(
    path.posix.relative(appDirectory, componentFilePath),
  );

  return {
    routePath,
    componentImportPath,
    componentClassName,
  };
}

export function addLazyRouteToAppRoutes(
  tree: Tree,
  targetRoot: string,
  componentFileName: string,
  componentClassName: string,
) {
  const appRoutesPath = findNearestAppRoutesPath(tree, targetRoot);

  if (!appRoutesPath) {
    throw new Error(
      `Could not find an app.routes.ts file above "${targetRoot}". ` +
        'Use the generator inside an Angular app source tree.',
    );
  }

  const routeDefinition = buildLazyRouteDefinition(
    targetRoot,
    componentFileName,
    componentClassName,
    appRoutesPath,
  );
  const appRoutesBuffer = tree.read(appRoutesPath);

  if (!appRoutesBuffer) {
    throw new Error(`Could not read routes file at "${appRoutesPath}".`);
  }

  const appRoutesContent = appRoutesBuffer.toString('utf-8');
  const existingPathPattern = new RegExp(
    `path:\\s*['"]${routeDefinition.routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
  );

  if (existingPathPattern.test(appRoutesContent)) {
    return;
  }

  const routeBlock =
    `  {\n` +
    `    path: '${routeDefinition.routePath}',\n` +
    `    loadComponent: () =>\n` +
    `      import('${routeDefinition.componentImportPath}').then(\n` +
    `        (module) => module.${routeDefinition.componentClassName},\n` +
    `      ),\n` +
    `  },`;
  const routesArrayMatch =
    /(export const\s+\w+\s*:\s*Routes\s*=\s*\[)([\s\S]*?)(\]\s*;)/m.exec(
      appRoutesContent,
    );

  if (!routesArrayMatch) {
    throw new Error(
      `Could not find a Routes array declaration inside "${appRoutesPath}".`,
    );
  }

  const [, arrayPrefix, routesBody, arraySuffix] = routesArrayMatch;
  const wildcardMatch = /\{\s*path:\s*['"]\*\*['"]/.exec(routesBody);

  let nextRoutesBody: string;

  if (!routesBody.trim()) {
    nextRoutesBody = `\n${routeBlock}\n`;
  } else if (wildcardMatch) {
    nextRoutesBody =
      `${routesBody.slice(0, wildcardMatch.index)}` +
      `${routeBlock}\n` +
      `${routesBody.slice(wildcardMatch.index)}`;
  } else {
    const separator = routesBody.endsWith('\n') ? '' : '\n';
    nextRoutesBody = `${routesBody}${separator}${routeBlock}\n`;
  }

  const insertIndex = routesArrayMatch.index;

  tree.write(
    appRoutesPath,
    `${appRoutesContent.slice(0, insertIndex)}` +
      `${arrayPrefix}${nextRoutesBody}${arraySuffix}` +
      `${appRoutesContent.slice(insertIndex + routesArrayMatch[0].length)}`,
  );
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
