import { formatFiles, joinPathFragments, Tree } from '@nx/devkit';
import { CoreComponentGeneratorSchema, normalizeOptions } from '../shared';

const liveDocsTemplateRoot =
  'tools/ui-state-plugin/src/generators/live-docs-component/files';
const fileRenameTokens = {
  pageComponent: '__LIVE_DOCS_PAGE_COMPONENT__',
  content: '__LIVE_DOCS_CONTENT__',
  mermaidDirective: '__LIVE_DOCS_MERMAID_DIRECTIVE__',
  codeViewerComponent: '__LIVE_DOCS_CODE_VIEWER_COMPONENT__',
  exampleComponent: '__LIVE_DOCS_EXAMPLE_COMPONENT__',
  facadeService: '__LIVE_DOCS_FACADE_SERVICE__',
  mockService: '__LIVE_DOCS_MOCK_SERVICE__',
  childDemo: '__LIVE_DOCS_CHILD_DEMO__',
} as const;

const contentRenameTokens = {
  pageComponent: '__LIVE_DOCS_PAGE_COMPONENT__',
  pageSelector: '__LIVE_DOCS_PAGE_SELECTOR__',
  pageFile: '__LIVE_DOCS_PAGE_FILE__',
  exampleClass: '__LIVE_DOCS_EXAMPLE_CLASS__',
  exampleFile: '__LIVE_DOCS_EXAMPLE_FILE__',
  mermaidClass: '__LIVE_DOCS_MERMAID_CLASS__',
  mermaidFile: '__LIVE_DOCS_MERMAID_FILE__',
  facadeClass: '__LIVE_DOCS_FACADE_CLASS__',
  mockClass: '__LIVE_DOCS_MOCK_CLASS__',
  childDemoComponent: '__LIVE_DOCS_CHILD_DEMO_COMPONENT__',
  childDemoState: '__LIVE_DOCS_CHILD_DEMO_STATE__',
  childDemoStatus: '__LIVE_DOCS_CHILD_DEMO_STATUS__',
  childProjection: '__LIVE_DOCS_CHILD_PROJECTION__',
  childDemoClass: '__LIVE_DOCS_CHILD_DEMO_CLASS__',
  childDemoFile: '__LIVE_DOCS_CHILD_DEMO_FILE__',
  sectionId: '__LIVE_DOCS_SECTION_ID__',
  contentFile: '__LIVE_DOCS_CONTENT_FILE__',
} as const;

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
    .replace('live-docs-page.component', fileRenameTokens.pageComponent)
    .replace('live-docs.content', fileRenameTokens.content)
    .replace('live-docs-mermaid.directive', fileRenameTokens.mermaidDirective)
    .replace(
      'live-docs-code-viewer.component',
      fileRenameTokens.codeViewerComponent,
    )
    .replace('live-docs-example.component', fileRenameTokens.exampleComponent)
    .replace('live-docs-facade.service', fileRenameTokens.facadeService)
    .replace('live-docs.mock.service', fileRenameTokens.mockService)
    .replace(/live-docs-child-demo/g, fileRenameTokens.childDemo)
    .replace(/(^|\/)live-docs(?=\.|\/|$)/g, `$1${fileName}`)
    .replace(fileRenameTokens.pageComponent, `${fileName}-page.component`)
    .replace(fileRenameTokens.content, `${fileName}.content`)
    .replace(fileRenameTokens.mermaidDirective, `${fileName}-mermaid.directive`)
    .replace(
      fileRenameTokens.codeViewerComponent,
      `${fileName}-code-viewer.component`,
    )
    .replace(fileRenameTokens.exampleComponent, `${fileName}-example.component`)
    .replace(fileRenameTokens.facadeService, `${fileName}-facade.service`)
    .replace(fileRenameTokens.mockService, `${fileName}.mock.service`)
    .replace(fileRenameTokens.childDemo, `${fileName}-child-demo`);
}

function transformReferenceContent(
  content: string,
  normalized: ReturnType<typeof normalizeOptions>,
): string {
  const replacements: Array<[string | RegExp, string]> = [
    ['LiveDocsPageComponent', contentRenameTokens.pageComponent],
    ['app-live-docs-page', contentRenameTokens.pageSelector],
    ['live-docs-page.component', contentRenameTokens.pageFile],
    ['LiveDocsExampleComponent', contentRenameTokens.exampleClass],
    ['live-docs-example.component', contentRenameTokens.exampleFile],
    ['LiveDocsMermaidDirective', contentRenameTokens.mermaidClass],
    ['live-docs-mermaid.directive', contentRenameTokens.mermaidFile],
    ['LiveDocsFacadeService', contentRenameTokens.facadeClass],
    ['LiveDocsMockService', contentRenameTokens.mockClass],
    ['LiveDocsChildDemoComponent', contentRenameTokens.childDemoComponent],
    ['LiveDocsChildDemoState', contentRenameTokens.childDemoState],
    ['LiveDocsChildDemoStatus', contentRenameTokens.childDemoStatus],
    ['LiveDocsChildProjection', contentRenameTokens.childProjection],
    ['LiveDocsChildDemo', contentRenameTokens.childDemoClass],
    ['live-docs-child-demo', contentRenameTokens.childDemoFile],
    ['LiveDocsSectionId', contentRenameTokens.sectionId],
    ['live-docs.content', contentRenameTokens.contentFile],
    ['liveDocs', normalized.propertyName],
    ['LiveDocs', normalized.className],
    [/live-docs/g, normalized.fileName],
    [contentRenameTokens.pageComponent, `${normalized.className}PageComponent`],
    [
      contentRenameTokens.pageSelector,
      `${normalized.prefix}-${normalized.fileName}-page`,
    ],
    [contentRenameTokens.pageFile, `${normalized.fileName}-page.component`],
    [
      contentRenameTokens.exampleClass,
      `${normalized.className}ExampleComponent`,
    ],
    [
      contentRenameTokens.exampleFile,
      `${normalized.fileName}-example.component`,
    ],
    [
      contentRenameTokens.mermaidClass,
      `${normalized.className}MermaidDirective`,
    ],
    [
      contentRenameTokens.mermaidFile,
      `${normalized.fileName}-mermaid.directive`,
    ],
    [contentRenameTokens.facadeClass, `${normalized.className}FacadeService`],
    [contentRenameTokens.mockClass, `${normalized.className}MockService`],
    [
      contentRenameTokens.childDemoComponent,
      `${normalized.className}ChildDemoComponent`,
    ],
    [
      contentRenameTokens.childDemoState,
      `${normalized.className}ChildDemoState`,
    ],
    [
      contentRenameTokens.childDemoStatus,
      `${normalized.className}ChildDemoStatus`,
    ],
    [
      contentRenameTokens.childProjection,
      `${normalized.className}ChildProjection`,
    ],
    [contentRenameTokens.childDemoClass, `${normalized.className}ChildDemo`],
    [contentRenameTokens.childDemoFile, `${normalized.fileName}-child-demo`],
    [contentRenameTokens.sectionId, `${normalized.className}SectionId`],
    [contentRenameTokens.contentFile, `${normalized.fileName}.content`],
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
  const templateFiles = collectRelativeFiles(tree, liveDocsTemplateRoot);

  for (const relativePath of templateFiles) {
    const sourcePath = joinPathFragments(liveDocsTemplateRoot, relativePath);
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

  if (!normalized.skipFormat) {
    await formatFiles(tree);
  }
}
