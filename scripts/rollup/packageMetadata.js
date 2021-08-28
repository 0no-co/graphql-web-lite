const rootPkg = require('../../package.json');
const gqlPkg = require('graphql/package.json');

export default JSON.stringify(
  {
    ...gqlPkg,
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
