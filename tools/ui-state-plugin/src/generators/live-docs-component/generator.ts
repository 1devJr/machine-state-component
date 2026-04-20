import { formatFiles, joinPathFragments, Tree } from '@nx/devkit';
import { CoreComponentGeneratorSchema, normalizeOptions } from '../shared';

const liveDocsReferenceRoot = 'apps/demo-app/src/app/live-docs';
const sharedPluggableRoot =
  'apps/demo-app/src/app/shared/pluggables/primary-action-button';

function collectRelativeFiles(
  tree: Tree,
  root: string,
  currentPath = '',
): string[] {
  const absolutePath = currentPath
    ? joinPathFragments(root, currentPath)
    : root;
  const children = tree.children(absolutePath);

  return children.flatMap((child) => {
    const relativeChildPath = currentPath
      ? joinPathFragments(currentPath, child)
      : child;
    const absoluteChildPath = joinPathFragments(root, relativeChildPath);
    const nestedChildren = tree.children(absoluteChildPath);

    if (nestedChildren.length > 0) {
      return collectRelativeFiles(tree, root, relativeChildPath);
    }

    return tree.read(absoluteChildPath) ? [relativeChildPath] : [];
  });
}

function renameReferenceFile(relativePath: string, fileName: string): string {
  return relativePath
    .replace('live-docs-page.component', `${fileName}.component`)
    .replace('live-docs.content', `${fileName}.content`)
    .replace('live-docs-mermaid.directive', `${fileName}-mermaid.directive`)
    .replace(
      'live-docs-code-viewer.component',
      `${fileName}-code-viewer.component`,
    )
    .replace('live-docs-example.component', `${fileName}-example.component`)
    .replace('live-docs-facade.service', `${fileName}-facade.service`)
    .replace('live-docs.mock.service', `${fileName}.mock.service`)
    .replace(/live-docs-child-demo/g, `${fileName}-child-demo`)
    .replace(/live-docs/g, fileName);
}

function transformReferenceContent(
  content: string,
  normalized: ReturnType<typeof normalizeOptions>,
): string {
  const replacements: Array<[string | RegExp, string]> = [
    ['LiveDocsPageComponent', `${normalized.className}Component`],
    ['app-live-docs-page', `${normalized.prefix}-${normalized.fileName}`],
    ['live-docs-page.component', `${normalized.fileName}.component`],
    ['LiveDocsExampleComponent', `${normalized.className}ExampleComponent`],
    ['live-docs-example.component', `${normalized.fileName}-example.component`],
    ['LiveDocsMermaidDirective', `${normalized.className}MermaidDirective`],
    ['live-docs-mermaid.directive', `${normalized.fileName}-mermaid.directive`],
    ['LiveDocsFacadeService', `${normalized.className}FacadeService`],
    ['LiveDocsMockService', `${normalized.className}MockService`],
    ['LiveDocsChildDemoComponent', `${normalized.className}ChildDemoComponent`],
    ['LiveDocsChildDemoState', `${normalized.className}ChildDemoState`],
    ['LiveDocsChildDemoStatus', `${normalized.className}ChildDemoStatus`],
    ['LiveDocsChildProjection', `${normalized.className}ChildProjection`],
    ['LiveDocsChildDemo', `${normalized.className}ChildDemo`],
    ['live-docs-child-demo', `${normalized.fileName}-child-demo`],
    ['LiveDocsSectionId', `${normalized.className}SectionId`],
    [
      '../../../shared/pluggables/primary-action-button/primary-action-button.pluggable',
      '../pluggables/primary-action-button/primary-action-button.pluggable',
    ],
    ['live-docs.content', `${normalized.fileName}.content`],
    ['liveDocs', normalized.propertyName],
    ['LiveDocs', normalized.className],
    [/live-docs/g, normalized.fileName],
  ];

  return replacements.reduce((nextContent, [from, to]) => {
    if (typeof from === 'string') {
      return nextContent.split(from).join(to);
    }

    return nextContent.replace(from, to);
  }, content);
}

function readSourceFile(tree: Tree, path: string): string {
  const buffer = tree.read(path);

  if (!buffer) {
    throw new Error(`Could not read live docs reference file at "${path}".`);
  }

  return buffer.toString('utf-8');
}

export default async function liveDocsComponentGenerator(
  tree: Tree,
  options: CoreComponentGeneratorSchema,
) {
  const normalized = normalizeOptions(tree, options);
  const referenceFiles = collectRelativeFiles(tree, liveDocsReferenceRoot);
  const sharedPluggableFiles = collectRelativeFiles(tree, sharedPluggableRoot);

  for (const relativePath of referenceFiles) {
    const sourcePath = joinPathFragments(liveDocsReferenceRoot, relativePath);
    const destinationPath = joinPathFragments(
      normalized.targetRoot,
      renameReferenceFile(relativePath, normalized.fileName),
    );
    const sourceContent = readSourceFile(tree, sourcePath);

    tree.write(
      destinationPath,
      transformReferenceContent(sourceContent, normalized),
    );
  }

  for (const relativePath of sharedPluggableFiles) {
    const sourcePath = joinPathFragments(sharedPluggableRoot, relativePath);
    const destinationPath = joinPathFragments(
      normalized.targetRoot,
      'example/pluggables/primary-action-button',
      relativePath,
    );

    tree.write(destinationPath, readSourceFile(tree, sourcePath));
  }

  if (!normalized.skipFormat) {
    await formatFiles(tree);
  }
}
