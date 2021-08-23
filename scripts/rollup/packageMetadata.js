const rootPkg = require('../../package.json');
const gqlPkg = require('graphql/package.json');

export default JSON.stringify({
  ...gqlPkg,
  name: 'graphql-web-lite',
  version: gqlPkg.version + '-lite',
  homepage: rootPkg.homepage,
  bugs: rootPkg.bugs,
  repository: rootPkg.repository,
}, null, 2);
