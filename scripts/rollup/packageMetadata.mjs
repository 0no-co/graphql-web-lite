import semver from 'semver';
import * as url from 'url';
import * as path from 'path';
import { createRequire } from 'node:module';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const rootPkg = require('../../package.json');
const gqlPkg = require('graphql/package.json');
const parsedVersion = semver.parse(rootPkg.version);

const versionInfo = {
  major: parsedVersion.major,
  minor: parsedVersion.minor,
  patch: parsedVersion.patch,
  preReleaseTag: 'lite',
  lite: true,
};

export const version = `
export const version = ${JSON.stringify(rootPkg.version)};
export const versionInfo = ${JSON.stringify(versionInfo)};
`.trim();

export const packageMetadata = JSON.stringify(
  {
    ...gqlPkg,
    private: undefined,
    publishConfig: undefined,
    name: 'graphql-web-lite',
    version: rootPkg.version,
    sideEffects: false,
    homepage: rootPkg.homepage,
    bugs: rootPkg.bugs,
    repository: rootPkg.repository,
    keywords: rootPkg.keywords,
  },
  null,
  2
);

export const importMap = require('./importMap.json');
