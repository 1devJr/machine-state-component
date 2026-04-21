#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const workspaceRoot = process.cwd();
const packageRoot = path.join(workspaceRoot, 'dist', 'libs', 'ui-state');
const cacheRoot = path.join(
  os.tmpdir(),
  'machine-state-component-ui-state-publish-cache',
);
const isDryRun = process.argv.includes('--dry-run');

function run(command, args, options = {}) {
  const child = spawnSync(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    stdio: 'inherit',
    env: options.env ?? process.env,
  });

  if (child.error) {
    throw child.error;
  }

  if ((child.status ?? 1) !== 0) {
    process.exit(child.status ?? 1);
  }
}

run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
  'run',
  'build:ui-state',
]);

const publishArgs = ['publish', '--access', 'public', '--cache', cacheRoot];

if (isDryRun) {
  publishArgs.push('--dry-run');
}

run(process.platform === 'win32' ? 'npm.cmd' : 'npm', publishArgs, {
  cwd: packageRoot,
});
