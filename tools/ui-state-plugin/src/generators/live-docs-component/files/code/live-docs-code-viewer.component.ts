import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

type LiveDocsCodeTokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'literal'
  | 'type'
  | 'type-ref'
  | 'function'
  | 'decorator'
  | 'number'
  | 'operator'
  | 'punctuation';

interface LiveDocsCodeToken {
  kind: LiveDocsCodeTokenKind;
  value: string;
}

interface LiveDocsCodeLine {
  number: number;
  tokens: LiveDocsCodeToken[];
}

const LIVE_DOCS_TS_KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'else',
  'export',
  'extends',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'interface',
  'let',
  'new',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'satisfies',
  'switch',
  'throw',
  'try',
  'type',
  'typeof',
  'var',
  'void',
  'while',
]);

const LIVE_DOCS_TS_LITERALS = new Set([
  'false',
  'null',
  'true',
  'undefined',
  'unknown',
]);

const LIVE_DOCS_TS_TYPES = new Set([
  'Array',
  'Promise',
  'Record',
  'ReturnType',
  'Signal',
  'boolean',
  'never',
  'number',
  'object',
  'string',
  'void',
]);

const LIVE_DOCS_TS_OPERATORS =
  /^(=>|===|!==|==|!=|<=|>=|\?\?|\|\||&&|=|\+|-|\*|\/|%|!|<|>|&|\|)$/;
const LIVE_DOCS_TS_PUNCTUATION = /^[{}()[\].,;:]$/;
const LIVE_DOCS_TS_TOKEN_REGEX =
  /(\s+|\/\/.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|=>|===|!==|==|!=|<=|>=|\?\?|\|\||&&|[{}()[\].,;:]|[=+\-*/%!<>|&]+|@[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*)/g;

@Component({
  selector: 'app-live-docs-code-viewer',
  standalone: true,
  templateUrl: './live-docs-code-viewer.component.html',
  styleUrl: './live-docs-code-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveDocsCodeViewerComponent {
  readonly code = input.required<string>();

  readonly lines = computed<LiveDocsCodeLine[]>(() =>
    this.code()
      .replace(/\t/g, '  ')
      .split('\n')
      .map((line, index) => ({
        number: index + 1,
        tokens: tokenizeLine(line),
      })),
  );
}

function tokenizeLine(line: string): LiveDocsCodeToken[] {
  if (line.length === 0) {
    return [{ kind: 'plain', value: '' }];
  }

  const matches = [...line.matchAll(LIVE_DOCS_TS_TOKEN_REGEX)];
  const tokens: LiveDocsCodeToken[] = [];

  for (const match of matches) {
    const token = match[0];
    const index = match.index ?? 0;
    const suffix = line.slice(index + token.length);

    tokens.push({
      kind: classifyToken(token, suffix),
      value: token,
    });
  }

  return tokens.length > 0 ? tokens : [{ kind: 'plain', value: line }];
}

function classifyToken(token: string, suffix: string): LiveDocsCodeTokenKind {
  if (/^\s+$/.test(token)) {
    return 'plain';
  }

  if (token.startsWith('//')) {
    return 'comment';
  }

  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
    return 'string';
  }

  if (token.startsWith('@')) {
    return 'decorator';
  }

  if (/^\d/.test(token)) {
    return 'number';
  }

  if (LIVE_DOCS_TS_KEYWORDS.has(token)) {
    return 'keyword';
  }

  if (LIVE_DOCS_TS_LITERALS.has(token)) {
    return 'literal';
  }

  if (LIVE_DOCS_TS_TYPES.has(token)) {
    return 'type';
  }

  if (LIVE_DOCS_TS_OPERATORS.test(token)) {
    return 'operator';
  }

  if (LIVE_DOCS_TS_PUNCTUATION.test(token)) {
    return 'punctuation';
  }

  if (/^[A-Z]/.test(token)) {
    return 'type-ref';
  }

  if (/^\s*\(/.test(suffix)) {
    return 'function';
  }

  return 'plain';
}
