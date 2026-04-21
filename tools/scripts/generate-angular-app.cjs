#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

function printUsage() {
  console.error(
    'Usage: npm run gen:app -- <app-name-or-path> [additional nx options]',
  );
  console.error(
    'Example: npm run gen:app -- schematics-lab --routing --ssr=false',
  );
}

const [, , rawTarget, ...restArgs] = process.argv;

if (!rawTarget || rawTarget.startsWith('-')) {
  printUsage();
  process.exit(1);
}

const normalizedInput = rawTarget.replace(/\\/g, '/');
const normalizedPath = path.posix
  .normalize(normalizedInput)
  .replace(/^(\.\/)+/, '')
  .replace(/^\/+/, '');

if (
  !normalizedPath ||
  normalizedPath === '.' ||
  normalizedPath.startsWith('../')
) {
  console.error(`Invalid app path: "${rawTarget}"`);
  process.exit(1);
}

const targetPath = normalizedPath.startsWith('apps/')
  ? normalizedPath
  : `apps/${normalizedPath}`;

const commandArgs = [
  'nx',
  'g',
  '@nx/angular:application',
  targetPath,
  '--no-interactive',
  ...restArgs,
];

const child = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  commandArgs,
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      NX_DAEMON: process.env.NX_DAEMON ?? 'false',
      NX_ISOLATE_PLUGINS: process.env.NX_ISOLATE_PLUGINS ?? 'false',
    },
  },
);

if (child.error) {
  throw child.error;
}

process.exit(child.status ?? 1);
