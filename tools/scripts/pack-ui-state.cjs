#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const workspaceRoot = process.cwd();
const packageRoot = path.join(workspaceRoot, 'dist', 'libs', 'ui-state');
const cacheRoot = path.join(
  os.tmpdir(),
  'machine-state-component-ui-state-pack-cache',
);

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
run(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['pack', '--cache', cacheRoot],
  {
    cwd: packageRoot,
  },
);
