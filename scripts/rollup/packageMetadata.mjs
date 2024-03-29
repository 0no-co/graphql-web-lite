import semver from 'semver';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const rootPkg = require('../../package.json');
const parsedVersion = semver.parse(rootPkg.version);

const versionInfo = {
  major: parsedVersion.major,
  minor: parsedVersion.minor,
  patch: parsedVersion.patch,
  preReleaseTag: parsedVersion.prerelease ? parsedVersion.prerelease.join('.') : null,
  lite: true,
};

export const version = `
export const version = ${JSON.stringify(parsedVersion.raw)};
export const versionInfo = ${JSON.stringify(versionInfo)};
`.trim();
