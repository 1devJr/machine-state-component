#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const packageJsonPath = path.join(
  process.cwd(),
  'libs',
  'ui-state',
  'package.json',
);
const allowedReleaseTypes = new Set(['major', 'minor', 'patch']);
const explicitVersionPattern =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function printUsage() {
  console.error('Usage: npm run version:ui-state -- <major|minor|patch|x.y.z>');
}

function parseVersion(version) {
  const match =
    /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.exec(version);

  if (!match) {
    throw new Error(`Invalid semantic version "${version}".`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpVersion(currentVersion, releaseType) {
  const parsed = parseVersion(currentVersion);

  switch (releaseType) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    default:
      throw new Error(`Unsupported release type "${releaseType}".`);
  }
}

const [, , rawTarget] = process.argv;

if (!rawTarget) {
  printUsage();
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

const nextVersion = allowedReleaseTypes.has(rawTarget)
  ? bumpVersion(currentVersion, rawTarget)
  : explicitVersionPattern.test(rawTarget)
    ? rawTarget
    : null;

if (!nextVersion) {
  printUsage();
  process.exit(1);
}

packageJson.version = nextVersion;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(nextVersion);
